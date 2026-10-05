import { ChevronRight, MapPin, Search as SearchIcon, X } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { ItemThumb } from '../../components/ItemThumb'
import { LoadError, LoadingCards } from '../../components/LoadStates'
import { ScreenHeader } from '../../components/ScreenHeader'
import { VenueSheet } from '../../components/VenueSheet'
import { venueLabel } from '../../lib/city'
import { runSearch } from '../../lib/price'
import { loadRecent } from '../../lib/recent'
import type { Item, ItemCategory } from '../../lib/types'
import type { ItemsState } from '../../lib/useItems'
import { goodsTypeLabel } from '../../lib/format'
import { RecordSummary } from './RecordSummary'

const allCategories: { id: ItemCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'clothing', label: '衣類' },
  { id: 'bags', label: 'バッグ' },
  { id: 'goods', label: '雑貨' },
  { id: 'crafts', label: '工芸品' },
  { id: 'beauty', label: '美容・食品' },
  { id: 'accessories', label: '時計・メガネ' },
]

export interface ListConditions {
  query: string
  category: ItemCategory | 'all'
  scrollY: number
}

function ItemCard({ item, venueId, today, onOpen }: { item: Item; venueId: string | null; today: Date; onOpen: () => void }) {
  const typeLabel = item.goodsType ? goodsTypeLabel[item.goodsType] : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-3 text-left shadow-card"
    >
      <ItemThumb id={item.id} name={item.name} />
      <span className="min-w-0 flex-1">
        <span className="block text-heading">{item.name}</span>
        <span className="block text-caption text-text-sub">{item.spec}</span>
        {typeLabel && <span className="mt-0.5 inline-block rounded-full border border-border px-2 text-caption text-text-sub">{typeLabel}</span>}
        <span className="mt-1 block">
          <RecordSummary item={item} venueId={venueId} today={today} />
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-center text-label text-text-sub">
        <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
        詳細
      </span>
    </button>
  )
}

