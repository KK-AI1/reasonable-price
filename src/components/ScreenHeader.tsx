import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  onBack: () => void
}

export function ScreenHeader({ title, onBack }: Props) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-brand px-4 py-2 text-white">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-tap items-center gap-1 rounded-button pr-2 text-label"
      >
        <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
        戻る
      </button>
      <h1 className="text-title">{title}</h1>
    </header>
  )
}
