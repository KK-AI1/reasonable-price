import { BarChart3, ChevronDown, MapPin, Minus, Plus, Ruler, Store, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { ItemThumb } from '../../components/ItemThumb'
import { ScreenHeader } from '../../components/ScreenHeader'
import { UnverifiedBadge } from '../../components/UnverifiedBadge'
import { VenueSheet } from '../../components/VenueSheet'
import { VerdictBadge } from '../../components/VerdictBadge'
import { bangkok, bangkokItems, bangkokPriceConfig, bangkokVenues } from '../../lib/city'
import { toYen } from '../../lib/currency'
import { estimatePrice, judgePrice } from '../../lib/price'
import type { Item, ObservationKind, PriceRange, Verdict } from '../../lib/types'
import { useExchangeRate } from '../../lib/useExchangeRate'

export interface CoachStart {
  item: Item
  quantity: number
  /** 数量分の合計の幅 */
  range: PriceRange
  /** 入力された提示額（数量分の合計。あれば売り手の最初の言い値として使う） */
  firstAsk: number | null
}

const verdictMessage: Record<Verdict, string> = {
  fair: '納得の価格です。',
  caution: 'やや高めです。少し交渉してみましょう。',
  high: 'かなり高めです。落ち着いて交渉しましょう。',
}

const kindLabels: { kind: ObservationKind; label: string }[] = [
  { kind: 'wholesale', label: '卸値' },
  { kind: 'local', label: 'タイ国内の小売' },
  { kind: 'tourist-paid', label: '旅行者が払った額' },
  { kind: 'tourist-asked', label: '最初の言い値' },
]

const fmt = (n: number) => n.toLocaleString('ja-JP')

function Accordion({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-border">
      <summary className="flex min-h-tap cursor-pointer list-none items-center gap-3 px-4 text-body">
        <span className="text-brand">{icon}</span>
        <span className="flex-1">{title}</span>
        <ChevronDown size={20} strokeWidth={2} className="text-text-sub transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4 text-caption text-text-sub">{children}</div>
    </details>
  )
}

export function ItemDetail({
  itemId,
  venueId,
  onVenueChange,
  onBack,
  onStartCoach,
}: {
  itemId: string
  venueId: string
  onVenueChange: (id: string) => void
  onBack: () => void
  onStartCoach: (s: CoachStart) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [ask, setAsk] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const rate = useExchangeRate()
  const yen = (n: number) => fmt(toYen(n, { jpyPerUnit: rate.jpyPerUnit, roundToYen: bangkok.exchange.roundToYen }))

  const item = bangkokItems.find((i) => i.id === itemId)!
  const venue = bangkokVenues.find((v) => v.id === venueId)!
  const e = estimatePrice(item, venue, quantity, bangkokVenues, bangkokPriceConfig)
  const hasRange = e.status === 'ok' || e.status === 'few'

  const askNum = ask.trim() === '' ? null : Number(ask)
  const askUnit = askNum !== null && Number.isInteger(askNum) && askNum > 0 ? askNum : null
  const verdict = hasRange && askUnit !== null ? judgePrice(askUnit, e.unit, bangkokPriceConfig) : null

  const localPrices = item.observations.filter((o) => o.kind === 'local').map((o) => o.price)
  const reference =
    localPrices.length === 0
      ? null
      : Math.min(...localPrices) === Math.max(...localPrices)
        ? fmt(localPrices[0])
        : `${fmt(Math.min(...localPrices))}〜${fmt(Math.max(...localPrices))}`

  return (
    <div className={hasRange ? 'pb-36' : 'pb-8'}>
      <ScreenHeader title="商品の相場" onBack={onBack} />

      <section className="flex items-center gap-3 border-b border-border bg-surface p-4">
        <ItemThumb id={item.id} />
        <div className="min-w-0 flex-1">
          <h2 className="text-title">{item.name}</h2>
          <p className="text-caption text-text-sub">{item.spec}</p>
        </div>
        <button type="button" onClick={onBack} className="min-h-tap shrink-0 rounded-button border border-brand px-3 text-label text-brand">
          商品を変更
        </button>
      </section>

      <div className="flex min-h-tap items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <MapPin size={20} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
        <span className="flex-1 text-body">
          {bangkok.name} / {venue.name.replace(/（.*）/, '')}
        </span>
        <button type="button" onClick={() => setSheetOpen(true)} className="min-h-tap shrink-0 rounded-button border border-brand px-3 text-label text-brand">
          条件を変更
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <span className="flex-1 text-body">数量</span>
          <button
            type="button"
            aria-label="1つ減らす"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-tap w-tap items-center justify-center rounded-button border border-border bg-surface"
          >
            <Minus size={20} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className="min-w-8 text-center text-heading" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="1つ増やす"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="flex h-tap w-tap items-center justify-center rounded-button border border-border bg-surface"
          >
            <Plus size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {e.status === 'no-haggle' && (
          <section className="flex gap-3 rounded-card bg-brand-soft p-4">
            <Store size={24} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h3 className="text-heading">ここは交渉しない場所です</h3>
              <p className="text-body text-text-sub">表示されている値段で、気持ちよく買いましょう。</p>
              {reference && (
                <p className="mt-1 text-body text-text-sub">
                  参考の定価：{reference} THB（{item.unit}）
                </p>
              )}
            </div>
          </section>
        )}

        {e.status === 'insufficient' && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h3 className="text-heading">価格情報が不足しています</h3>
            <p className="text-body text-text-sub">この品目は情報が足りず、価格帯を出せません。情報を集めているところです。</p>
          </section>
        )}

        {hasRange && (
          <section aria-label="価格帯" className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="flex flex-col gap-1 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-label text-text-sub">納得できる価格帯</h3>
                {!e.verified && <UnverifiedBadge />}
              </div>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-display">
                  {fmt(e.unit.low)}〜{fmt(e.unit.limit)}
                </span>
                <span className="text-heading">THB</span>
                <span className="text-label text-text-sub">{item.unit}あたり</span>
              </p>
              <p className="text-caption text-text-sub">
                約{yen(e.unit.low)}〜{yen(e.unit.limit)}円
              </p>
              <p className="text-body">
                目安 <span className="text-heading">{fmt(e.unit.target)} THB</span>
                {quantity > 1 && (
                  <span className="text-text-sub">
                    （{quantity}つで合計 {fmt(e.total.low)}〜{fmt(e.total.limit)} THB）
                  </span>
                )}
              </p>
              <p className="text-caption text-text-sub">
                情報 {e.count}件{e.status === 'few' ? '・データが少ない目安' : ''}
                <br />
                換算 1 THB = {rate.jpyPerUnit.toFixed(2)}円（{rate.date}
                {rate.origin === 'live' ? '' : '・保存済みの値'}）
              </p>
            </div>

            <Accordion icon={<BarChart3 size={20} strokeWidth={2} aria-hidden="true" />} title="価格の根拠を見る">
              <p className="mb-2">
                {kindLabels.map(({ kind, label }) => `${label} ${e.counts[kind]}件`).join('・')}。
                目安はタイ国内の小売価格を中心に、卸値（売り手の利益を残す）と旅行者が払った額で幅を決めています。
              </p>
              <p className="mb-2">最初の言い値は {fmt(e.predictedAsk)} THB くらいかもしれません（{quantity > 1 ? `${quantity}つ分` : item.unit}）。</p>
              <ul className="flex flex-col gap-1">
                {e.sources.map((s) => (
                  <li key={s.source}>
                    {s.sourceUrl ? (
                      <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                        {s.source}
                      </a>
                    ) : (
                      s.source
                    )}
                    （{kindLabels.find((k) => k.kind === s.kind)?.label}・{s.checkedAt} 確認）
                  </li>
                ))}
              </ul>
            </Accordion>

            <Accordion icon={<Ruler size={20} strokeWidth={2} aria-hidden="true" />} title="素材・サイズの違いを確認">
              <p>この価格帯は「{item.spec}」の場合です。素材や大きさが違うと、値段も変わります。</p>
              {item.note && <p className="mt-2">{item.note}</p>}
            </Accordion>
          </section>
        )}

        {hasRange && (
          <section aria-label="提示された金額" className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <label htmlFor="ask" className="text-heading">
              提示された金額を入力（任意）
            </label>
            <div className="flex items-center gap-2">
              <input
                id="ask"
                type="number"
                inputMode="numeric"
                min={1}
                value={ask}
                placeholder="例：300"
                onChange={(ev) => setAsk(ev.target.value)}
                className="min-h-tap min-w-0 flex-1 rounded-button border border-border bg-surface px-3 text-heading"
              />
              <span className="shrink-0 text-label text-text-sub">THB / {item.unit}</span>
            </div>
            {verdict && (
              <div className="flex flex-col gap-1">
                <VerdictBadge verdict={verdict} />
                <p className="text-body text-text-sub">{verdictMessage[verdict]}</p>
              </div>
            )}
            <p className="text-caption text-text-sub">この条件を引き継いで交渉できます。</p>
          </section>
        )}
      </div>

      {hasRange && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-surface p-4 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() =>
              onStartCoach({ item, quantity, range: e.total, firstAsk: askUnit === null ? null : askUnit * quantity })
            }
            className="flex min-h-tap w-full items-center justify-center gap-2 rounded-button bg-brand text-heading text-white"
          >
            <Volume2 size={22} strokeWidth={2} aria-hidden="true" />
            現地語で値段を相談する
          </button>
          <p className="mt-1 text-center text-caption text-text-sub">再生する前に日本語で確認できます</p>
        </div>
      )}

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
