import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────
// 型別定義
// ─────────────────────────────────────────────

export interface RoomInfo {
  roomId: string
  roomCode: string
}

export interface JoinRoomResult {
  roomId: string
  roomCode: string
  foodType: string
  foodEmoji: string
  mode: string
}

export interface FullRoom {
  id: string
  code: string
  food_type: string
  food_emoji: string
  mode: string
  created_at: string
  members: { id: string; name: string; lat: number; lng: number }[]
  candidates: {
    place_id: string
    name: string
    address: string
    rating: number
    price_level: number
    photo_url: string
    lat: number
    lng: number
  }[]
}

export interface VotePayload {
  placeId: string
  rank: number
}

export interface VoteResult {
  place_id: string
  name: string
  address: string
  rating: number
  price_level: number
  photo_url: string
  lat: number
  lng: number
  totalScore: number
}

// ─────────────────────────────────────────────
// 1. generateCode — 產生隨機 6 碼英數字邀請碼
// ─────────────────────────────────────────────

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ─────────────────────────────────────────────
// 2. createRoom — 建立房間並新增房主
// ─────────────────────────────────────────────

export async function createRoom(
  hostName: string,
  foodType: string,
  foodEmoji: string,
  mode: string
): Promise<RoomInfo> {
  const roomCode = generateCode()

  // 新增房間
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .insert({
      code: roomCode,
      food_type: foodType,
      food_emoji: foodEmoji,
      mode: mode,
    })
    .select('id, code')
    .single()

  if (roomError || !roomData) {
    throw new Error(`建立房間失敗：${roomError?.message}`)
  }

  // 新增房主至 room_members
  const { error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: roomData.id,
      name: hostName,
      is_host: true,
    })

  if (memberError) {
    throw new Error(`新增房主失敗：${memberError.message}`)
  }

  return {
    roomId: roomData.id,
    roomCode: roomData.code,
  }
}

// ─────────────────────────────────────────────
// 3. joinRoom — 加入房間
// ─────────────────────────────────────────────

export async function joinRoom(
  code: string,
  memberName: string,
  lat: number,
  lng: number
): Promise<JoinRoomResult> {
  // 用邀請碼找房間
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('id, code, food_type, food_emoji, mode')
    .eq('code', code.toUpperCase())
    .single()

  if (roomError || !roomData) {
    throw new Error(`找不到房間（代碼：${code}）：${roomError?.message}`)
  }

  // 新增成員
  const { error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: roomData.id,
      name: memberName,
      lat: lat,
      lng: lng,
      is_host: false,
    })

  if (memberError) {
    throw new Error(`加入房間失敗：${memberError.message}`)
  }

  return {
    roomId: roomData.id,
    roomCode: roomData.code,
    foodType: roomData.food_type,
    foodEmoji: roomData.food_emoji,
    mode: roomData.mode,
  }
}

// ─────────────────────────────────────────────
// 4. getRoom — 取得完整房間資料
// ─────────────────────────────────────────────

