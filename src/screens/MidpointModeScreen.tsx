import React, { useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../App'
import { useRoomStore, Candidate, Member } from '../stores/roomStore'

type Nav = NativeStackNavigationProp<RootStackParamList, 'MidpointMode'>
const WALK_SPEED = 80
const PRIMARY = '#FF6B35'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function walkingMinutes(d: number) { return Math.round(d / WALK_SPEED) }

function calcMidpoint(members: Member[]) {
  const valid = members.filter(m => m.lat !== 0 || m.lng !== 0)
  if (!valid.length) return null
  return {
    lat: valid.reduce((s, m) => s + m.lat, 0) / valid.length,
    lng: valid.reduce((s, m) => s + m.lng, 0) / valid.length,
  }
}

export default function MidpointModeScreen() {
  const navigation = useNavigation<Nav>()
  const { members, candidates, myName, actions } = useRoomStore()
  const midpoint = useMemo(() => calcMidpoint(members), [members])

  const analyses = useMemo(() => {
    const valid = members.filter(m => m.lat !== 0 || m.lng !== 0)
    return candidates.map(c => {
      const walkTimes = valid.map(m => ({
        name: m.name,
        minutes: walkingMinutes(haversineDistance(m.lat, m.lng, c.lat, c.lng)),
      }))
      const times = walkTimes.map(w => w.minutes)
      const maxTime = Math.max(...times, 0)
      const minTime = Math.min(...times, 0)
      return { candidate: c, walkTimes, maxTime, minTime, timeDiff: maxTime - minTime }
    }).sort((a, b) => a.timeDiff - b.timeDiff)
  }, [candidates, members])

  const handleSelect = (candidate: Candidate) => {
    Alert.alert('確認選擇', `確定選擇「${candidate.name}」嗎？`, [
      { text: '取消', style: 'cancel' },
      { text: '確定', onPress: () => { actions.setFinalPlace(candidate); navigation.navigate('Result') } },
    ])
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>中點模式</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapText}>地圖功能僅支援手機版</Text>
        {midpoint && (
          <Text style={styles.midpointText}>
            ⭐ 幾何中點：{midpoint.lat.toFixed(4)}, {midpoint.lng.toFixed(4)}
          </Text>
        )}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.listTitle}>附近餐廳（依步行時間差排序）</Text>
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
              style={[styles.card, isBest && styles.cardBest]}
              onPress={() => handleSelect(item.candidate)}
              activeOpacity={0.8}
            >
              {isBest && <View style={styles.badge}><Text style={styles.badgeText}>✅ 最均衡</Text></View>}
              <Text style={styles.name} numberOfLines={1}>{item.candidate.name}</Text>
              <View style={styles.meta}>
                <Text style={styles.rating}>⭐ {item.candidate.rating.toFixed(1)}</Text>
                <Text style={styles.price}>{'$'.repeat(item.candidate.price_level || 1)}</Text>
              </View>
              <Text style={styles.address} numberOfLines={1}>📍 {item.candidate.address}</Text>
              <View style={styles.walkRow}>
                {item.walkTimes.map(wt => (
                  <View key={wt.name} style={styles.chip}>
                    <Text style={styles.chipName}>{wt.name}</Text>
                    <Text style={styles.chipTime}>{wt.minutes} 分鐘</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.diff}>
                最大時間差：<Text style={{ fontWeight: '800', color: isBest ? '#20bf6b' : PRIMARY }}>{item.timeDiff} 分鐘</Text>
              </Text>
              <TouchableOpacity style={[styles.btn, isBest && styles.btnBest]} onPress={() => handleSelect(item.candidate)}>
                <Text style={styles.btnText}>選這間 →</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, color: PRIMARY },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
  mapPlaceholder: { height: Dimensions.get('window').height * 0.25, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#DDE3F0' },
  mapIcon: { fontSize: 40, marginBottom: 8 },
  mapText: { fontSize: 15, color: '#5352ED', fontWeight: '600' },
  midpointText: { fontSize: 11, color: '#888', marginTop: 6 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },
  listTitle: { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#bbb' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#EEE' },
  cardBest: { borderColor: '#20bf6b', backgroundColor: '#F0FFF4' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#20bf6b', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '800', color: '#222', marginBottom: 6 },
  meta: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  rating: { fontSize: 13, color: '#555' },
  price: { fontSize: 13, color: '#888' },
  address: { fontSize: 12, color: '#999', marginBottom: 10 },
  walkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: '#F0F4FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  chipName: { fontSize: 11, color: '#5352ED', fontWeight: '600' },
  chipTime: { fontSize: 12, color: '#333', fontWeight: '700' },
  diff: { fontSize: 13, color: '#666', marginBottom: 10 },
  btn: { alignSelf: 'flex-end', backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
  btnBest: { backgroundColor: '#20bf6b' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})