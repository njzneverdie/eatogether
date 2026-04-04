import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MapView, { Marker, Region } from 'react-native-maps'

import { RootStackParamList } from '../../App'
import { useRoomStore, Candidate, Member } from '../stores/roomStore'

type MidpointModeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MidpointMode'>

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAP_HEIGHT = SCREEN_HEIGHT * 0.4
const WALK_SPEED = 80 // 公尺/分鐘
const PRIMARY = '#FF6B35'

// ── 工具函數 ──────────────────────────────────────────────

/** 計算兩點之間的直線距離（公尺），使用 Haversine 公式 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // 地球半徑（公尺）
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 計算步行時間（分鐘） */
function walkingMinutes(distanceM: number): number {
  return Math.round(distanceM / WALK_SPEED)
}

/** 計算所有成員的幾何中點 */
function calcMidpoint(members: Member[]): { lat: number; lng: number } | null {
  const valid = members.filter((m) => m.lat !== 0 || m.lng !== 0)
  if (valid.length === 0) return null
  const lat = valid.reduce((sum, m) => sum + m.lat, 0) / valid.length
  const lng = valid.reduce((sum, m) => sum + m.lng, 0) / valid.length
  return { lat, lng }
}

// ── 每間餐廳的分析結果 ────────────────────────────────────

interface RestaurantAnalysis {
  candidate: Candidate
  walkTimes: { name: string; minutes: number }[]
  maxTime: number
  minTime: number
  timeDiff: number
}

// ── 主元件 ────────────────────────────────────────────────

