import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../App'
import { useRoomStore, Candidate } from '../stores/roomStore'
import { submitSwipe, checkMatch } from '../services/roomService'

type TinderModeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TinderMode'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3
const CARD_WIDTH = SCREEN_WIDTH - 48
const PRIMARY = '#FF6B35'

// ── 評分顯示 ──────────────────────────────────────────────

function renderStars(rating: number) {
  return `⭐ ${rating.toFixed(1)}`
}

function renderPrice(level: number) {
  return level > 0 ? '$'.repeat(level) : '-'
}

// ── 單張餐廳卡片 ──────────────────────────────────────────

interface CardProps {
  candidate: Candidate
  isTop: boolean
  panHandlers: object
  animatedStyle: object
}

function RestaurantCard({ candidate, isTop, panHandlers, animatedStyle }: CardProps) {
  return (
    <Animated.View
      style={[styles.card, isTop ? animatedStyle : styles.cardBehind]}
      {...(isTop ? panHandlers : {})}
    >
      {/* 餐廳圖片佔位 */}
      <View style={styles.cardImagePlaceholder}>
        <Text style={styles.cardImageEmoji}>🍽️</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {candidate.name}
        </Text>

        <View style={styles.cardMeta}>
          <Text style={styles.cardRating}>{renderStars(candidate.rating)}</Text>
          <Text style={styles.cardPrice}>{renderPrice(candidate.price_level)}</Text>
        </View>

        <Text style={styles.cardAddress} numberOfLines={2}>
          📍 {candidate.address}
        </Text>
      </View>
    </Animated.View>
  )
}

// ── 主元件 ────────────────────────────────────────────────

export default function TinderModeScreen() {
  const navigation = useNavigation<TinderModeNavigationProp>()
  const { roomId, myName, candidates, actions } = useRoomStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // 動畫值
  const position = useRef(new Animated.ValueXY()).current

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  })

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  }

  // ── 滑動後處理 ────────────────────────────────────────────

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isProcessing || currentIndex >= candidates.length) return
    setIsProcessing(true)

    const candidate = candidates[currentIndex]

    try {
      await submitSwipe(roomId, myName, candidate.place_id, direction)

      if (direction === 'right') {
        const matched = await checkMatch(roomId, candidate.place_id)
        if (matched) {
          actions.setFinalPlace(candidate)
          navigation.navigate('Result')
          return
        }
      }
    } catch (err: any) {
      Alert.alert('錯誤', err?.message ?? '操作失敗，請稍後再試')
    }

    // 移到下一張
    position.setValue({ x: 0, y: 0 })
    setCurrentIndex((prev) => prev + 1)
    setIsProcessing(false)
  }

  // ── PanResponder ──────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // 右滑：飛出右側
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(() => handleSwipe('right'))
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // 左滑：飛出左側
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(() => handleSwipe('left'))
        } else {
          // 未達閾值：彈回中心
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  // ── 按鈕操作 ─────────────────────────────────────────────

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    if (isProcessing || currentIndex >= candidates.length) return
    const targetX = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100
    Animated.timing(position, {
      toValue: { x: targetX, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => handleSwipe(direction))
  }

  // ── 全部滑完 ─────────────────────────────────────────────

  const isFinished = currentIndex >= candidates.length

  if (isFinished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😢</Text>
          <Text style={styles.emptyTitle}>沒有配對成功</Text>
          <Text style={styles.emptySubtitle}>所有餐廳都滑完了，但沒有全員配對的餐廳</Text>
          <TouchableOpacity
            style={styles.restartBtn}
            onPress={() => {
              position.setValue({ x: 0, y: 0 })
              setCurrentIndex(0)
            }}
          >
            <Text style={styles.restartBtnText}>🔄 重新開始</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>返回選擇模式</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const topCard = candidates[currentIndex]
  const nextCard = candidates[currentIndex + 1] ?? null

  // ── UI ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>交友軟體模式</Text>
        <Text style={styles.headerCount}>
          {currentIndex + 1} / {candidates.length}
        </Text>
      </View>

      {/* ── 操作提示 ── */}
      <View style={styles.hintRow}>
        <View style={[styles.hintBadge, { backgroundColor: '#FFE5E5' }]}>
          <Text style={styles.hintText}>← 左滑跳過</Text>
        </View>
        <View style={[styles.hintBadge, { backgroundColor: '#E5FFE9' }]}>
          <Text style={styles.hintText}>右滑喜歡 →</Text>
        </View>
      </View>

      {/* ── 卡片堆疊區 ── */}
      <View style={styles.cardStack}>
        {/* 第二張（後面，縮小偏移） */}
        {nextCard && (
          <RestaurantCard
            candidate={nextCard}
            isTop={false}
            panHandlers={{}}
            animatedStyle={{}}
          />
        )}

        {/* 第一張（最上層，可拖曳） */}
        <RestaurantCard
          candidate={topCard}
          isTop
          panHandlers={panResponder.panHandlers}
          animatedStyle={cardStyle}
        />
      </View>

      {/* ── 底部按鈕 ── */}
      <View style={styles.actions}>
        {/* 跳過 */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSkip]}
          onPress={() => handleButtonSwipe('left')}
          disabled={isProcessing}
        >
          <Text style={styles.actionBtnText}>✕</Text>
        </TouchableOpacity>

        {/* 收藏（僅 UI，不計入配對） */}
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnStar]}>
          <Text style={styles.actionBtnText}>⭐</Text>
        </TouchableOpacity>

        {/* 喜歡 */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnLike]}
          onPress={() => handleButtonSwipe('right')}
          disabled={isProcessing}
        >
          <Text style={styles.actionBtnText}>♥</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ── 樣式 ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    fontSize: 32,
    color: PRIMARY,
    lineHeight: 36,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  headerCount: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },

  // 提示列
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  hintBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },

  // 卡片堆疊
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardBehind: {
    transform: [{ scale: 0.94 }, { translateY: 16 }],
    opacity: 0.85,
  },

  // 卡片圖片
  cardImagePlaceholder: {
    height: 200,
    backgroundColor: '#FFF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageEmoji: {
    fontSize: 72,
  },

  // 卡片內容
  cardBody: {
    padding: 20,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    marginBottom: 10,
    lineHeight: 28,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  cardRating: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardAddress: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },

  // 底部操作按鈕
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnSkip: {
    backgroundColor: '#FFE5E5',
  },
  actionBtnStar: {
    backgroundColor: '#FFF8E5',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  actionBtnLike: {
    backgroundColor: '#E5FFE9',
  },
  actionBtnText: {
    fontSize: 26,
  },

  // 全部滑完畫面
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  restartBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  restartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 12,
  },
  backBtnText: {
    color: '#999',
    fontSize: 15,
  },
})
