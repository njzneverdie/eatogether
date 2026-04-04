// 路由型別定義
export type RootStackParamList = {
  Home, SpinWheel, ModeSelect,
  TinderMode, MidpointMode, VoteMode, Result
}

// 用 SafeAreaProvider 包最外層
// 用 NavigationContainer + NativeStackNavigator 設定路由
// headerShown: false（自訂 header）
// animation: 'slide_from_right'（滑動動畫）