export default function MidpointModeScreen() {
  const navigation = useNavigation<MidpointModeNavigationProp>()
  const { members, candidates, myName, actions } = useRoomStore()
  const isWeb = Platform.OS === 'web'
  const mapRef = useRef<MapView>(null)

  // ── 計算中點 ──────────────────────────────────────────────

  const midpoint = useMemo(() => calcMidpoint(members), [members])

  // ── 計算每間餐廳的步行分析，依時間差排序 ─────────────────

  const analyses = useMemo<RestaurantAnalysis[]>(() => {
    const validMembers = members.filter((m) => m.lat !== 0 || m.lng !== 0)

    return candidates
      .map((c) => {
        const walkTimes = validMembers.map((m) => ({
          name: m.name,
          minutes: walkingMinutes(haversineDistance(m.lat, m.lng, c.lat, c.lng)),
        }))
        const times = walkTimes.map((w) => w.minutes)
        const maxTime = Math.max(...times, 0)
        const minTime = Math.min(...times, 0)
        const timeDiff = maxTime - minTime
        return { candidate: c, walkTimes, maxTime, minTime, timeDiff }
      })
      .sort((a, b) => a.timeDiff - b.timeDiff)
  }, [candidates, members])

    // ── 移動地圖到中點（僅手機版）────────────────────────────────────────

  useEffect(() => {
    if (isWeb || !midpoint) return
    const region: Region = {
      latitude: midpoint.lat,
      longitude: midpoint.lng,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    }
    setTimeout(() => mapRef.current?.animateToRegion(region, 800), 300)
  }, [midpoint, isWeb])

  // ── 確認選擇餐廳 ──────────────────────────────────────────

  const handleSelect = (candidate: Candidate) => {
    Alert.alert(
      '確認選擇',
      `確定選擇「${candidate.name}」嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'default',
          onPress: () => {
            actions.setFinalPlace(candidate)
            navigation.navigate('Result')
          },
        },
      ]
    )
  }

  // ── 地圖初始區域 ─────────────────────────────────────────

  const initialRegion: Region = midpoint
    ? {
        latitude: midpoint.lat,
        longitude: midpoint.lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : {
        latitude: 25.033,
        longitude: 121.565,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }

  // ── UI ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>中點模式</Text>
        <View style={{ width: 36 }} />
      </View>

            {/* ── 地圖 ── */}
      {isWeb ? (
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webMapIcon}>🗺️</Text>
          <Text style={styles.webMapText}>地圖功能僅支援手機版</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
        >
          {/* 自己的位置（橘色）*/}
          {members
            .filter((m) => m.name === myName && (m.lat !== 0 || m.lng !== 0))
            .map((m) => (
              <Marker
                key={`self-${m.id}`}
                coordinate={{ latitude: m.lat, longitude: m.lng }}
                title={`${m.name}（我）`}
                pinColor={PRIMARY}
              />
            ))}

          {/* 其他成員（藍色）*/}
          {members
            .filter((m) => m.name !== myName && (m.lat !== 0 || m.lng !== 0))
            .map((m) => (
              <Marker
                key={`member-${m.id}`}
                coordinate={{ latitude: m.lat, longitude: m.lng }}
                title={m.name}
                pinColor="#5352ED"
              />
            ))}

          {/* 幾何中點（星星）*/}
          {midpoint && (
            <Marker
              coordinate={{ latitude: midpoint.lat, longitude: midpoint.lng }}
              title="幾何中點"
            >
              <View style={styles.midpointMarker}>
                <Text style={styles.midpointMarkerText}>⭐</Text>
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* ── 中點說明 ── */}
      {midpoint && (
        <View style={styles.midpointBanner}>
          <Text style={styles.midpointBannerText}>
            ⭐ 幾何中點：{midpoint.lat.toFixed(4)}, {midpoint.lng.toFixed(4)}
          </Text>
        </View>
      )}

      {/* ── 餐廳列表 ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listTitle}>
          附近餐廳（依步行時間差排序）
        </Text>

        {analyses.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>目前沒有候選餐廳</Text>
          </View>
        )}

        {analyses.map((item, idx) => {
          const isBest = idx === 0
          return (
            <TouchableOpacity
              key={item.candidate.place_id}
              style={[styles.restaurantCard, isBest && styles.restaurantCardBest]}
              onPress={() => handleSelect(item.candidate)}
              activeOpacity={0.8}
            >
              {/* 最均衡 badge */}
              {isBest && (
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>✅ 最均衡</Text>
                </View>
              )}

              {/* 餐廳基本資訊 */}
              <Text style={styles.restaurantName} numberOfLines={1}>
                {item.candidate.name}
              </Text>
              <View style={styles.restaurantMeta}>
                <Text style={styles.restaurantRating}>
                  ⭐ {item.candidate.rating.toFixed(1)}
                </Text>
                <Text style={styles.restaurantPrice}>
                  {'$'.repeat(item.candidate.price_level || 1)}
                </Text>
              </View>
              <Text style={styles.restaurantAddress} numberOfLines={1}>
                📍 {item.candidate.address}
              </Text>

              {/* 每位成員步行時間 */}
              <View style={styles.walkTimeRow}>
                {item.walkTimes.map((wt) => (
                  <View key={wt.name} style={styles.walkTimeChip}>
                    <Text style={styles.walkTimeName}>{wt.name}</Text>
                    <Text style={styles.walkTimeValue}>{wt.minutes} 分鐘</Text>
                  </View>
                ))}
              </View>

              {/* 時間差 */}
              <Text style={styles.timeDiff}>
                最大時間差：
                <Text style={{ fontWeight: '800', color: isBest ? '#20bf6b' : '#FF6B35' }}>
                  {item.timeDiff} 分鐘
                </Text>
              </Text>

              {/* 選擇按鈕 */}
              <TouchableOpacity
                style={[styles.selectBtn, isBest && styles.selectBtnBest]}
                onPress={() => handleSelect(item.candidate)}
              >
                <Text style={styles.selectBtnText}>選這間 →</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
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

    // 地圖
  map: {
    width: '100%',
    height: MAP_HEIGHT,
  },

  // Web 版地圖佔位區塊
  webMapPlaceholder: {
    width: '100%',
    height: MAP_HEIGHT,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3F0',
  },
  webMapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  webMapText: {
    fontSize: 15,
    color: '#5352ED',
    fontWeight: '600',
  },

  // 中點 Marker
  midpointMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFC312',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  midpointMarkerText: {
    fontSize: 22,
  },

  // 中點說明列
  midpointBanner: {
    backgroundColor: '#FFF8E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  midpointBannerText: {
    fontSize: 12,
    color: '#888',
  },

  // 餐廳列表
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
    marginBottom: 12,
  },

  // 餐廳卡片
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantCardBest: {
    borderColor: '#20bf6b',
    backgroundColor: '#F0FFF4',
  },

  // 最均衡 badge
  bestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#20bf6b',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  restaurantName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222',
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  restaurantRating: {
    fontSize: 13,
    color: '#555',
  },
  restaurantPrice: {
    fontSize: 13,
    color: '#888',
    letterSpacing: 1,
  },
  restaurantAddress: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },

  // 步行時間
  walkTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  walkTimeChip: {
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  walkTimeName: {
    fontSize: 11,
    color: '#5352ED',
    fontWeight: '600',
  },
  walkTimeValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },

  timeDiff: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },

  // 選擇按鈕
  selectBtn: {
    alignSelf: 'flex-end',
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  selectBtnBest: {
    backgroundColor: '#20bf6b',
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#bbb',
  },
})
