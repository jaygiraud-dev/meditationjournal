export type Session = {
  id: string
  user_id: string
  started_at: string
  duration_seconds: number
  rating: number | null
  notes: string
  track_name: string
  pending?: boolean
}

export type ScriptSection = { key: string; title: string; body: string }

export type AiReview = {
  id: string
  content: string
  sessions_reviewed: number
  created_at: string
}

export type Period = 'day' | 'week' | 'month' | 'year'
