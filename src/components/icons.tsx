import kloudspotLogo from '../assets/figma/kloudspot-logo.svg'
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
/** Hugeicons "location 01" (outline), exported from the Figma. */
export const PinIcon = ({ size = 16, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M4 14.1667C3.72386 14.1667 3.5 14.3905 3.5 14.6667C3.5 14.9428 3.72386 15.1667 4 15.1667V14.6667V14.1667ZM12 15.1667C12.2761 15.1667 12.5 14.9428 12.5 14.6667C12.5 14.3905 12.2761 14.1667 12 14.1667V14.6667V15.1667ZM13 6.33334H12.5C12.5 7.47098 11.7732 8.9424 10.7698 10.1646C10.2765 10.7654 9.73812 11.2786 9.23099 11.6369C8.70828 12.0063 8.28179 12.1667 8 12.1667V12.6667V13.1667C8.59321 13.1667 9.22922 12.8627 9.80808 12.4536C10.4025 12.0336 11.0047 11.4543 11.5427 10.7991C12.6018 9.50917 13.5 7.81393 13.5 6.33334H13ZM8 12.6667V12.1667C7.72831 12.1667 7.30632 11.9996 6.78066 11.6049C6.27267 11.2235 5.73288 10.6786 5.23786 10.0445C4.23117 8.7551 3.5 7.21665 3.5 6.07408H3H2.5C2.5 7.54974 3.39383 9.30758 4.44964 10.6599C4.98587 11.3467 5.58671 11.959 6.18027 12.4046C6.75618 12.837 7.39669 13.1667 8 13.1667V12.6667ZM3 6.07408H3.5C3.5 3.65373 5.65238 1.83334 8 1.83334V1.33334V0.833336C5.19296 0.833336 2.5 3.01294 2.5 6.07408H3ZM8 1.33334V1.83334C10.3292 1.83334 12.5 3.63669 12.5 6.33334H13H13.5C13.5 3.02998 10.8254 0.833336 8 0.833336V1.33334ZM10 6H9.5C9.5 6.82843 8.82843 7.5 8 7.5V8V8.5C9.38071 8.5 10.5 7.38071 10.5 6H10ZM8 8V7.5C7.17157 7.5 6.5 6.82843 6.5 6H6H5.5C5.5 7.38071 6.61929 8.5 8 8.5V8ZM6 6H6.5C6.5 5.17158 7.17157 4.5 8 4.5V4V3.5C6.61929 3.5 5.5 4.61929 5.5 6H6ZM8 4V4.5C8.82843 4.5 9.5 5.17158 9.5 6H10H10.5C10.5 4.61929 9.38071 3.5 8 3.5V4ZM4 14.6667V15.1667H12V14.6667V14.1667H4V14.6667Z" />
  </svg>
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
/** Solar "Linear / Notifications / Bell", exported from the Figma (28px frame). */
export const BellIcon = ({ size = 28, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" aria-hidden="true" {...p}>
    <path d="M21.874 10.5058V11.3278C21.874 12.3144 22.1553 13.2788 22.6826 14.0996L23.9746 16.1111C25.1547 17.9484 24.2538 20.4457 22.2012 21.0267C16.8318 22.5466 11.1682 22.5466 5.79876 21.0267C3.74622 20.4457 2.84529 17.9484 4.02542 16.1111L5.31743 14.0996C5.84467 13.2788 6.12602 12.3144 6.12602 11.3278V10.5058C6.12602 5.99227 9.65132 2.33333 14 2.33333C18.3487 2.33333 21.874 5.99227 21.874 10.5058Z" />
    <path d="M8.75 22.1667C9.5142 24.2058 11.5762 25.6667 14 25.6667C16.4238 25.6667 18.4858 24.2058 19.25 22.1667" strokeLinecap="round" />
  </svg>
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
/** Hugeicons "chart-arrow-up" (outline), exported from the Figma: 18×8, 1px round-capped stroke. */
export const TrendUpIcon = ({ size = 18, ...p }: IconProps) => (
  <svg width={size} height={(size * 8) / 18} viewBox="0 0 18 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M0.5 6.75L4.08579 3.16421C4.86684 2.38316 6.13316 2.38317 6.91421 3.16421L9.08579 5.33579C9.86684 6.11684 11.1332 6.11684 11.9142 5.33579L15.5 1.75" />
    <path d="M13.625 0.5H15.75C16.3023 0.5 16.75 0.947715 16.75 1.5V3.625" />
  </svg>
)
/** The same Figma glyph mirrored vertically, as used for "less than yesterday". */
export const TrendDownIcon = ({ size = 18, style, ...p }: IconProps) => (
  <TrendUpIcon size={size} style={{ transform: 'scaleY(-1)', ...style }} {...p} />
)

/** Official Kloudspot wordmark, exported from the Figma file (white fill). */
export function KloudspotLogo({ className = '' }: { className?: string }) {
  return <img src={kloudspotLogo} alt="Kloudspot" width={127} height={40} className={`h-10 w-auto ${className}`} />
}
