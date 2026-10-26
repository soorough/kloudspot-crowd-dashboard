import officeBg from '../../assets/office-bg.webp'

/**
 * Greyscale open-plan office behind the login card, darkened like the Figma so the
 * heading and card stay legible. Photo: Pexels #20988575 (Pexels License), pre-processed
 * to greyscale WebP at build time — see README credits.
 */
export function OfficeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#2b2b2b]">
      <img
        src={officeBg}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />
    </div>
  )
}
