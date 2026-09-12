import { StarIcon } from './Icons'

export function StarPicker({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Rate this session">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)}>
          <StarIcon filled={value != null && n <= value} />
        </button>
      ))}
    </div>
  )
}

export function StarsSmall({ value }: { value: number | null }) {
  if (value == null) return <span className="muted">unrated</span>
  return (
    <span className="stars small" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n}><StarIcon size={16} filled={n <= value} /></span>)}
    </span>
  )
}
