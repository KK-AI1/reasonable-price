import { Check, X } from 'lucide-react'
import { bangkok, bangkokVenues } from '../lib/city'

/** 売り場を選ぶシート（画面下から出る。親指で届く位置） */
export function VenueSheet({
  value,
  onSelect,
  onClose,
}: {
  value: string | null
  onSelect: (id: string | null) => void
  onClose: () => void
}) {
  const options: { id: string | null; name: string; note?: string }[] = [
    { id: null, name: `市場を選ばない（${bangkok.name}全体の記録を見る）` },
    ...bangkokVenues.map((v) => ({ id: v.id, name: v.name, note: v.negotiable ? undefined : '交渉しない' })),
  ]
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/30" role="dialog" aria-modal="true" aria-label="市場を選ぶ" onClick={onClose}>
      <div
        className="mx-auto max-h-[85svh] w-full max-w-md overflow-y-auto rounded-t-card bg-surface p-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-heading">市場を選ぶ</h2>
          <button type="button" onClick={onClose} className="flex min-h-tap items-center gap-1 px-2 text-label text-text-sub">
            <X size={20} strokeWidth={2} aria-hidden="true" />
            閉じる
          </button>
        </div>
        <ul className="flex flex-col">
          {options.map((o) => {
            const selected = o.id === value
            return (
              <li key={o.id ?? 'city'}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(o.id)}
                  className={`flex min-h-tap w-full items-center justify-between gap-2 rounded-button px-3 py-2 text-left text-body ${selected ? 'bg-brand-soft text-brand' : ''}`}
                >
                  <span>
                    {o.name}
                    {o.note && <span className="ml-2 text-caption text-text-sub">{o.note}</span>}
                  </span>
                  {selected && <Check size={20} strokeWidth={2} aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