export async function getRoom(roomId: string): Promise<FullRoom> {
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('id, code, food_type, food_emoji, mode, created_at')
    .eq('id', roomId)
    .single()

  if (roomError || !roomData) {
    throw new Error(`取得房間失敗：${roomError?.message}`)
  }

  const { data: members, error: membersError } = await supabase
    .from('room_members')
    .select('id, name, lat, lng')
    .eq('room_id', roomId)

  if (membersError) {
    throw new Error(`取得成員失敗：${membersError.message}`)
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .select('place_id, name, address, rating, price_level, photo_url, lat, lng')
    .eq('room_id', roomId)

  if (candidatesError) {
    throw new Error(`取得候選餐廳失敗：${candidatesError.message}`)
  }

  return {
    id: roomData.id,
    code: roomData.code,
    food_type: roomData.food_type,
    food_emoji: roomData.food_emoji,
    mode: roomData.mode,
    created_at: roomData.created_at,
    members: members ?? [],
    candidates: candidates ?? [],
  }
}

// ─────────────────────────────────────────────
// 5. saveCandidates — 批次寫入候選餐廳
// ─────────────────────────────────────────────

export async function saveCandidates(
  roomId: string,
  candidates: any[]
): Promise<void> {
  const rows = candidates.map((c) => ({
    room_id: roomId,
    place_id: c.place_id,
    name: c.name,
    address: c.address ?? c.vicinity ?? '',
    rating: c.rating ?? 0,
    price_level: c.price_level ?? 0,
    photo_url: c.photo_url ?? c.photo_reference ?? '',
    lat: c.lat,
    lng: c.lng,
  }))

  const { error } = await supabase.from('candidates').insert(rows)

  if (error) {
    throw new Error(`寫入候選餐廳失敗：${error.message}`)
  }
}

// ─────────────────────────────────────────────
// 6. submitSwipe — 寫入滑動紀錄
// ─────────────────────────────────────────────

export async function submitSwipe(
  roomId: string,
  memberName: string,
  placeId: string,
  direction: string
): Promise<void> {
  const { error } = await supabase.from('swipe_records').insert({
    room_id: roomId,
    member_name: memberName,
    place_id: placeId,
    direction: direction,
  })

  if (error) {
    throw new Error(`寫入滑動紀錄失敗：${error.message}`)
  }
}

// ─────────────────────────────────────────────
// 7. checkMatch — 確認是否所有成員都右滑
// ─────────────────────────────────────────────

export async function checkMatch(
  roomId: string,
  placeId: string
): Promise<boolean> {
  // 取得房間總人數
  const { count: memberCount, error: memberError } = await supabase
    .from('room_members')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)

  if (memberError) {
    throw new Error(`取得成員人數失敗：${memberError.message}`)
  }

  // 取得對這間餐廳右滑的人數
  const { count: likeCount, error: swipeError } = await supabase
    .from('swipe_records')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .eq('place_id', placeId)
    .eq('direction', 'right')

  if (swipeError) {
    throw new Error(`查詢滑動紀錄失敗：${swipeError.message}`)
  }

  // 所有人都右滑才算 match
  return (
    memberCount !== null &&
    likeCount !== null &&
    memberCount > 0 &&
    likeCount === memberCount
  )
}

// ─────────────────────────────────────────────
// 8. submitVote — 批次寫入投票資料
// ─────────────────────────────────────────────

export async function submitVote(
  roomId: string,
  sessionId: string,
  votes: VotePayload[]
): Promise<void> {
  const rows = votes.map((v) => ({
    room_id: roomId,
    session_id: sessionId,
    place_id: v.placeId,
    rank: v.rank,
    weight: 4 - v.rank, // rank 1 → weight 3, rank 2 → weight 2, rank 3 → weight 1
  }))

  const { error } = await supabase.from('vote_records').insert(rows)

  if (error) {
    throw new Error(`寫入投票資料失敗：${error.message}`)
  }
}

// ─────────────────────────────────────────────
// 9. getVoteResults — 計算投票結果並排序
// ─────────────────────────────────────────────

export async function getVoteResults(roomId: string): Promise<VoteResult[]> {
  // 取得該房間所有投票紀錄
  const { data: voteData, error: voteError } = await supabase
    .from('vote_records')
    .select('place_id, weight')
    .eq('room_id', roomId)

  if (voteError) {
    throw new Error(`取得投票紀錄失敗：${voteError.message}`)
  }

  // 取得候選餐廳資料
  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .select('place_id, name, address, rating, price_level, photo_url, lat, lng')
    .eq('room_id', roomId)

  if (candidatesError) {
    throw new Error(`取得候選餐廳失敗：${candidatesError.message}`)
  }

  // 計算每間餐廳的總分
  const scoreMap: Record<string, number> = {}
  for (const vote of voteData ?? []) {
    if (!scoreMap[vote.place_id]) {
      scoreMap[vote.place_id] = 0
    }
    scoreMap[vote.place_id] += vote.weight
  }

  // 結合餐廳資訊與總分，依分數由高到低排序
  const results: VoteResult[] = (candidates ?? [])
    .map((c) => ({
      place_id: c.place_id,
      name: c.name,
      address: c.address,
      rating: c.rating,
      price_level: c.price_level,
      photo_url: c.photo_url,
      lat: c.lat,
      lng: c.lng,
      totalScore: scoreMap[c.place_id] ?? 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)

  return results
}
