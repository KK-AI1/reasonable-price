import { useState } from 'react'
import { ComingSoon } from './components/ComingSoon'
import { FareCheck } from './features/fare-check/FareCheck'
import { Home, type Screen } from './features/home/Home'

const comingSoonTitles: Record<Exclude<Screen, 'home' | 'fare-check'>, string> = {
  'price-check': '市場の買い物',
  tuktuk: 'トゥクトゥク',
  coach: '交渉コーチ',
  phrases: 'フレーズ帳',
  'no-haggle': '交渉しない場所',
  search: '品目検索',
  history: '履歴',
  settings: '設定',
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const goHome = () => setScreen('home')

  return (
    <main className="mx-auto min-h-svh max-w-md bg-bg">
      {screen === 'home' && <Home onOpen={setScreen} />}
      {screen === 'fare-check' && <FareCheck onBack={goHome} />}
      {screen !== 'home' && screen !== 'fare-check' && (
        <ComingSoon title={comingSoonTitles[screen]} onBack={goHome} />
      )}
    </main>
  )
}
