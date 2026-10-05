import { ScreenHeader } from './ScreenHeader'

interface Props {
  title: string
  onBack: () => void
}

export function ComingSoon({ title, onBack }: Props) {
  return (
    <div>
      <ScreenHeader title={title} onBack={onBack} />
      <div className="m-4 rounded-card border border-border bg-brand-soft p-4">
        <p className="text-heading">準備中です</p>
        <p className="text-body text-text-sub">この機能は次の版で使えるようになります。</p>
      </div>
    </div>
  )
}
