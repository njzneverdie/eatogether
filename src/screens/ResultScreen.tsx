import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../App'
import { useRoomStore } from '../stores/roomStore'

type ResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>

const PRIMARY = '#FF6B35'
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ── 渲染評分星星 ──────────────────────────────────────────

function renderStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

function renderPrice(level: number): string {
  return level > 0 ? '$'.repeat(level) : '-'
}

// ── 主元件 ────────────────────────────────────────────────

export default function ResultScreen() {
  const navigation = useNavigation<ResultNavigationProp>()
  const { finalPlace, foodEmoji, actions } = useRoomStore()

  // ── 進場動畫（從下方滑入）────────────────────────────────

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // ── Google Maps 導航 ──────────────────────────────────────

  const handleNavigate = async () => {
    if (!finalPlace) return

    const url =
      `https://www.google.com/maps/search/?api=1` +
      `&query=${encodeURIComponent(finalPlace.name)}` +
      `&query_place_id=${finalPlace.place_id}`

    const canOpen = await Linking.canOpenURL(url)
    if (!canOpen) {
      Alert.alert('無法開啟', '請確認已安裝 Google Maps 或瀏覽器')
      return
    }
    await Linking.openURL(url)
  }

  // ── 再玩一次 ─────────────────────────────────────────────

  const handlePlayAgain = () => {
    actions.reset()
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    })
  }

  // ── 沒有 finalPlace 時的 fallback ────────────────────────

  if (!finalPlace) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😅</Text>
          <Text style={styles.emptyTitle}>還沒有結果</Text>
          <Text style={styles.emptySubtitle}>請先完成選擇流程</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← 返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── UI ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── 頂部慶祝區塊 ── */}
        <Animated.View style={[styles.celebrationBlock, { opacity: fadeAnim }]}>
          <Text style={styles.confetti}>🎊🎉🎊</Text>
          <Text style={styles.celebrationTitle}>決定了！</Text>
          <Text style={styles.celebrationSubtitle}>今天就吃這間！</Text>
        </Animated.View>

        {/* ── 餐廳卡片（滑入動畫）── */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
          ]}
        >
          {/* 頂部裝飾 Banner */}
          <View style={styles.cardBanner}>
            <Text style={styles.cardBannerEmoji}>{foodEmoji || '🍽️'}</Text>
          </View>

          {/* 餐廳主資訊 */}
          <View style={styles.cardBody}>
            <Text style={styles.restaurantName}>{finalPlace.name}</Text>

            {/* 評分 & 價位 */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipStars}>
                  {renderStars(finalPlace.rating)}
                </Text>
                <Text style={styles.metaChipValue}>
                  {finalPlace.rating.toFixed(1)}
                </Text>
              </View>

              <View style={styles.metaChip}>
                <Text style={styles.metaChipValue}>
                  {renderPrice(finalPlace.price_level)}
                </Text>
              </View>
            </View>

            {/* 地址 */}
            <View style={styles.addressRow}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.addressText}>{finalPlace.address}</Text>
            </View>

            {/* place_id（小字） */}
            <Text style={styles.placeId} selectable>
              ID: {finalPlace.place_id}
            </Text>
          </View>

          {/* 分隔線 */}
          <View style={styles.divider} />

          {/* ── 按鈕區 ── */}
          <View style={styles.buttonArea}>
            {/* Google Maps 導航 */}
            <TouchableOpacity
              style={styles.navBtn}
              onPress={handleNavigate}
              activeOpacity={0.85}
            >
              <Text style={styles.navBtnIcon}>🗺️</Text>
              <Text style={styles.navBtnText}>用 Google Maps 導航</Text>
            </TouchableOpacity>

            {/* 再玩一次 */}
            <TouchableOpacity
              style={styles.againBtn}
              onPress={handlePlayAgain}
              activeOpacity={0.85}
            >
              <Text style={styles.againBtnText}>🔄 再玩一次</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 底部小字 */}
        <Animated.Text style={[styles.footerText, { opacity: fadeAnim }]}>
          一起吃 Eatogether 🍴
        </Animated.Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ── 樣式 ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // 頂部慶祝
  celebrationBlock: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  confetti: {
    fontSize: 36,
    marginBottom: 8,
    letterSpacing: 4,
  },
  celebrationTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 2,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  // 卡片
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  // 卡片頂部 banner
  cardBanner: {
    height: 160,
    backgroundColor: '#FFF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBannerEmoji: {
    fontSize: 80,
  },

  // 卡片內容
  cardBody: {
    padding: 24,
  },
  restaurantName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#222',
    marginBottom: 14,
    lineHeight: 32,
  },

  // 評分 & 價位 chips
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  metaChipStars: {
    fontSize: 13,
    color: '#FFC312',
    letterSpacing: 1,
  },
  metaChipValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },

  // 地址
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  addressIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // place_id
  placeId: {
    fontSize: 10,
    color: '#CCC',
    marginTop: 4,
  },

  // 分隔線
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 24,
  },

  // 按鈕區
  buttonArea: {
    padding: 24,
    gap: 12,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  navBtnIcon: {
    fontSize: 20,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  againBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 14,
  },
  againBtnText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },

  // 底部小字
  footerText: {
    marginTop: 28,
    fontSize: 13,
    color: '#DDD',
    letterSpacing: 0.5,
  },

  // Fallback（無 finalPlace）
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 28,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  backBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
})
