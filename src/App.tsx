import { useState } from 'react'
import { ComingSoon } from './components/ComingSoon'
import { FareCheck } from './features/fare-check/FareCheck'
import { Home, type Screen } from './features/home/Home'
import { ItemDetail } from './features/market/ItemDetail'
import { MarketList } from './features/market/MarketList'
import { pushRecent } from './lib/recent'
import { ExchangeRateContext, useLatestExchangeRate } from './lib/useExchangeRate'

type AppScreen = Screen | 'item'

const comingSoonTitles: Partial<Record<AppScreen, string>> = {
  tuktuk: 'トゥクトゥク',
  coach: '交渉コーチ',
  phrases: 'フレーズ帳',
  'no-haggle': '交渉しない場所',
  history: '履歴',
  settings: '設定',
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [itemId, setItemId] = useState<string | null>(null)
  const [venueId, setVenueId] = useState('market')
  const rate = useLatestExchangeRate()
  const goHome = () => setScreen('home')
  const openItem = (id: string) => {
    pushRecent(id)
    setItemId(id)
    setScreen('item')
  }

  return (
    <ExchangeRateContext value={rate}>
      <main className="mx-auto min-h-svh max-w-md bg-bg">
        {screen === 'home' && <Home onOpen={setScreen} />}
        {screen === 'fare-check' && <FareCheck onBack={goHome} />}
        {(screen === 'price-check' || screen === 'search') && (
          <MarketList
            venueId={venueId}
            onVenueChange={setVenueId}
            onBack={goHome}
            onOpenItem={openItem}
            autoFocus={screen === 'search'}
          />
        )}
        {screen === 'item' && itemId && (
          <ItemDetail
            key={itemId}
            itemId={itemId}
            venueId={venueId}
            onVenueChange={setVenueId}
            onBack={() => setScreen('price-check')}
            onStartCoach={() => setScreen('coach')}
          />
        )}
        {comingSoonTitles[screen] && <ComingSoon title={comingSoonTitles[screen]!} onBack={goHome} />}
      </main>
    </ExchangeRateContext>
  )
}
