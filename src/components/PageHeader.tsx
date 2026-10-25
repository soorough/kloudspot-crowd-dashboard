import type { ReactNode } from 'react'
import { addDays, formatDayLabel } from '../lib/time'
import { useDashboard } from '../sites/dashboard'
import { CalendarIcon } from './icons'

/** Page title plus the shared single-day picker (Overview and Crowd Entries use the same day). */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-medium text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
        <DayPicker />
      </div>
    </div>
  )
}

export function DayPicker() {
  const { selectedDay, setSelectedDay, today } = useDashboard()
  if (!today) return null
  const day = selectedDay ?? today
  const label = selectedDay === null || selectedDay === today ? 'Today' : day === addDays(today, -1) ? 'Yesterday' : formatDayLabel(day)

  return (
    <label className="relative flex h-10 w-48 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-ink focus-within:outline-2 focus-within:outline-brand-500">
      <CalendarIcon size={18} className="text-ink-muted" />
      <span>{label}</span>
      <input
        type="date"
        aria-label="Select day"
        className="absolute inset-0 cursor-pointer opacity-0"
        value={day}
        max={today}
        onChange={(e) => {
          const v = e.target.value
          setSelectedDay(!v || v === today ? null : v)
        }}
        onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
      />
    </label>
  )
}
