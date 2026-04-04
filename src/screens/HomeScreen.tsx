import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'

import { RootStackParamList } from '../../App'
import { createRoom, joinRoom } from '../services/roomService'
import { useRoomStore } from '../stores/roomStore'

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

const PRIMARY = '#FF6B35'
const LIGHT_BG = '#FFF4EF'

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>()
  const { actions } = useRoomStore()

  // 暱稱
  const [myName, setMyName] = useState('')

  // 建立房間 loading
  const [creating, setCreating] = useState(false)

  // 加入房間
  const [showJoin, setShowJoin] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  // ── 建立房間 ──────────────────────────────────────────

  const handleCreateRoom = async () => {
    if (!myName.trim()) {
      Alert.alert('提示', '請先輸入你的暱稱')
      return
    }

    try {
      setCreating(true)
      // foodType / foodEmoji / mode 尚未決定，先填預設值，SpinWheel & ModeSelect 會更新
      const { roomId, roomCode } = await createRoom(myName.trim(), '', '', 'tinder')

      actions.setMyName(myName.trim())
      actions.setRoom({ roomId, roomCode, foodType: '', foodEmoji: '', mode: 'tinder' })

      navigation.navigate('SpinWheel')
    } catch (err: any) {
      Alert.alert('建立房間失敗', err?.message ?? '請稍後再試')
    } finally {
      setCreating(false)
    }
  }

  // ── 加入房間 ──────────────────────────────────────────

  const handleJoinRoom = async () => {
    if (!myName.trim()) {
      Alert.alert('提示', '請先輸入你的暱稱')
      return
    }
    if (inviteCode.trim().length !== 6) {
      Alert.alert('提示', '邀請碼為 6 碼英數字')
      return
    }

    try {
      setJoining(true)
      const result = await joinRoom(
        inviteCode.trim().toUpperCase(),
        myName.trim(),
        0, // lat 先給 0，之後可在 MidpointMode 更新
        0  // lng 先給 0
      )

      actions.setMyName(myName.trim())
      actions.setRoom({
        roomId: result.roomId,
        roomCode: result.roomCode,
        foodType: result.foodType,
        foodEmoji: result.foodEmoji,
        mode: result.mode as 'tinder' | 'midpoint' | 'vote',
      })

      // 依房間模式導航到對應畫面
      switch (result.mode) {
        case 'tinder':
          navigation.navigate('TinderMode')
          break
        case 'midpoint':
          navigation.navigate('MidpointMode')
          break
        case 'vote':
          navigation.navigate('VoteMode')
          break
        default:
          navigation.navigate('ModeSelect')
      }
    } catch (err: any) {
      Alert.alert('加入房間失敗', err?.message ?? '找不到房間，請確認邀請碼是否正確')
    } finally {
      setJoining(false)
    }
  }

  // ── UI ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 頂部 Header ── */}
          <View style={styles.header}>
            <Text style={styles.appName}>一起吃 🍴</Text>
            <Text style={styles.subtitle}>解決選擇困難的聚餐神器</Text>
          </View>

          {/* ── 卡片容器 ── */}
          <View style={styles.card}>
            {/* 暱稱輸入 */}
            <Text style={styles.label}>你的暱稱</Text>
            <TextInput
              style={styles.input}
              placeholder="輸入暱稱（最多 10 字）"
              placeholderTextColor="#BDBDBD"
              value={myName}
              onChangeText={(t) => setMyName(t.slice(0, 10))}
              maxLength={10}
              returnKeyType="done"
            />

            {/* 建立房間按鈕 */}
            <TouchableOpacity
              style={[styles.btnPrimary, creating && styles.btnDisabled]}
              onPress={handleCreateRoom}
              disabled={creating || joining}
              activeOpacity={0.8}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>🏠 建立房間</Text>
              )}
            </TouchableOpacity>

            {/* 分隔線 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 加入房間按鈕 / 展開輸入 */}
            {!showJoin ? (
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => setShowJoin(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnOutlineText}>🔑 加入房間</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.label}>6 碼邀請碼</Text>
                <TextInput
                  style={styles.input}
                  placeholder="輸入邀請碼（例：A1B2C3）"
                  placeholderTextColor="#BDBDBD"
                  value={inviteCode}
                  onChangeText={(t) => setInviteCode(t.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  autoCapitalize="characters"
                  returnKeyType="go"
                  onSubmitEditing={handleJoinRoom}
                />
                <TouchableOpacity
                  style={[styles.btnPrimary, joining && styles.btnDisabled]}
                  onPress={handleJoinRoom}
                  disabled={joining || creating}
                  activeOpacity={0.8}
                >
                  {joining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>進入房間 →</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => {
                    setShowJoin(false)
                    setInviteCode('')
                  }}
                >
                  <Text style={styles.btnCancelText}>取消</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    letterSpacing: 0.5,
  },

  // 卡片
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Label & Input
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: LIGHT_BG,
    marginBottom: 16,
  },

  // 主要按鈕
  btnPrimary: {
    height: 52,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // 外框按鈕
  btnOutline: {
    height: 52,
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: PRIMARY,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // 取消
  btnCancel: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  btnCancelText: {
    color: '#999',
    fontSize: 15,
  },

  // 分隔線
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#BDBDBD',
    fontSize: 14,
  },
})