export function MarketList({
  itemsState,
  onRetry,
  conditions,
  onConditionsChange,
  venueId,
  onVenueChange,
  onBack,
  onOpenItem,
  autoFocus = false,
}: {
  itemsState: ItemsState
  onRetry: () => void
  conditions: ListConditions
  onConditionsChange: (c: ListConditions) => void
  venueId: string | null
  onVenueChange: (id: string | null) => void
  onBack: () => void
  onOpenItem: (id: string, scrollY: number) => void
  autoFocus?: boolean
}) {
  const { query, category } = conditions
  // 日本語の変換中は検索語を確定しない（変換を妨げないため）
  const [draft, setDraft] = useState(query)
  const [composing, setComposing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [recent] = useState(loadRecent)
  const [today] = useState(() => new Date())
  const set = (patch: Partial<ListConditions>) => onConditionsChange({ ...conditions, ...patch })

  // 詳細から戻ったら、前のスクロール位置に戻す
  useLayoutEffect(() => {
    if (itemsState.status === 'ready' && conditions.scrollY > 0) window.scrollTo(0, conditions.scrollY)
  }, [itemsState.status, conditions.scrollY])

  const items = itemsState.status === 'ready' ? itemsState.items : []
  const categories = allCategories.filter((c) => c.id === 'all' || items.some((i) => i.category === c.id))
  const result = runSearch(itemsState.status === 'ready' ? items : null, query)
  const list = result.status === 'ok' ? result.items.filter((i) => category === 'all' || i.category === category) : []
  const recentItems = recent.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => !!i)
  const categoryLabel = categories.find((c) => c.id === category)?.label
  const hasConditions = query !== '' || category !== 'all'

  return (
    <div className="pb-[calc(32px+env(safe-area-inset-bottom))]">
      <ScreenHeader title="市場の買い物" onBack={onBack} />

      <div className="flex min-h-tap items-center gap-2 border-b border-border bg-surface px-4 py-1">
        <MapPin size={20} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-body">{venueLabel(venueId)}</span>
        <button type="button" onClick={() => setSheetOpen(true)} className="min-h-tap shrink-0 rounded-button border border-brand px-3 text-label text-brand">
          {venueId === null ? '市場を選ぶ' : '市場を変更'}
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex min-h-tap items-center gap-2 rounded-button border border-border bg-surface pl-3 focus-within:border-brand">
          <SearchIcon size={20} strokeWidth={2} className="shrink-0 text-text-sub" aria-hidden="true" />
          <label htmlFor="item-search" className="sr-only">
            商品名で探す
          </label>
          <input
            id="item-search"
            type="search"
            enterKeyHint="search"
            autoFocus={autoFocus}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (!composing) set({ query: e.target.value })
            }}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={(e) => {
              setComposing(false)
              set({ query: e.currentTarget.value })
            }}
            placeholder="商品名で探す"
            className="min-h-tap min-w-0 flex-1 bg-transparent text-body outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {draft !== '' && (
            <button
              type="button"
              onClick={() => {
                setDraft('')
                set({ query: '' })
              }}
              className="flex min-h-tap shrink-0 items-center gap-1 px-3 text-label text-text-sub"
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
              消す
            </button>
          )}
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="カテゴリー">
          {categories.map((c) => {
            const selected = c.id === category
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => set({ category: c.id })}
                className={`min-h-tap shrink-0 rounded-full border px-4 text-label ${selected ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-text'}`}
              >
                {selected && c.id !== 'all' ? `✓ ${c.label}` : c.label}
              </button>
            )
          })}
        </div>

        {itemsState.status === 'ready' && hasConditions && list.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-caption text-text-sub" aria-live="polite">
            {list.length}件
            {query !== '' && `・「${query}」`}
            {category !== 'all' && `・${categoryLabel}`}
            <button
              type="button"
              onClick={() => {
                setDraft('')
                set({ query: '', category: 'all' })
              }}
              className="min-h-tap px-2 text-label text-brand underline"
            >
              条件を解除
            </button>
          </p>
        )}

        {itemsState.status === 'loading' && <LoadingCards />}
        {itemsState.status === 'error' && <LoadError onRetry={onRetry} />}

        {itemsState.status === 'ready' && list.length === 0 && (
          <section className="flex flex-col gap-3 rounded-card bg-brand-soft p-4" aria-live="polite">
            <div>
              <h2 className="text-heading">該当する商品がありません</h2>
              <p className="text-body text-text-sub">
                {query.trim() !== '' && `「${query}」`}
                {category !== 'all' && `${query.trim() !== '' ? '・' : ''}「${categoryLabel}」`}
                に合う商品は、まだ調べていません。検索語を変えるか、条件を解除してください。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {query !== '' && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft('')
                    set({ query: '' })
                  }}
                  className="min-h-tap rounded-button border border-brand bg-surface px-3 text-label text-brand"
                >
                  検索語を消す
                </button>
              )}
              {category !== 'all' && (
                <button type="button" onClick={() => set({ category: 'all' })} className="min-h-tap rounded-button border border-brand bg-surface px-3 text-label text-brand">
                  カテゴリーを解除する
                </button>
              )}
            </div>
          </section>
        )}

        {list.length > 0 && (
          <ul className="flex flex-col gap-3" aria-label="商品一覧">
            {list.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} venueId={venueId} today={today} onOpen={() => onOpenItem(item.id, window.scrollY)} />
              </li>
            ))}
          </ul>
        )}

        {recentItems.length > 0 && !hasConditions && (
          <section aria-label="最近見た商品" className="flex flex-col gap-2 pt-2">
            <h2 className="text-label text-text-sub">最近見た商品</h2>
            <ul className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
              {recentItems.map((item) => (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onOpenItem(item.id, window.scrollY)}
                    className="flex min-h-tap w-full items-center gap-3 px-3 py-2 text-left"
                  >
                    <ItemThumb id={item.id} name={item.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-body">{item.name}</span>
                      <RecordSummary item={item} venueId={venueId} today={today} />
                    </span>
                    <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-text-sub" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {sheetOpen && (
        <VenueSheet
          value={venueId}
          onClose={() => setSheetOpen(false)}
          onSelect={(id) => {
            onVenueChange(id)
            setSheetOpen(false)
          }}
        />
      )}
    </div>
  )
}
