import { get, set, del } from 'idb-keyval'

const KEY = 'meditation-track'

export async function loadTrack(): Promise<File | null> {
  try {
    const f = await get<File>(KEY)
    return f instanceof Blob ? (f as File) : null
  } catch {
    return null
  }
}

export async function saveTrack(file: File): Promise<void> {
  await set(KEY, file)
}

export async function clearTrack(): Promise<void> {
  await del(KEY)
}
