import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Location from 'expo-location'

import { RootStackParamList } from '../../App'
import { useRoomStore } from '../stores/roomStore'
import { searchRestaurants } from '../services/placesService'
import { saveCandidates } from '../services/roomService'

type ModeSelectNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ModeSelect'>

// ── 模式資料 ──────────────────────────────────────────────

const MODES = [
  {
    key: 'tinder' as const,
    icon: '❤️',
    title: '交友軟體模式',
    desc: '左滑跳過，右滑喜歡\n全員配對即決定',
    bgColor: '#FFF0F0',
    borderColor: '#FF6B6B',
    textColor: '#FF6B6B',
    screen: 'TinderMode' as keyof RootStackParamList,
  },
  {
    key: 'midpoint' as const,
    icon: '📍',
    title: '中點模式',
    desc: '自動找出大家都方便\n到達的餐廳',
    bgColor: '#F0F4FF',
    borderColor: '#5352ED',
    textColor: '#5352ED',
    screen: 'MidpointMode' as keyof RootStackParamList,
  },
  {
    key: 'vote' as const,
    icon: '🗳️',
    title: '投票模式',
    desc: '匿名投票\n支援同機或線上',
    bgColor: '#F0FFF4',
    borderColor: '#26de81',
    textColor: '#20bf6b',
    screen: 'VoteMode' as keyof RootStackParamList,
  },
]

const SEARCH_RADIUS = 2000

// ── 主元件 ────────────────────────────────────────────────

export default function ModeSelectScreen() {
  const navigation = useNavigation<ModeSelectNavigationProp>()
  const { roomId, foodType, foodEmoji, actions } = useRoomStore()

  const [loadingMode, setLoadingMode] = useState<string | null>(null)

  // ── 選擇模式，搜尋餐廳後導航 ─────────────────────────────

  const handleSelectMode = async (mode: typeof MODES[number]) => {
    if (loadingMode) return

    try {
      setLoadingMode(mode.key)

      // 1. 取得定位權限
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('需要定位權限', '請在設定中允許存取位置，以搜尋附近餐廳')
        return
      }

      // 2. 取得目前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const { latitude: lat, longitude: lng } = location.coords

      // 3. 搜尋附近餐廳
      const restaurants = await searchRestaurants(lat, lng, SEARCH_RADIUS, foodType)

      if (restaurants.length === 0) {
        Alert.alert('附近沒有餐廳', `在 ${SEARCH_RADIUS / 1000} 公里內找不到「${foodType}」的餐廳，請嘗試其他類型`)
        return
      }

      // 4. 轉換成 candidates 格式
      const candidates = restaurants.map((r) => ({
        place_id: r.place_id,
        name: r.name,
        address: r.vicinity,
        rating: r.rating,
        price_level: r.price_level,
        photo_url: r.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${r.photo_reference}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY}`
          : '',
        lat: r.lat,
        lng: r.lng,
      }))

      // 5. 儲存候選餐廳到 Supabase
      await saveCandidates(roomId, candidates)

      // 6. 更新 Zustand store
      actions.setCandidates(candidates)

      // 7. 更新房間模式
      actions.setRoom({
        roomId: useRoomStore.getState().roomId,
        roomCode: useRoomStore.getState().roomCode,
        foodType,
        foodEmoji,
        mode: mode.key,
      })

      // 8. 導航到對應模式畫面
      navigation.navigate(mode.screen)
    } catch (err: any) {
      Alert.alert('搜尋餐廳失敗', err?.message ?? '請稍後再試')
    } finally {
      setLoadingMode(null)
    }
  }

  // ── UI ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 輪盤結果展示 ── */}
        <View style={styles.resultBanner}>
          <Text style={styles.resultEmoji}>{foodEmoji}</Text>
          <Text style={styles.resultFoodType}>{foodType || '隨機'}</Text>
          <Text style={styles.resultHint}>已選擇食物類型</Text>
        </View>

        {/* ── 副標題 ── */}
        <Text style={styles.sectionTitle}>選擇今天的決策模式</Text>
        <Text style={styles.sectionSubtitle}>選好後將自動搜尋附近 {SEARCH_RADIUS / 1000} 公里內的餐廳</Text>

        {/* ── 模式卡片 ── */}
        {MODES.map((mode) => {
          const isLoading = loadingMode === mode.key
          const isDisabled = loadingMode !== null

          return (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.card,
                { backgroundColor: mode.bgColor, borderColor: mode.borderColor },
                isDisabled && styles.cardDisabled,
              ]}
              onPress={() => handleSelectMode(mode)}
              disabled={isDisabled}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{mode.icon}</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: mode.textColor }]}>
                  {mode.title}
                </Text>
                <Text style={styles.cardDesc}>{mode.desc}</Text>
              </View>

              <View style={styles.cardRight}>
                {isLoading ? (
                  <ActivityIndicator color={mode.textColor} />
                ) : (
                  <Text style={[styles.cardArrow, { color: mode.textColor }]}>›</Text>
                )}
              </View>
            </TouchableOpacity>
          )
        })}

        {/* 搜尋中提示 */}
        {loadingMode && (
          <View style={styles.loadingHint}>
            <ActivityIndicator color="#FF6B35" size="small" />
            <Text style={styles.loadingHintText}>正在搜尋附近的{foodType}餐廳...</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

// ── 樣式 ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // 輪盤結果 Banner
  resultBanner: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 28,
    backgroundColor: '#FFF4EF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  resultFoodType: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF6B35',
    letterSpacing: 1,
  },
  resultHint: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 6,
  },

  // 副標題
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
  },

  // 模式卡片
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardLeft: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  cardRight: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrow: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },

  // 搜尋中提示
  loadingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: '#FFF4EF',
    borderRadius: 12,
  },
  loadingHintText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
})
