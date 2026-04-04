import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../App'
import { useRoomStore, Candidate } from '../stores/roomStore'
import { submitVote, getVoteResults } from '../services/roomService'
import { supabase } from '../lib/supabase'

type VoteModeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VoteMode'>

const PRIMARY = '#FF6B35'
const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── 工具：產生隨機 session_id ─────────────────────────────

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

// ── 投票狀態型別 ──────────────────────────────────────────
// votes[placeId] = rank (1~3)，null 代表未選

type VoteMap = Record<string, number | null>

// ── 單人投票面板 ──────────────────────────────────────────

interface VotePanelProps {
  candidates: Candidate[]
  voterName: string
  votes: VoteMap
  onToggle: (placeId: string, rank: 1 | 2 | 3) => void
}

function VotePanel({ candidates, voterName, votes, onToggle }: VotePanelProps) {
  const RANKS: (1 | 2 | 3)[] = [1, 2, 3]
  const RANK_LABELS = ['🥇', '🥈', '🥉']

  return (
    <View>
      <View style={styles.voterBadge}>
        <Text style={styles.voterBadgeText}>👤 {voterName} 正在投票</Text>
      </View>

      <Text style={styles.voteTip}>每間餐廳最多選一個名次，最多選 3 間</Text>

      {candidates.map((c) => {
        const selected = votes[c.place_id] ?? null

        return (
          <View key={c.place_id} style={styles.voteRow}>
            {/* 餐廳資訊 */}
            <View style={styles.voteRowInfo}>
              <Text style={styles.voteRestaurantName} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={styles.voteRestaurantMeta}>
                ⭐ {c.rating.toFixed(1)}　📍 {c.address}
              </Text>
            </View>

            {/* 星星選擇 */}
            <View style={styles.rankRow}>
              {RANKS.map((rank) => {
                const isSelected = selected === rank
                return (
                  <TouchableOpacity
                    key={rank}
                    style={[
                      styles.rankBtn,
                      isSelected && styles.rankBtnSelected,
                    ]}
                    onPress={() => onToggle(c.place_id, rank)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.rankBtnText}>{RANK_LABELS[rank - 1]}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ── 主元件 ────────────────────────────────────────────────

export default function VoteModeScreen() {
  const navigation = useNavigation<VoteModeNavigationProp>()
  const { roomId, roomCode, myName, candidates, members, actions } = useRoomStore()

  // Tab：'local'（同機）| 'online'（線上）
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local')

  // ── 同機模式狀態 ──────────────────────────────────────────

  // 目前投票者順序（從 members 取名字）
  const voterNames = members.length > 0 ? members.map((m) => m.name) : [myName]
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0)
  const [allVotes, setAllVotes] = useState<VoteMap>({})   // 目前這位投票者的票
  const [submittingLocal, setSubmittingLocal] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // ── 線上投票狀態 ──────────────────────────────────────────

  const [onlineVotes, setOnlineVotes] = useState<VoteMap>({})
  const [votedCount, setVotedCount] = useState(0)
  const [submittingOnline, setSubmittingOnline] = useState(false)
  const mySessionId = useRef(generateSessionId())
  const inviteLink = `eatogether.app/vote/${roomCode}`

  // ── Realtime 監聽線上投票人數 ────────────────────────────

  useEffect(() => {
    if (activeTab !== 'online') return

    // 先查目前人數
    const fetchCount = async () => {
      const { data } = await supabase
        .from('vote_records')
        .select('session_id')
        .eq('room_id', roomId)
      if (data) {
        const unique = new Set(data.map((r: any) => r.session_id))
        setVotedCount(unique.size)
      }
    }
    fetchCount()

    // Realtime 訂閱
    const channel = supabase
      .channel(`vote_records_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vote_records',
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          await fetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTab, roomId])

  // ── 投票邏輯：切換名次 ───────────────────────────────────

  const handleToggleVote = (
    votes: VoteMap,
    setVotes: React.Dispatch<React.SetStateAction<VoteMap>>,
    placeId: string,
    rank: 1 | 2 | 3
  ) => {
    setVotes((prev) => {
      const next = { ...prev }

      // 如果這個名次已經被其他餐廳佔用，先清掉
      const existingForRank = Object.keys(next).find((id) => next[id] === rank)
      if (existingForRank && existingForRank !== placeId) {
        next[existingForRank] = null
      }

      // 切換：已選同一名次 → 取消；否則選上
      if (next[placeId] === rank) {
        next[placeId] = null
      } else {
        next[placeId] = rank
      }

      return next
    })
  }

  // ── 同機：提交目前投票者，換下一位 ──────────────────────

  const handleLocalNext = async () => {
    const payload = Object.entries(allVotes)
      .filter(([, rank]) => rank !== null && rank !== undefined)
      .map(([placeId, rank]) => ({ placeId, rank: rank as number }))

    if (payload.length === 0) {
      Alert.alert('提示', '至少要選一間餐廳才能繼續')
      return
    }

    try {
      setSubmittingLocal(true)
      const sessionId = generateSessionId()
      await submitVote(roomId, sessionId, payload)

      // 換下一位
      if (currentVoterIdx + 1 < voterNames.length) {
        setCurrentVoterIdx((prev) => prev + 1)
        setAllVotes({})
      } else {
        // 最後一位投完
        setShowResults(true)
      }
    } catch (err: any) {
      Alert.alert('提交失敗', err?.message ?? '請稍後再試')
    } finally {
      setSubmittingLocal(false)
    }
  }

  // ── 公布結果 ─────────────────────────────────────────────

  const handleRevealResults = async () => {
    try {
      setSubmittingLocal(true)
      const results = await getVoteResults(roomId)

      if (results.length === 0) {
        Alert.alert('找不到結果', '目前沒有投票資料')
        return
      }

      actions.setFinalPlace(results[0])
      navigation.navigate('Result')
    } catch (err: any) {
      Alert.alert('取得結果失敗', err?.message ?? '請稍後再試')
    } finally {
      setSubmittingLocal(false)
    }
  }

  // ── 線上：提交自己的投票 ──────────────────────────────────

  const handleOnlineSubmit = async () => {
    const payload = Object.entries(onlineVotes)
      .filter(([, rank]) => rank !== null && rank !== undefined)
      .map(([placeId, rank]) => ({ placeId, rank: rank as number }))

    if (payload.length === 0) {
      Alert.alert('提示', '至少要選一間餐廳才能送出')
      return
    }

    try {
      setSubmittingOnline(true)
      await submitVote(roomId, mySessionId.current, payload)
      Alert.alert('投票成功', '你的投票已送出！')
      setOnlineVotes({})
    } catch (err: any) {
      Alert.alert('投票失敗', err?.message ?? '請稍後再試')
    } finally {
      setSubmittingOnline(false)
    }
  }

  // ── 複製邀請連結 ──────────────────────────────────────────

  const handleCopyLink = () => {
    Clipboard.setString(inviteLink)
    Alert.alert('已複製', '邀請連結已複製到剪貼簿')
  }

  // ── UI ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>投票模式</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Tab 切換 ── */}
      <View style={styles.tabBar}>
        {(['local', 'online'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'local' ? '📱 同機模式' : '🌐 線上投票'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ════════════════════════════════════
            同機模式
        ════════════════════════════════════ */}
        {activeTab === 'local' && (
          <View>
            {/* 進度列 */}
            <View style={styles.progressRow}>
              {voterNames.map((name, idx) => (
                <View
                  key={name}
                  style={[
                    styles.progressDot,
                    idx < currentVoterIdx && styles.progressDotDone,
                    idx === currentVoterIdx && styles.progressDotCurrent,
                  ]}
                >
                  <Text style={styles.progressDotText}>{idx + 1}</Text>
                </View>
              ))}
              <Text style={styles.progressLabel}>
                第 {currentVoterIdx + 1} 位 / 共 {voterNames.length} 位
              </Text>
            </View>

            {/* 投票面板或公布結果 */}
            {!showResults ? (
              <>
                <VotePanel
                  candidates={candidates}
                  voterName={voterNames[currentVoterIdx]}
                  votes={allVotes}
                  onToggle={(placeId, rank) =>
                    handleToggleVote(allVotes, setAllVotes, placeId, rank)
                  }
                />

                <TouchableOpacity
                  style={[styles.nextBtn, submittingLocal && styles.btnDisabled]}
                  onPress={handleLocalNext}
                  disabled={submittingLocal}
                >
                  {submittingLocal ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.nextBtnText}>
                      {currentVoterIdx + 1 < voterNames.length
                        ? '投完了，傳給下一位 →'
                        : '✅ 提交最後一票'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.revealBox}>
                <Text style={styles.revealEmoji}>🗳️</Text>
                <Text style={styles.revealTitle}>所有人都投完了！</Text>
                <Text style={styles.revealSubtitle}>準備好公布結果了嗎？</Text>
                <TouchableOpacity
                  style={[styles.revealBtn, submittingLocal && styles.btnDisabled]}
                  onPress={handleRevealResults}
                  disabled={submittingLocal}
                >
                  {submittingLocal ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.revealBtnText}>🎉 公布結果</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ════════════════════════════════════
            線上投票
        ════════════════════════════════════ */}
        {activeTab === 'online' && (
          <View>
            {/* 邀請連結 */}
            <View style={styles.linkCard}>
              <Text style={styles.linkLabel}>邀請連結</Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkText} selectable numberOfLines={1}>
                  {inviteLink}
                </Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
                  <Text style={styles.copyBtnText}>複製</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 已投票人數 */}
            <View style={styles.countCard}>
              <Text style={styles.countText}>
                🗳️ 已投票：
                <Text style={styles.countNumber}>{votedCount}</Text>
                {' / '}
                <Text style={styles.countNumber}>{members.length || '?'}</Text>
                {' 人'}
              </Text>
              <ActivityIndicator
                size="small"
                color={PRIMARY}
                style={{ marginLeft: 8 }}
              />
            </View>

            {/* 自己投票 */}
            <VotePanel
              candidates={candidates}
              voterName={myName}
              votes={onlineVotes}
              onToggle={(placeId, rank) =>
                handleToggleVote(onlineVotes, setOnlineVotes, placeId, rank)
              }
            />

            {/* 送出投票 */}
            <TouchableOpacity
              style={[styles.nextBtn, submittingOnline && styles.btnDisabled]}
              onPress={handleOnlineSubmit}
              disabled={submittingOnline}
            >
              {submittingOnline ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextBtnText}>📨 送出我的投票</Text>
              )}
            </TouchableOpacity>

            {/* 公布結果 */}
            <TouchableOpacity
              style={styles.revealBtnOutline}
              onPress={handleRevealResults}
              disabled={submittingLocal}
            >
              <Text style={styles.revealBtnOutlineText}>🎉 公布結果</Text>
            </TouchableOpacity>
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

  // Tab
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: PRIMARY,
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  tabTextActive: {
    color: PRIMARY,
  },

  // ScrollView
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // 同機進度列
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotDone: {
    backgroundColor: '#20bf6b',
  },
  progressDotCurrent: {
    backgroundColor: PRIMARY,
  },
  progressDotText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 13,
    color: '#888',
    marginLeft: 4,
  },

  // 投票者 badge
  voterBadge: {
    backgroundColor: '#FFF4EF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  voterBadgeText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '700',
  },

  voteTip: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 12,
  },

  // 投票行
  voteRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  voteRowInfo: {
    marginBottom: 10,
  },
  voteRestaurantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  voteRestaurantMeta: {
    fontSize: 12,
    color: '#999',
  },
  rankRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rankBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EEE',
  },
  rankBtnSelected: {
    backgroundColor: '#FFF4EF',
    borderColor: PRIMARY,
  },
  rankBtnText: {
    fontSize: 22,
  },

  // 下一位按鈕
  nextBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.55,
  },

  // 公布結果框
  revealBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#EEE',
  },
  revealEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  revealTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    marginBottom: 6,
  },
  revealSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  revealBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  revealBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  revealBtnOutline: {
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  revealBtnOutlineText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },

  // 線上：邀請連結
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EEE',
  },
  linkLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#5352ED',
    fontWeight: '600',
  },
  copyBtn: {
    backgroundColor: '#5352ED',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // 線上：已投票人數
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  countText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
  },
  countNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#20bf6b',
  },
})
