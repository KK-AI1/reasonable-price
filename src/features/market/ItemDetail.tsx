import { BarChart3, ChevronDown, CircleAlert, Clock, Info, MapPin, Minus, Plus, Ruler, Store, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ItemThumb } from '../../components/ItemThumb'
import { ScreenHeader } from '../../components/ScreenHeader'
import { UnverifiedBadge } from '../../components/UnverifiedBadge'
import { VenueSheet } from '../../components/VenueSheet'
import { bangkok, bangkokPriceConfig, bangkokVenues, resolveVenue, venueLabel } from '../../lib/city'
import { toYen } from '../../lib/currency'
import { estimatePrice, summarizeRecords } from '../../lib/price'
import { clampQuantity, compareAsk, purchaseRecords } from '../../lib/records'
import type { Item, ObservationKind } from '../../lib/types'
import { useExchangeRate } from '../../lib/useExchangeRate'
import { fmt, goodsTypeLabel } from '../../lib/format'

/** 交渉機能へ引き継ぐ情報 */
export interface NegotiationHandoff {
  itemId: string
  itemName: string
  unit: string
  venueId: string | null
  quantity: number
  /** 提示額（1つあたり、THB）。未入力なら null */
  askUnit: number | null
  /** 購入記録が不足していて、金額の提案ができない */
  priceUnavailable: boolean
}

const recordTitles: Record<ObservationKind, string> = {
  'tourist-paid': '購入記録（旅行者が払った額）',
  'tourist-asked': '提示価格の記録（店の最初の言い値）',
  local: 'タイ国内の小売価格（通販・店頭）',
  wholesale: '卸値（仕入れの目安）',
}

function Accordion({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-border">
      <summary className="flex min-h-tap cursor-pointer list-none items-center gap-3 px-4 text-body focus-visible:outline-2 focus-visible:outline-brand">
        <span className="text-brand">{icon}</span>
        <span className="flex-1">{title}</span>
        <ChevronDown size={20} strokeWidth={2} className="text-text-sub transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-2 px-4 pb-4 text-caption text-text-sub">{children}</div>
    </details>
  )
}

/** 入力欄にフォーカスがある間は true（ソフトキーボードで固定ボタンが入力欄を隠さないようにする） */
function useEditing(): boolean {
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement
    const onIn = (e: FocusEvent) => isField(e.target) && setEditing(true)
    const onOut = (e: FocusEvent) => isField(e.target) && setEditing(false)
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])
  return editing
}

