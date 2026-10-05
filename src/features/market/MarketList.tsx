import { ChevronRight, CircleAlert, MapPin, Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { ItemThumb } from '../../components/ItemThumb'
import { ScreenHeader } from '../../components/ScreenHeader'
import { VenueSheet } from '../../components/VenueSheet'
import { bangkok, bangkokItems, bangkokPriceConfig, bangkokVenues } from '../../lib/city'
import { estimatePrice, searchItems } from '../../lib/price'
import { loadRecent } from '../../lib/recent'
import type { Item, ItemCategory } from '../../lib/types'

const categories: { id: ItemCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'clothing', label: '衣類' },
  { id: 'bags', label: 'バッグ・財布' },
  { id: 'goods', label: '雑貨' },
  { id: 'crafts', label: '工芸品' },
  { id: 'beauty', label: '美容・食品' },
  { id: 'accessories', label: '時計・メガネ' },
]

/** 品目の値段の要約（一覧の1行に出す） */
function Summary({ item, venueId }: { item: Item; venueId: string }) {
  const venue = bangkokVenues.find((v) => v.id === venueId)!
  // 交渉しない売り場を選んでいても、一覧では一般の市場の幅を見せる
  const base = venue.negotiable ? venue : bangkokVenues.find((v) => v.id === 'market')!
  const e = estimatePrice(item, base, 1, bangkokVenues, bangkokPriceConfig)
  if (e.status === 'ok' || e.status === 'few') {
    return (
      <>
        <p className="text-heading">
          {e.unit.low.toLocaleString('ja-JP')}〜{e.unit.limit.toLocaleString('ja-JP')}
          <span className="ml-1 text-label text-text-sub">THB / {item.unit}</span>
        </p>
        <p className="text-caption text-text-sub">
          情報 {e.count}件・{e.verified ? '確認済み' : '未確認'}
          {e.status === 'few' ? '・少なめ' : ''}
        </p>
      </>
    )
  }
  if (e.status === 'no-haggle') {
    return <p className="text-caption text-text-sub">定価で買う品物です（交渉しない）</p>
  }
  return (
    <p className="flex items-center gap-1 text-caption text-text-sub">
      <CircleAlert size={14} strokeWidth={2} aria-hidden="true" />
      価格情報が不足しています
    </p>
  )
}

export function MarketList({
  venueId,
  onVenueChange,
  onBack,
  onOpenItem,
  autoFocus = false,
}: {
  venueId: string
  onVenueChange: (id: string) => void
  onBack: () => void
  onOpenItem: (id: string) => void
  autoFocus?: boolean
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ItemCategory | 'all'>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [recent] = useState(loadRecent)

  const venue = bangkokVenues.find((v) => v.id === venueId)!
  const byQuery = query.trim() === '' ? bangkokItems : searchItems(bangkokItems, query)
  const list = byQuery.filter((i) => category === 'all' || i.category === category)
  const recentItems = recent.map((id) => bangkokItems.find((i) => i.id === id)).filter((i): i is Item => !!i)

  return (
    <div className="pb-8">
      <ScreenHeader title="市場の買い物" onBack={onBack} />

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex min-h-tap w-full items-center gap-2 border-b border-border bg-surface px-4 text-left text-body"
      >
        <MapPin size={20} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
        <span>{bangkok.name}</span>
        <ChevronRight size={16} strokeWidth={2} className="text-text-sub" aria-hidden="true" />
        <span className="flex-1 truncate text-brand">{venueId === 'market' ? '市場を選ぶ' : venue.name}</span>
        <ChevronRight size={20} strokeWidth={2} className="text-text-sub" aria-hidden="true" />
      </button>

      <div className="flex flex-col gap-3 p-4">
        <label className="flex min-h-tap items-center gap-2 rounded-button border border-border bg-surface px-3">
          <SearchIcon size={20} strokeWidth={2} className="text-text-sub" aria-hidden="true" />
          <span className="sr-only">商品名で探す</span>
          <input
            type="search"
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="商品名で探す（例：パンツ、財布）"
            className="min-h-tap flex-1 bg-transparent text-body outline-none"
          />
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="分類">
          {categories.map((c) => {
            const selected = c.id === category
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(c.id)}
                className={`min-h-tap shrink-0 rounded-full px-4 text-label ${selected ? 'bg-brand text-white' : 'bg-border text-text'}`}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {query.trim() !== '' && byQuery.length === 0 && (
          <p className="rounded-card bg-brand-soft p-4 text-body text-text-sub">
            「{query}」はまだ調べていない品目です。分類から近いものを選んでください。
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {(list.length > 0 ? list : bangkokItems.filter((i) => category === 'all' || i.category === category)).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpenItem(item.id)}
                className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-3 text-left shadow-card"
              >
                <ItemThumb id={item.id} />
                <span className="min-w-0 flex-1">
                  <span className="block text-heading">{item.name}</span>
                  <span className="mb-1 block text-caption text-text-sub">{item.spec}</span>
                  <Summary item={item} venueId={venueId} />
                </span>
                <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-text-sub" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        {recentItems.length > 0 && query.trim() === '' && (
          <section aria-label="最近見た商品" className="flex flex-col gap-2">
            <h2 className="text-label text-text-sub">最近見た商品</h2>
            <ul className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
              {recentItems.map((item) => (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  <button type="button" onClick={() => onOpenItem(item.id)} className="flex min-h-tap w-full items-center gap-3 px-3 py-2 text-left">
                    <ItemThumb id={item.id} size="sm" />
                    <span className="flex-1">
                      <span className="block text-body">{item.name}</span>
                      <Summary item={item} venueId={venueId} />
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
