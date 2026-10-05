import { ChevronRight, Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { bangkokItems } from '../../lib/city'
import { searchItems } from '../../lib/price'

/** 品目検索。端末内のデータだけを探すので、通信も費用もかからない（docs/SPEC.md §6.1） */
export function Search({ onBack, onSelect }: { onBack: () => void; onSelect: (itemId: string) => void }) {
  const [query, setQuery] = useState('')
  const results = searchItems(bangkokItems, query)
  const list = query.trim() === '' ? bangkokItems : results

  return (
    <div className="pb-8">
      <ScreenHeader title="品目を探す" onBack={onBack} />
      <div className="flex flex-col gap-4 p-4">
        <label className="flex min-h-tap items-center gap-2 rounded-button border border-border bg-surface px-3">
          <SearchIcon size={20} strokeWidth={2} className="text-text-sub" aria-hidden="true" />
          <span className="sr-only">何を買いますか？</span>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="何を買いますか？（例：パンツ、財布）"
            className="min-h-tap flex-1 bg-transparent text-body outline-none"
          />
        </label>

        {query.trim() !== '' && results.length === 0 && (
          <section className="rounded-card bg-brand-soft p-4">
            <h2 className="text-heading">まだ調べていない品目です</h2>
            <p className="text-body text-text-sub">
              下の一覧から近いものを選んでください。調べる品目は、順に増やしていきます。
            </p>
          </section>
        )}

        <ul className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
          {(list.length > 0 ? list : bangkokItems).map((item) => (
            <li key={item.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex min-h-tap w-full items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-body">{item.name}</span>
                  <span className="block text-caption text-text-sub">
                    {item.unit}
                    {item.observations.length === 0 ? '・データ準備中' : `・情報 ${item.observations.length} 件`}
                  </span>
                </span>
                <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-text-sub" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
