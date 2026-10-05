import { useState } from 'react'
import phrases from '../../data/phrases/th.json'
import { Money } from '../../components/Money'
import { ScreenHeader } from '../../components/ScreenHeader'
import { UnverifiedBadge } from '../../components/UnverifiedBadge'
import { VerdictBadge } from '../../components/VerdictBadge'
import { bangkokTaxi, bangkokTaxiConfig } from '../../lib/city'
import { calcTaxiFare, judgeTaxiAsk } from '../../lib/fare'
import type { Congestion, TaxiVehicle, Verdict } from '../../lib/types'

const verdictMessage: Record<Verdict, string> = {
  fair: 'メーター額の目安どおりです。',
  caution: 'やや高めです。メーターをお願いしましょう。',
  high: 'メーターを使うタクシーを選びましょう。',
}

const congestionOptions: { value: Congestion; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'normal', label: '普通' },
  { value: 'heavy', label: 'ひどい' },
]

const vehicleOptions: { value: TaxiVehicle; label: string }[] = [
  { value: 'standard', label: bangkokTaxi.vehicles.standard.label },
  { value: 'large', label: bangkokTaxi.vehicles.large.label },
]

/** 入力文字列を数値にする。空や不正な値は null */
function parseNumber(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function FareCheck({ onBack }: { onBack: () => void }) {
  const [distance, setDistance] = useState('')
  const [vehicle, setVehicle] = useState<TaxiVehicle>('standard')
  const [congestion, setCongestion] = useState<Congestion>('normal')
  const [fromAirport, setFromAirport] = useState(false)
  const [booked, setBooked] = useState(false)
  const [toll, setToll] = useState('')
  const [ask, setAsk] = useState('')

  const distanceKm = parseNumber(distance)
  const tollBaht = Math.round(parseNumber(toll) ?? 0)
  const askBaht = parseNumber(ask)

  const result =
    distanceKm === null
      ? null
      : calcTaxiFare(
          { distanceKm, vehicle, congestion, fromAirport, booked, tollBaht },
          bangkokTaxi,
          bangkokTaxiConfig,
        )
  const verdict =
    result && askBaht !== null && result.totalBaht > 0
      ? judgeTaxiAsk(askBaht, result.totalBaht, bangkokTaxiConfig)
      : null

  return (
    <div className="pb-8">
      <ScreenHeader title="タクシー運賃" onBack={onBack} />

      <div className="flex flex-col gap-4 p-4">
        <section aria-label="結果" className="rounded-card border border-border bg-surface p-4 shadow-card">
          {result ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-heading">適正額の目安</h2>
                {!result.verified && <UnverifiedBadge />}
              </div>
              <Money amount={result.totalBaht} />
              {verdict && (
                <div className="flex flex-col gap-1">
                  <VerdictBadge verdict={verdict} />
                  <p className="text-body text-text-sub">{verdictMessage[verdict]}</p>
                </div>
              )}
              <details className="text-body">
                <summary className="flex min-h-tap cursor-pointer items-center text-brand">内訳を見る</summary>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-text-sub">
                  <dt>初乗り（1kmまで）</dt>
                  <dd>{result.breakdown.flagFallBaht} バーツ</dd>
                  <dt>距離</dt>
                  <dd>{result.breakdown.distanceBaht} バーツ</dd>
                  <dt>渋滞（約{result.breakdown.waitingMinutes}分）</dt>
                  <dd>{result.breakdown.waitingBaht} バーツ</dd>
                  {result.breakdown.bookingBaht > 0 && (
                    <>
                      <dt>呼び出し料金</dt>
                      <dd>{result.breakdown.bookingBaht} バーツ</dd>
                    </>
                  )}
                  {result.breakdown.airportBaht > 0 && (
                    <>
                      <dt>空港の追加料金</dt>
                      <dd>{result.breakdown.airportBaht} バーツ</dd>
                    </>
                  )}
                  {result.breakdown.tollBaht > 0 && (
                    <>
                      <dt>高速料金</dt>
                      <dd>{result.breakdown.tollBaht} バーツ</dd>
                    </>
                  )}
                </dl>
                <p className="mt-2 text-caption text-text-sub">
                  メーターの表示は約{result.meterBaht}バーツです。空港料金と高速料金はメーターに含まれません。
                </p>
              </details>
              <p className="text-caption text-text-sub">
                出典：{bangkokTaxi.source}（{bangkokTaxi.effectiveFrom} 施行、{bangkokTaxi.checkedAt} 確認）
                {!bangkokTaxi.vehicles[vehicle].verified && ` ／ ${bangkokTaxi.vehicles[vehicle].note}`}
              </p>
            </div>
          ) : (
            <p className="text-body text-text-sub">距離を入れると、適正額の目安を表示します。</p>
          )}
        </section>

        <section aria-label="タイ語のフレーズ" className="rounded-card bg-brand-soft p-4">
          <p className="text-label text-text-sub">{phrases.useMeter.ja}</p>
          <p className="text-title" lang="th">
            {phrases.useMeter.th}
          </p>
          <p className="text-body text-text-sub">{phrases.useMeter.reading}</p>
          {!phrases.useMeter.verified && (
            <p className="mt-1">
              <UnverifiedBadge />
            </p>
          )}
        </section>

        <section aria-label="条件" className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
          <NumberField label="距離（km）" value={distance} onChange={setDistance} placeholder="例：8" decimal />
          <Choice label="渋滞" options={congestionOptions} value={congestion} onChange={setCongestion} />
          <Choice label="車の大きさ" options={vehicleOptions} value={vehicle} onChange={setVehicle} />
          <Toggle label="空港の乗り場から乗る" checked={fromAirport} onChange={setFromAirport} />
          <Toggle label="アプリ・電話で呼んだ" checked={booked} onChange={setBooked} />
          <NumberField label="高速料金（バーツ・任意）" value={toll} onChange={setToll} placeholder="例：50" />
          <NumberField label="運転手の言い値（バーツ・任意）" value={ask} onChange={setAsk} placeholder="例：300" />
        </section>
      </div>
    </div>
  )
}

function NumberField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  decimal?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label text-text-sub">{props.label}</span>
      <input
        type="number"
        inputMode={props.decimal ? 'decimal' : 'numeric'}
        min={0}
        step={props.decimal ? 0.1 : 1}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="min-h-tap rounded-button border border-border bg-surface px-3 text-heading"
      />
    </label>
  )
}

function Choice<T extends string>(props: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-label text-text-sub">{props.label}</legend>
      <div className="flex gap-2">
        {props.options.map((o) => {
          const selected = o.value === props.value
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => props.onChange(o.value)}
              className={`min-h-tap flex-1 rounded-button border text-body ${selected ? 'border-brand bg-brand-soft text-brand' : 'border-border bg-surface text-text'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-tap items-center justify-between gap-2 text-body">
      {props.label}
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="h-6 w-6 accent-brand"
      />
    </label>
  )
}
