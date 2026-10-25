import { BellIcon } from '../../components/icons'

// PLACEHOLDER — replaced by the Alerts agent (see docs/SPEC.md, stories 43–51).
export function AlertsBell() {
  return (
    <button type="button" aria-label="Alerts" className="relative rounded p-1.5 text-ink hover:bg-page">
      <BellIcon />
    </button>
  )
}
