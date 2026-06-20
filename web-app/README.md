# 一起吃 Eatogether

> 解決選擇障礙，一起決定今天吃什麼。

**Live Demo** → [eatogether.vercel.app](https://eatogether.vercel.app)

---

## 功能介紹

建立一個房間，邀請朋友加入，用轉盤決定料理類型後，透過以下四種模式一起選出餐廳：

| 模式 | 說明 |
|------|------|
| 🎡 轉盤 | 隨機從 12 種食物類型中轉出今天的方向 |
| 💘 交友軟體模式 | 像 Tinder 一樣左右滑卡，全員喜歡才算配對 |
| 🗳️ 同機投票 | 傳手機輪流排出前三名，加權計分（5-3-1）|
| 🌐 線上投票 | 各用自己手機匿名投票，即時同步結果 |

選出結果後顯示餐廳完整資訊：照片、評分、評論數、地址、電話、網站、Google Maps 連結。

---

## 技術架構

- **Frontend** — Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database** — Supabase (PostgreSQL + Realtime)
- **地圖 & 餐廳** — Google Places API (New) + Maps JavaScript API
- **即時同步** — Supabase Realtime (Presence + Broadcast)
- **動畫** — Framer Motion + @use-gesture/react（滑卡手勢）
- **拖曳投票** — @dnd-kit
- **部署** — Vercel

---

## 本地開發

### 前置需求

- Node.js 18+
- Supabase 專案
- Google Cloud 專案（啟用 Places API New + Maps JavaScript API）

### 安裝

```bash
git clone https://github.com/njzneverdie/eatogether.git
cd eatogether/web-app
npm install
```

### 環境變數

在 `web-app/` 建立 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=your_maps_browser_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_PLACES_API_KEY=your_places_api_server_key
```

> `GOOGLE_PLACES_API_KEY` 為後端專用 key，建議在 Google Cloud Console 設為「無應用程式限制」並只開放 Places API (New)。

### 啟動

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)

---

## 專案結構

```
web-app/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── restaurants/  # Google Places 搜尋與快取
│   │   │   ├── session/      # 房間建立、加入、結果
│   │   │   ├── swipe/        # 滑卡配對邏輯
│   │   │   ├── vote/         # 投票提交與結果計算
│   │   │   └── photo/        # Google 餐廳照片 proxy
│   │   └── session/[id]/     # 各模式頁面
│   ├── components/
│   │   ├── shared/           # RestaurantCard, RestaurantPhoto
│   │   ├── swipe/            # SwipeCard, SwipeDeck
│   │   ├── vote/             # RankBallot, ResultBoard
│   │   └── wheel/            # SpinWheel
│   ├── hooks/                # useRestaurants, useGeolocation
│   ├── stores/               # Zustand session state
│   └── types/                # domain.ts
└── supabase/
    └── migrations/           # DB schema & RPC functions
```

---

## 部署到 Vercel

1. Fork 此 repo
2. 在 Vercel 匯入專案，**Root Directory** 設為 `web-app`
3. 填入上方五個環境變數
4. Deploy

---

## 開發背景

這個專案是我第一次完全透過 **Claude Code** 從零開始設計、開發並部署的 Web App。從 UI 設計、資料庫架構、API 串接到上線，全程 AI 協作完成。雖然仍是雛形，但整個開發體驗讓我對 AI 輔助開發的能力感到相當驚嘆。
