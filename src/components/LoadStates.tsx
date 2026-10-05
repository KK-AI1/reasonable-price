import { RotateCw, WifiOff } from 'lucide-react'

export function LoadingCards() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <span className="text-caption text-text-sub">読み込み中です…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-card border border-border bg-surface p-3">
          <div className="h-20 w-20 rounded-button bg-border" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-1/2 rounded bg-border" />
            <div className="h-3 w-1/3 rounded bg-border" />
            <div className="h-4 w-2/3 rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex gap-3">
        <WifiOff size={24} strokeWidth={2} className="shrink-0 text-text-sub" aria-hidden="true" />
        <div>
          <h2 className="text-heading">商品の情報を読み込めませんでした</h2>
          <p className="text-body text-text-sub">通信状況を確かめて、もう一度お試しください。価格は表示していません。</p>
        </div>
      </div>
      <button type="button" onClick={onRetry} className="flex min-h-tap items-center justify-center gap-2 rounded-button border border-brand text-label text-brand">
        <RotateCw size={18} strokeWidth={2} aria-hidden="true" />
        もう一度読み込む
      </button>
    </section>
  )
}
