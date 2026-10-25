import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </Icon>
)
export const EntriesIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 17 17 7M7 7v4M7 7h4M17 17v-4M17 17h-4" />
  </Icon>
)
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
)
export const PinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" fill="currentColor" stroke="none" />
  </Icon>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)
export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
)
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
)
export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
)
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Icon>
)
export const PowerIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0" />
  </Icon>
)
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
)
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)
export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.5 18.5 0 0 0 2 11s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61M14.12 14.12a3 3 0 1 1-4.24-4.24M2 2l20 20" />
  </Icon>
)
export const TrendUpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />
  </Icon>
)
export const TrendDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 7 6 6 4-4 8 8M15 17h6v-6" />
  </Icon>
)

export function KloudspotLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tracking-tight ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="13" cy="13" r="12" fill="currentColor" />
        <path
          d="M8 18V9.5a5 5 0 0 1 10 0c0 2.8-2.2 5-5 5"
          stroke="var(--color-brand-800)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="13" cy="9.5" r="1.6" fill="var(--color-brand-800)" />
      </svg>
      <span className="text-[1.15rem]">kloudspot</span>
    </span>
  )
}
