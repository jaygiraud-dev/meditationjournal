type P = { size?: number; color?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const })

export const PlayIcon = ({ size = 32 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
)
export const PauseIcon = ({ size = 32 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
)
export const FolderIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></svg>
)
export const BarsIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M4 19V10" /><path d="M10 19V5" /><path d="M16 19v-8" /><path d="M22 19H2" /></svg>
)
export const PencilIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
)
export const CheckIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M5 12l5 5L20 7" /></svg>
)
export const SparkleIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>
)
export const StopIcon = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
)
export const CloseIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>
)
export const StarIcon = ({ size = 36, filled = true, color = '#d9a84e' }: P & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={filled ? 'none' : '#5a5870'} strokeWidth={1.5}>
    <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 5.9 21l1.3-6.8-5-4.7 6.8-.8z" />
  </svg>
)
export const TrashIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>
)
