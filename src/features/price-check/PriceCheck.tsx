import { Minus, Plus, Store } from 'lucide-react'
import { useState } from 'react'
import { NumberField } from '../../components/Form'
import { Money } from '../../components/Money'
import { ScreenHeader } from '../../components/ScreenHeader'
import { UnverifiedBadge } from '../../components/UnverifiedBadge'
import { VerdictBadge } from '../../components/VerdictBadge'
import { bangkokItems, bangkokPriceConfig, bangkokVenues } from '../../lib/city'
import { estimatePrice, judgePrice } from '../../lib/price'
import type { Item, ObservationKind, PriceRange, Verdict } from '../../lib/types'

export interface CoachStart {
  item: Item
  quantity: number
  /** 数量分の合計の幅 */
  range: PriceRange
  /** 価格チェックで入れた提示額（あれば、売り手の最初の言い値として使う） */
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

export function PriceCheck({
  onBack,
  onStartCoach,
  initialItemId,
}: {
  onBack: () => void
  onStartCoach: (s: CoachStart) => void
  initialItemId?: string
}) {
  const [itemId, setItemId] = useState(initialItemId ?? bangkokItems[0].id)
  const [venueId, setVenueId] = useState('market')
  const [quantity, setQuantity] = useState(1)
  const [ask, setAsk] = useState('')

  const item = bangkokItems.find((i) => i.id === itemId)!
  const venue = bangkokVenues.find((v) => v.id === venueId)!
  const estimate = estimatePrice(item, venue, quantity, bangkokVenues, bangkokPriceConfig)
  const askNum = ask.trim() === '' ? null : Number(ask)
  const askBaht = askNum !== null && Number.isInteger(askNum) && askNum > 0 ? askNum : null
  const hasRange = estimate.status === 'ok' || estimate.status === 'few'
  const verdict = hasRange && askBaht !== null ? judgePrice(askBaht, estimate.total, bangkokPriceConfig) : null

  return (
    <div className="pb-28">
      <ScreenHeader title="市場の買い物" onBack={onBack} />

      <div className="flex flex-col gap-4 p-4">
        {estimate.status === 'no-haggle' ? (
          <section aria-label="結果" className="flex gap-3 rounded-card bg-brand-soft p-4">
            <Store size={24} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h2 className="text-heading">ここは交渉しない場所です</h2>
              <p className="text-body text-text-sub">表示されている値段で、気持ちよく買いましょう。</p>
            </div>
          </section>
        ) : estimate.status === 'insufficient' ? (
          <section aria-label="結果" className="rounded-card border border-border bg-surface p-4">
            <h2 className="text-heading">データ不足</h2>
            <p className="text-body text-text-sub">この品目は価格の情報が足りず、目安を出せません。情報を集めているところです。</p>
          </section>
        ) : (
          <section aria-label="結果" className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-heading">
                目安（{item.unit}
                {quantity > 1 ? ` × ${quantity}` : ''}）
              </h2>
              {!estimate.verified && <UnverifiedBadge />}
            </div>
            <Money amount={estimate.total.target} />
            <p className="text-body">
              納得できる幅：{estimate.total.low.toLocaleString('ja-JP')}〜{estimate.total.limit.toLocaleString('ja-JP')} バーツ
            </p>
            {estimate.status === 'few' && (
              <p className="text-caption text-text-sub">データが少ない目安です（{estimate.count}件）。</p>
            )}
            <p className="text-body text-text-sub">
              最初の言い値は {estimate.predictedAsk.toLocaleString('ja-JP')} バーツくらいかもしれません。
            </p>
            {verdict && (
              <div className="flex flex-col gap-1">
                <VerdictBadge verdict={verdict} />
                <p className="text-body text-text-sub">{verdictMessage[verdict]}</p>
              </div>
            )}
            <details className="text-caption text-text-sub">
              <summary className="flex min-h-tap cursor-pointer items-center text-body text-brand">根拠と出典を見る</summary>
              <p className="mb-2">
                {kindLabels.map(({ kind, label }) => `${label} ${estimate.counts[kind]}件`).join('・')}
                。目安はタイ国内の小売価格を中心に、卸値（売り手の利益を残す）と旅行者が払った額で幅を決めています。
              </p>
              <ul className="flex flex-col gap-1">
                {estimate.sources.map((s) => (
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
            </details>
          </section>
        )}

        {item.note && <p className="rounded-card border border-border bg-surface p-4 text-body text-text-sub">{item.note}</p>}

        <section aria-label="条件" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
          <label className="flex flex-col gap-1">
            <span className="text-label text-text-sub">品目</span>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="min-h-tap rounded-button border border-border bg-surface px-3 text-body"
            >
              {bangkokItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-label text-text-sub">売り場の種類</span>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="min-h-tap rounded-button border border-border bg-surface px-3 text-body"
            >
              {bangkokVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-label text-text-sub">数量</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="1つ減らす"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-tap w-tap items-center justify-center rounded-button border border-border bg-surface"
              >
                <Minus size={20} strokeWidth={2} aria-hidden="true" />
              </button>
              <span className="min-w-12 text-center text-heading">{quantity}</span>
              <button
                type="button"
                aria-label="1つ増やす"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="flex h-tap w-tap items-center justify-center rounded-button border border-border bg-surface"
              >
                <Plus size={20} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>

          {estimate.status !== 'no-haggle' && (
            <NumberField label="売り手の提示額（バーツ・任意）" value={ask} onChange={setAsk} placeholder="例：400" />
          )}
        </section>
      </div>

      {hasRange && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-border bg-surface p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onStartCoach({ item, quantity, range: estimate.total, firstAsk: askBaht })}
            className="min-h-tap w-full rounded-button bg-brand text-heading text-white"
          >
            交渉コーチを始める
          </button>
        </div>
      )}
    </div>
  )
}