export function ItemDetail({
  item,
  venueId,
  onVenueChange,
  onChangeItem,
  onNegotiate,
}: {
  item: Item
  venueId: string | null
  onVenueChange: (id: string | null) => void
  onChangeItem: () => void
  onNegotiate: (h: NegotiationHandoff) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [ask, setAsk] = useState('')
  const [askBasis, setAskBasis] = useState<'unit' | 'total'>('unit')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [today] = useState(() => new Date())
  const editing = useEditing()
  const rate = useExchangeRate()
  const yen = (n: number) => fmt(toYen(n, { jpyPerUnit: rate.jpyPerUnit, roundToYen: bangkok.exchange.roundToYen }))

  const venue = resolveVenue(venueId)
  const noHaggle = !item.negotiable || !venue.negotiable
  const v = purchaseRecords(item, venueId, bangkokPriceConfig.staleAfterDays, today)
  const hasRecords = v.state !== 'insufficient'
  const others = summarizeRecords(item).filter((r) => r.kind !== 'tourist-paid')
  const unverified = v.records.some((r) => !r.verified)
  const typeLabel = item.goodsType ? goodsTypeLabel[item.goodsType] : null
  const estimate = estimatePrice(item, venue.negotiable ? venue : resolveVenue(null), 1, bangkokVenues, bangkokPriceConfig)

  const askNum = ask.trim() === '' ? null : Number(ask)
  const askValid = askNum !== null && Number.isInteger(askNum) && askNum > 0
  // 合計で入力されたときは、単価に直して比べる（割り切れないときは比べない）
  const askUnit = !askValid ? null : askBasis === 'unit' ? askNum : askNum % quantity === 0 ? askNum / quantity : null
  const position = askUnit !== null && hasRecords ? compareAsk(askUnit, v) : null
  const localPrices = item.observations.filter((o) => o.kind === 'local').map((o) => o.price)

  const scopeText =
    v.scope === 'venue' ? `${venue.name.replace(/（.*）/, '')}の記録` : `${bangkok.name}各地の記録（特定の市場の値段ではありません）`
  const periodText = v.earliest
    ? `${v.earliest === v.latest ? v.earliest : `${v.earliest}〜${v.latest}`}${v.undated > 0 ? `・時期不明 ${v.undated}件` : ''}`
    : '時期不明'

  return (
    <div className="pb-[calc(160px+env(safe-area-inset-bottom))]">
      <ScreenHeader title="商品の相場" onBack={onChangeItem} />

      <section aria-label="商品" className="flex items-center gap-3 border-b border-border bg-surface p-4">
        <ItemThumb id={item.id} name={item.name} />
        <div className="min-w-0 flex-1">
          <h2 className="text-title">{item.name}</h2>
          <p className="text-caption text-text-sub">{item.spec}</p>
          {typeLabel && <p className="text-caption text-text-sub">{typeLabel}</p>}
        </div>
        <button type="button" onClick={onChangeItem} className="min-h-tap shrink-0 rounded-button border border-brand px-3 text-label text-brand">
          商品を変更
        </button>
      </section>

      <section aria-label="比較条件" className="flex flex-col gap-1 border-b border-border bg-surface px-4 py-2">
        <div className="flex min-h-tap items-center gap-2">
          <MapPin size={20} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-body">{venueLabel(venueId)}</span>
          <button type="button" onClick={() => setSheetOpen(true)} className="min-h-tap shrink-0 rounded-button border border-brand px-3 text-label text-brand">
            条件を変更
          </button>
        </div>
        <div className="flex min-h-tap items-center gap-3">
          <span id="qty-label" className="flex-1 text-body">
            数量
          </span>
          <button
            type="button"
            aria-label="1つ減らす"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => clampQuantity(q - 1))}
            className="flex h-tap w-tap items-center justify-center rounded-button border border-border bg-surface disabled:opacity-40"
          >
            <Minus size={20} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className="min-w-12 text-center text-heading" aria-live="polite" aria-labelledby="qty-label">
            {quantity}
            <span className="sr-only">{item.unit.replace(/^1/, '')}</span>
          </span>
          <button
            type="button"
            aria-label="1つ増やす"
            disabled={quantity >= 99}
            onClick={() => setQuantity((q) => clampQuantity(q + 1))}
            className="flex h-tap w-tap items-center justify-center rounded-button border border-border bg-surface disabled:opacity-40"
          >
            <Plus size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-4 p-4">
        {noHaggle && (
          <section className="flex gap-3 rounded-card bg-brand-soft p-4">
            <Store size={24} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h3 className="text-heading">{item.negotiable ? 'ここは交渉しない場所です' : '定価で売られる品物です'}</h3>
              <p className="text-body text-text-sub">表示されている値段で、気持ちよく買いましょう。</p>
              {!item.negotiable && localPrices.length > 0 && (
                <p className="mt-1 text-body text-text-sub">
                  参考の定価：{fmt(Math.min(...localPrices))}
                  {Math.min(...localPrices) !== Math.max(...localPrices) && `〜${fmt(Math.max(...localPrices))}`} THB（{item.unit}・未確認）
                </p>
              )}
            </div>
          </section>
        )}

        {item.negotiable && (
          <section aria-label="価格情報" className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="flex flex-col gap-1 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-heading">購入記録の価格帯</h3>
                {hasRecords && unverified && <UnverifiedBadge />}
              </div>

              {!hasRecords ? (
                <p className="flex items-start gap-2 py-2 text-body text-text-sub">
                  <CircleAlert size={20} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                  価格情報が不足しています。旅行者の購入記録が見つかっていません。
                </p>
              ) : (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-display">{v.state === 'single' ? fmt(v.min) : `${fmt(v.min)}〜${fmt(v.max)}`}</span>
                    <span className="text-heading">THB</span>
                    <span className="text-label text-text-sub">{item.unit}あたり</span>
                  </p>
                  <p className="text-caption text-text-sub">
                    参考換算 約{yen(v.min)}
                    {v.state !== 'single' && `〜${yen(v.max)}`}円（1 THB = {rate.jpyPerUnit.toFixed(2)}円・{rate.date}
                    {rate.origin === 'live' ? '' : '・保存済みの値'}）
                  </p>
                  {quantity > 1 && (
                    <p className="text-body">
                      合計（{quantity}つ）：
                      <span className="font-bold">
                        {v.state === 'single' ? fmt(v.min * quantity) : `${fmt(v.min * quantity)}〜${fmt(v.max * quantity)}`} THB
                      </span>
                      <span className="block text-caption text-text-sub">単価 × 数量で計算しています。まとめ買いの値引きは含みません。</span>
                    </p>
                  )}
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-caption text-text-sub">
                    <dt>記録件数</dt>
                    <dd>{v.count}件</dd>
                    <dt>購入時期</dt>
                    <dd>{periodText}</dd>
                    <dt>対象地域</dt>
                    <dd>{scopeText}</dd>
                  </dl>
                </>
              )}

              {/* 解釈に重要な注意は、閉じた状態でも見せる */}
              <ul className="mt-1 flex flex-col gap-1">
                {v.state === 'single' && (
                  <li className="flex items-start gap-1 text-caption text-text">
                    <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                    購入記録は1件だけです。相場とは言えません。
                  </li>
                )}
                {v.state === 'old' && (
                  <li className="flex items-start gap-1 text-caption text-text">
                    <Clock size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {bangkokPriceConfig.staleAfterDays}日より前の記録しかありません。今の値段と違う可能性があります。
                  </li>
                )}
                {hasRecords && v.undated > 0 && (
                  <li className="flex items-start gap-1 text-caption text-text">
                    <Clock size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                    購入時期の分からない記録を含みます。
                  </li>
                )}
                {hasRecords && venueId !== null && v.scope === 'city' && (
                  <li className="flex items-start gap-1 text-caption text-text">
                    <MapPin size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                    この市場の記録はないため、{bangkok.name}全体の記録を表示しています。
                  </li>
                )}
                {hasRecords && unverified && (
                  <li className="flex items-start gap-1 text-caption text-text">
                    <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />
                    旅行記事・口コミから集めた未確認の記録です。
                  </li>
                )}
              </ul>
            </div>

            <Accordion icon={<BarChart3 size={20} strokeWidth={2} aria-hidden="true" />} title="価格の根拠を見る">
              {hasRecords && (
                <>
                  <p className="font-bold text-text">表示している購入記録</p>
                  <ul className="flex flex-col gap-1">
                    {v.records.map((r, i) => (
                      <li key={`${r.source}-${i}`}>
                        {fmt(r.price)} THB・{resolveVenue(r.venue).id === 'city' ? '場所不明' : resolveVenue(r.venue).name.replace(/（.*）/, '')}・
                        {r.publishedAt ?? '時期不明'}・
                        {r.sourceUrl ? (
                          <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                            {r.source}
                          </a>
                        ) : (
                          r.source
                        )}
                        {r.quote && `（原文：${r.quote}）`}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {others.length > 0 && (
                <>
                  <p className="font-bold text-text">その他の記録（購入記録とは別に集計）</p>
                  <dl className="flex flex-col gap-1">
                    {others.map((r) => (
                      <div key={r.kind} className="flex justify-between gap-2">
                        <dt>{recordTitles[r.kind]}</dt>
                        <dd className="shrink-0">
                          {r.min === r.max ? fmt(r.min) : `${fmt(r.min)}〜${fmt(r.max)}`} THB・{r.count}件
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              {(estimate.status === 'ok' || estimate.status === 'few') && (
                <p>
                  交渉コーチでは、これらの記録から計算した目安（{fmt(estimate.unit.low)}〜{fmt(estimate.unit.limit)} THB）を使います。中心はタイ国内の小売価格で、下は卸値に売り手の利益を足した額です。最安値を目標にはしません。
                </p>
              )}
            </Accordion>

            <Accordion icon={<Ruler size={20} strokeWidth={2} aria-hidden="true" />} title="素材・サイズの違いを確認">
              <p>表示している記録は「{item.spec}」の品物を前提にしています。素材や大きさ、作りが違うと値段も変わります。写真が似ていても同じ品質とは限りません。</p>
              {item.note && <p>{item.note}</p>}
            </Accordion>
          </section>
        )}

        {item.negotiable && (
          <section aria-label="提示された金額" className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
            <label htmlFor="ask" className="text-heading">
              提示された金額を入力（任意）
            </label>
            <div className="flex gap-2" role="group" aria-label="金額の単位">
              {(['unit', 'total'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={askBasis === b}
                  onClick={() => setAskBasis(b)}
                  className={`min-h-tap flex-1 rounded-button border text-label ${askBasis === b ? 'border-brand bg-brand-soft text-brand' : 'border-border bg-surface'}`}
                >
                  {b === 'unit' ? `${item.unit}あたり` : `合計（${quantity}つ分）`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ask"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={ask}
                placeholder="例：300"
                onChange={(ev) => setAsk(ev.target.value.replace(/[^0-9]/g, ''))}
                onFocus={(ev) => ev.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                className="min-h-tap min-w-0 flex-1 rounded-button border border-border bg-surface px-3 text-heading focus:border-brand"
              />
              <span className="shrink-0 text-label text-text-sub">THB</span>
            </div>
            {askValid && askBasis === 'total' && askUnit === null && (
              <p className="text-caption text-text-sub">合計が数量で割り切れないため、1つあたりに直して比べられません。</p>
            )}
            {position && (
              <p className="text-body" aria-live="polite">
                {position.position === 'below' && '購入記録の範囲より低い金額です。'}
                {position.position === 'within' && '購入記録の範囲内の金額です。'}
                {position.position === 'above' && `購入記録の上限より約${position.percent}%高い金額です。`}
                <span className="block text-caption text-text-sub">記録との比較で、良し悪しを決めるものではありません。</span>
              </p>
            )}
            {askValid && !hasRecords && <p className="text-caption text-text-sub">購入記録がないため、比べられません。</p>}
          </section>
        )}
      </div>

      {!noHaggle && !editing && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-surface px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          {!hasRecords && <p className="mb-1 text-center text-caption text-text-sub">価格情報が不足しているため、金額の提案はできません。</p>}
          <button
            type="button"
            onClick={() =>
              onNegotiate({
                itemId: item.id,
                itemName: item.name,
                unit: item.unit,
                venueId,
                quantity,
                askUnit,
                priceUnavailable: !hasRecords,
              })
            }
            className="flex min-h-tap w-full items-center justify-center gap-2 rounded-button bg-brand text-heading text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
