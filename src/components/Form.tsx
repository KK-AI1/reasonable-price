/** 入力部品（タップ領域 44px 以上） */

export function NumberField(props: {
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

export function Choice<T extends string>(props: {
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

export function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
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
