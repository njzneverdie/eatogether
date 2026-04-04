import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../App'
import { useRoomStore } from '../stores/roomStore'

type SpinWheelNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SpinWheel'>

const { width } = Dimensions.get('window')
const WHEEL_SIZE = width * 0.78
const SEGMENT_COUNT = 8

// ── 輪盤資料 ──────────────────────────────────────────────

const SEGMENTS = [
  { label: '日式', emoji: '🍣', color: '#FF6B6B' },
  { label: '麵食', emoji: '🍜', color: '#FF9F43' },
  { label: '燒肉', emoji: '🥩', color: '#EE5A24' },
  { label: '西式', emoji: '🍕', color: '#FFC312' },
  { label: '火鍋', emoji: '🍲', color: '#C4E538' },
  { label: '輕食', emoji: '🥗', color: '#12CBC4' },
  { label: '泰式', emoji: '🍛', color: '#5352ED' },
  { label: '中式', emoji: '🧆', color: '#FDA7DF' },
]

const SEGMENT_ANGLE = 360 / SEGMENT_COUNT   // 45 度
const PRIMARY = '#FF6B35'

// ── 主元件 ────────────────────────────────────────────────

export default function SpinWheelScreen() {
  const navigation = useNavigation<SpinWheelNavigationProp>()
  const { actions } = useRoomStore()

  const spinValue = useRef(new Animated.Value(0)).current
  const currentDeg = useRef(0)          // 目前累積角度（不 mod）

  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ label: string; emoji: string } | null>(null)

  // ── 旋轉邏輯 ─────────────────────────────────────────────

  const spin = () => {
    if (spinning) return

    setSpinning(true)
    setResult(null)

    // 至少旋轉 4 圈 + 隨機額外角度
    const extraDeg = Math.floor(Math.random() * 360)
    const totalDeg = currentDeg.current + 360 * 5 + extraDeg

    Animated.timing(spinValue, {
      toValue: totalDeg,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentDeg.current = totalDeg

      // 指針在頂部（270 度方向），計算停在哪個區塊
      // 輪盤順時針，第 0 格從 0 度起始
      const normalizedDeg = totalDeg % 360
      // 指針固定在 12 點鐘（相對角度 0）
      // 第 i 格中心角度 = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
      const pointerDeg = (360 - normalizedDeg + 270) % 360
      const index = Math.floor(pointerDeg / SEGMENT_ANGLE) % SEGMENT_COUNT

      const selected = SEGMENTS[index]
      setResult(selected)
      setSpinning(false)
    })
  }

  // ── 繼續按鈕 ─────────────────────────────────────────────

  const handleContinue = () => {
    if (!result) return
    actions.setRoom({
      roomId: useRoomStore.getState().roomId,
      roomCode: useRoomStore.getState().roomCode,
      foodType: result.label,
      foodEmoji: result.emoji,
      mode: useRoomStore.getState().mode as 'tinder' | 'midpoint' | 'vote',
    })
    navigation.navigate('ModeSelect')
  }

  // ── Animated 旋轉樣式 ────────────────────────────────────

  const rotate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  })

  // ── UI ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* 標題 */}
      <Text style={styles.title}>今天吃什麼？</Text>
      <Text style={styles.subtitle}>轉動輪盤，讓命運決定！</Text>

      {/* 輪盤 + 指針 */}
      <View style={styles.wheelWrapper}>
        {/* 旋轉輪盤 */}
        <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
          {SEGMENTS.map((seg, i) => (
            <WheelSegment key={seg.label} index={i} segment={seg} />
          ))}
        </Animated.View>

        {/* 中心圓 */}
        <View style={styles.centerCircle}>
          <Text style={styles.centerText}>🍴</Text>
        </View>

        {/* 右側三角形指針 */}
        <View style={styles.pointerWrapper}>
          <View style={styles.pointer} />
        </View>
      </View>

      {/* 結果顯示 */}
      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultEmoji}>{result.emoji}</Text>
          <Text style={styles.resultLabel}>{result.label}</Text>
        </View>
      ) : (
        <View style={styles.resultPlaceholder} />
      )}

      {/* 轉動按鈕 */}
      <TouchableOpacity
        style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
        onPress={spin}
        disabled={spinning}
        activeOpacity={0.85}
      >
        <Text style={styles.spinBtnText}>
          {spinning ? '旋轉中...' : '轉動！'}
        </Text>
      </TouchableOpacity>

      {/* 選好了按鈕 */}
      {result && !spinning && (
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>選好了！繼續 →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

// ── 單一輪盤扇形元件 ──────────────────────────────────────

interface WheelSegmentProps {
  index: number
  segment: { label: string; emoji: string; color: string }
}

function WheelSegment({ index, segment }: WheelSegmentProps) {
  const rotationDeg = index * SEGMENT_ANGLE
  const midAngleRad = (rotationDeg + SEGMENT_ANGLE / 2) * (Math.PI / 180)
  const radius = WHEEL_SIZE / 2

  // 文字位置：距離圓心 60% 半徑處
  const textRadius = radius * 0.62
  const textX = radius + textRadius * Math.cos(midAngleRad - Math.PI / 2) - 22
  const textY = radius + textRadius * Math.sin(midAngleRad - Math.PI / 2) - 22

  return (
    <View
      style={[
        styles.segment,
        {
          backgroundColor: segment.color,
          transform: [{ rotate: `${rotationDeg}deg` }],
        },
      ]}
    >
      {/* 扇形用 overflow hidden + skewY 近似視覺 */}
    </View>
  )
}

// ── 樣式 ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
    marginTop: 36,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
    marginBottom: 28,
  },

  // 輪盤外層
  wheelWrapper: {
    width: WHEEL_SIZE + 20,
    height: WHEEL_SIZE + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 輪盤本體：用多個絕對定位扇形組成
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    // 用 background segments 疊加
    // 以下用 conic-gradient 近似：React Native 不支援，改用多個半圓疊加
  },

  // 扇形（每格 45 度）
  segment: {
    position: 'absolute',
    width: WHEEL_SIZE / 2,
    height: WHEEL_SIZE / 2,
    left: WHEEL_SIZE / 2,
    top: 0,
    transformOrigin: '0% 100%',
  },

  // 中心裝飾圓
  centerCircle: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  centerText: {
    fontSize: 26,
  },

  // 右側指針
  pointerWrapper: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -12,
    zIndex: 20,
  },
  pointer: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderRightWidth: 24,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: PRIMARY,
  },

  // 結果
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EF',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 20,
    gap: 10,
  },
  resultEmoji: {
    fontSize: 36,
  },
  resultLabel: {
    fontSize: 26,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 1,
  },
  resultPlaceholder: {
    height: 70,
    marginTop: 20,
  },

  // 轉動按鈕
  spinBtn: {
    marginTop: 24,
    width: 180,
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  spinBtnDisabled: {
    opacity: 0.55,
  },
  spinBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // 繼續按鈕
  continueBtn: {
    marginTop: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  continueBtnText: {
    color: PRIMARY,
    fontSize: 17,
    fontWeight: '700',
  },
})
