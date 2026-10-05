import { Info } from 'lucide-react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { thaiPhrases, venueLabel } from '../../lib/city'
import { buildPhrase } from '../../lib/phrases'
import type { NegotiationHandoff } from '../market/ItemDetail'

const fmt = (n: number) => n.toLocaleString('ja-JP')

/**
 * 交渉の準備画面。音声での相談機能（docs/VOICE.md）はまだ提供していないため、
 * 引き継いだ内容と、最初に使う文の日本語・タイ語の確認だけを表示する。音声は再生しない。
 */
export function NegotiationPrep({ handoff, onBack }: { handoff: NegotiationHandoff; onBack: () => void }) {
  const first = buildPhrase(thaiPhrases, 'how-much', 'krap')
  return (
    <div className="pb-[calc(32px+env(safe-area-inset-bottom))]">
      <ScreenHeader title="現地語で相談する" onBack={onBack} />
      <div className="flex flex-col gap-4 p-4">
        <section role="status" className="flex gap-3 rounded-card bg-brand-soft p-4">
          <Info size={24} strokeWidth={2} className="shrink-0 text-brand" aria-hidden="true" />
          <div>
            <h2 className="text-heading">音声での相談は準備中です</h2>
            <p className="text-body text-text-sub">
              この画面では音声は再生しません。引き継いだ内容と、最初に使う一言を確認できます。
            </p>
          </div>
        </section>

        <section aria-label="引き継いだ内容" className="rounded-card border border-border bg-surface p-4">
          <h2 className="mb-2 text-heading">引き継いだ内容</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body">
            <dt className="text-text-sub">商品</dt>
            <dd>{handoff.itemName}</dd>
            <dt className="text-text-sub">場所</dt>
            <dd>{venueLabel(handoff.venueId)}</dd>
            <dt className="text-text-sub">数量</dt>
            <dd>{handoff.quantity}</dd>
            <dt className="text-text-sub">提示額</dt>
            <dd>{handoff.askUnit === null ? '未入力' : `${fmt(handoff.askUnit)} THB（${handoff.unit}あたり）`}</dd>
          </dl>
          {handoff.priceUnavailable && (
            <p className="mt-2 text-caption text-text-sub">価格情報が不足しているため、金額の提案はできません。</p>
          )}
        </section>

        <section aria-label="最初に使う一言" className="rounded-card border border-border bg-surface p-4">
          <h2 className="mb-1 text-heading">最初に使う一言（確認用）</h2>
          <p className="text-body">{first.ja}</p>
          <p className="text-title" lang="th">
            {first.thDisplay}
          </p>
          <p className="text-caption text-text-sub">読み：{first.reading}</p>
          {!first.verified && <p className="mt-1 text-caption text-text-sub">タイ語の文は未確認です。</p>}
        </section>
      </div>
    </div>
  )
}
