import type { LucideIcon } from 'lucide-react'
import {
  Bike,
  CarTaxiFront,
  History,
  House,
  Languages,
  Lightbulb,
  MapPin,
  MessagesSquare,
  Search,
  Settings,
  ShoppingBag,
  Tag,
  TriangleAlert,
} from 'lucide-react'
import { bangkok } from '../../lib/city'

export type Screen =
  | 'home'
  | 'fare-check'
  | 'price-check'
  | 'tuktuk'
  | 'coach'
  | 'phrases'
  | 'no-haggle'
  | 'search'
  | 'history'
  | 'settings'

interface Props {
  onOpen: (screen: Screen) => void
}

interface GridItem {
  screen: Screen
  label: string
  Icon: LucideIcon
  large?: boolean
}

// ホームのアイコンは最大6個（docs/DESIGN.md §2・§6.1）
const gridItems: GridItem[] = [
  { screen: 'fare-check', label: 'タクシー運賃', Icon: CarTaxiFront, large: true },
  { screen: 'price-check', label: '市場の買い物', Icon: ShoppingBag, large: true },
  { screen: 'tuktuk', label: 'トゥクトゥク', Icon: Bike },
  { screen: 'coach', label: '交渉コーチ', Icon: MessagesSquare },
  { screen: 'phrases', label: 'フレーズ帳', Icon: Languages },
  { screen: 'no-haggle', label: '交渉しない場所', Icon: Tag },
]

const tabs: { screen: Screen; label: string; Icon: LucideIcon }[] = [
  { screen: 'home', label: 'ホーム', Icon: House },
  { screen: 'history', label: '履歴', Icon: History },
  { screen: 'phrases', label: 'フレーズ', Icon: Languages },
  { screen: 'settings', label: '設定', Icon: Settings },
]

export function Home({ onOpen }: Props) {
  return (
    <div className="pb-24">
      <header className="bg-brand px-4 pt-4 pb-6">
        <p className="mb-3 text-heading text-white">Price Coach</p>
        <button
          type="button"
          onClick={() => onOpen('search')}
          className="flex min-h-tap w-full items-center gap-2 rounded-button bg-surface px-4 text-left text-body text-text-sub"
        >
          <Search size={20} strokeWidth={2} aria-hidden="true" />
          何を買いますか？
        </button>
      </header>

      <div className="flex min-h-tap items-center gap-2 border-b border-border bg-surface px-4 text-body">
        <MapPin size={20} strokeWidth={2} className="text-brand" aria-hidden="true" />
        {bangkok.name}
      </div>

      <nav aria-label="機能" className="grid grid-cols-4 gap-x-2 gap-y-4 px-4 py-6">
        {gridItems.map(({ screen, label, Icon, large }) => (
          <button
            key={screen}
            type="button"
            onClick={() => onOpen(screen)}
            className={`flex min-h-tap flex-col items-center gap-1 rounded-button ${large ? 'col-span-2' : ''}`}
          >
            <span
              className={`flex items-center justify-center rounded-full bg-brand-soft text-brand ${large ? 'h-16 w-16' : 'h-12 w-12'}`}
            >
              <Icon size={large ? 32 : 24} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-center text-label">{label}</span>
          </button>
        ))}
      </nav>

      <section className="flex flex-col gap-3 px-4" aria-label="お知らせ">
        <InfoCard Icon={TriangleAlert} title="この街の注意点">
          タクシーではメーターを使うよう頼みましょう。空港から乗ると50バーツが加わります。
        </InfoCard>
        <InfoCard Icon={Lightbulb} title="今日の交渉のコツ">
          最初の言い値は高めのことが多いです。笑顔で金額を伝えましょう。
        </InfoCard>
      </section>

      <nav
        aria-label="メニュー"
        className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        {tabs.map(({ screen, label, Icon }) => {
          const active = screen === 'home'
          return (
            <button
              key={screen}
              type="button"
              onClick={() => onOpen(screen)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-label ${active ? 'text-brand' : 'text-text-sub'}`}
            >
              <Icon size={24} strokeWidth={2} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function InfoCard({ Icon, title, children }: { Icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <article className="flex gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <Icon size={24} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
      <div>
        <h2 className="text-heading">{title}</h2>
        <p className="text-body text-text-sub">{children}</p>
      </div>
    </article>
  )
}
