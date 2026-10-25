// Light tint + dark ink pairs; every pair clears WCAG AA (≥ 7:1) for the 10px initials.
const PALETTE = [
  { bg: '#d3ebe9', fg: '#133534' },
  { bg: '#e4e1f5', fg: '#2e2566' },
  { bg: '#fbe3d0', fg: '#6b3410' },
  { bg: '#dbe8f7', fg: '#173a63' },
  { bg: '#f5dde4', fg: '#6a1f35' },
  { bg: '#e3ecd6', fg: '#2f4a14' },
]

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function Avatar({ name }: { name: string }) {
  const { bg, fg } = PALETTE[hash(name) % PALETTE.length]
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-medium"
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials(name)}
    </span>
  )
}
