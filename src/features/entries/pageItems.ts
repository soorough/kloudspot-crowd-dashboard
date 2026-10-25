export type PageItem = number | 'gap'

/**
 * Page buttons to show: always first and last, plus a 3-page window around the current
 * page (shifted at the ends so page 1 shows `1 2 3 … N`), with 'gap' for skipped runs.
 */
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 0) return []
  const start = Math.max(1, Math.min(current - 1, total - 2))
  const end = Math.min(total, start + 2)
  const pages = new Set<number>([1, total])
  for (let p = start; p <= end; p++) pages.add(p)

  const out: PageItem[] = []
  let prev = 0
  for (const p of [...pages].sort((a, b) => a - b)) {
    if (p - prev > 1) out.push('gap')
    out.push(p)
    prev = p
  }
  return out
}
