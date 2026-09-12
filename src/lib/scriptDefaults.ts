import type { ScriptSection } from './types'

// The rehearsal structure: old self on top, new self below.
export const DEFAULT_SECTIONS: ScriptSection[] = [
  { key: 'thoughts', title: 'Thoughts', body: '' },
  { key: 'habits', title: 'Automatic habits', body: '' },
  { key: 'emotions', title: 'Emotions of the past', body: '' },
  { key: 'beliefs', title: 'Beliefs', body: '' },
  { key: 'behaviour', title: 'Behaviour as new personality', body: '' },
  { key: 'feelings', title: 'Feelings', body: '' },
]

export const NEW_SELF_KEYS = new Set(['beliefs', 'behaviour', 'feelings'])

export function mergeSections(saved: unknown): ScriptSection[] {
  const list = Array.isArray(saved) ? (saved as Partial<ScriptSection>[]) : []
  return DEFAULT_SECTIONS.map((d) => {
    const match = list.find((s) => s.key === d.key)
    return { ...d, body: typeof match?.body === 'string' ? match.body : '' }
  })
}
