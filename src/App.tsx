import { useState } from 'react'
import { ComingSoon } from './components/ComingSoon'
import { FareCheck } from './features/fare-check/FareCheck'
import { Home, type Screen } from './features/home/Home'
import { PriceCheck } from './features/price-check/PriceCheck'
import { Search } from './features/search/Search'
import { ExchangeRateContext, useLatestExchangeRate } from './lib/useExchangeRate'

const comingSoonTitles: Record<Exclude<Screen, 'home' | 'fare-check' | 'price-check' | 'search'>, string> = {
  tuktuk: 'トゥクトゥク',
  coach: '交渉コーチ',
  phrases: 'フレーズ帳',
  'no-haggle': '交渉しない場所',
  history: '履歴',
  settings: '設定',
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const goHome = () => setScreen('home')
  const [itemId, setItemId] = useState<string | undefined>(undefined)
  const rate = useLatestExchangeRate()

  return (
    <ExchangeRateContext value={rate}>
      <main className="mx-auto min-h-svh max-w-md bg-bg">
        {screen === 'home' && <Home onOpen={setScreen} />}
        {screen === 'fare-check' && <FareCheck onBack={goHome} />}
        {screen === 'price-check' && (
          <PriceCheck key={itemId} initialItemId={itemId} onBack={goHome} onStartCoach={() => setScreen('coach')} />
        )}
        {screen === 'search' && (
          <Search
            onBack={goHome}
            onSelect={(id) => {
              setItemId(id)
              setScreen('price-check')
            }}
          />
        )}
        {screen !== 'home' && screen !== 'fare-check' && screen !== 'price-check' && screen !== 'search' && (
          <ComingSoon title={comingSoonTitles[screen]} onBack={goHome} />
        )}
      </main>
    </ExchangeRateContext>
  )
}
