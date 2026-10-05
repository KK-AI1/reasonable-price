import { useState } from 'react'
import { ComingSoon } from './components/ComingSoon'
import { NegotiationPrep } from './features/coach/NegotiationPrep'
import { FareCheck } from './features/fare-check/FareCheck'
import { Home, type Screen } from './features/home/Home'
import { ItemDetail, type NegotiationHandoff } from './features/market/ItemDetail'
import { MarketList, type ListConditions } from './features/market/MarketList'
import { LoadError, LoadingCards } from './components/LoadStates'
import { pushRecent } from './lib/recent'
import { ExchangeRateContext, useLatestExchangeRate } from './lib/useExchangeRate'
import { useItems } from './lib/useItems'

type AppScreen = Screen | 'item' | 'negotiate'

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
  // 市場は未選択（都市全体）から始める。都市はMVPではバンコクのみ
  const [venueId, setVenueId] = useState<string | null>(null)
  // 一覧の検索条件とスクロール位置は、詳細から戻っても保つ
  const [conditions, setConditions] = useState<ListConditions>({ query: '', category: 'all', scrollY: 0 })
  const [handoff, setHandoff] = useState<NegotiationHandoff | null>(null)
  const { state: itemsState, retry } = useItems()
  const rate = useLatestExchangeRate()

  const goHome = () => {
    window.scrollTo(0, 0)
    setScreen('home')
  }
  const openItem = (id: string, scrollY: number) => {
    pushRecent(id)
    setConditions((c) => ({ ...c, scrollY }))
    setItemId(id)
    setScreen('item')
    window.scrollTo(0, 0)
  }
  const item = itemsState.status === 'ready' && itemId ? itemsState.items.find((i) => i.id === itemId) : undefined

  return (
    <ExchangeRateContext value={rate}>
      <main className="mx-auto min-h-svh max-w-md bg-bg">
        {screen === 'home' && <Home onOpen={setScreen} />}
        {screen === 'fare-check' && <FareCheck onBack={goHome} />}
        {(screen === 'price-check' || screen === 'search') && (
          <MarketList
            itemsState={itemsState}
            onRetry={retry}
            conditions={conditions}
            onConditionsChange={setConditions}
            venueId={venueId}
            onVenueChange={setVenueId}
            onBack={goHome}
            onOpenItem={openItem}
            autoFocus={screen === 'search'}
          />
        )}
        {screen === 'item' && item && (
          <ItemDetail
            key={item.id}
            item={item}
            venueId={venueId}
            onVenueChange={setVenueId}
            onChangeItem={() => setScreen('price-check')}
            onNegotiate={(h) => {
              setHandoff(h)
              setScreen('negotiate')
              window.scrollTo(0, 0)
            }}
          />
        )}
        {screen === 'item' && !item && (
          <div className="p-4">{itemsState.status === 'loading' ? <LoadingCards /> : <LoadError onRetry={retry} />}</div>
        )}
        {screen === 'negotiate' && handoff && <NegotiationPrep handoff={handoff} onBack={() => setScreen('item')} />}
        {comingSoonTitles[screen] && <ComingSoon title={comingSoonTitles[screen]!} onBack={goHome} />}
      </main>
    </ExchangeRateContext>
  )
}
