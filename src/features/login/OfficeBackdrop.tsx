/**
 * The Figma login photo (the original image fill, fetched via the Figma REST API with
 * scripts/fetch-figma-login-bg.sh) under the same 40% black overlay the design applies.
 */
export function OfficeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#2b2b2b]">
      <img
        src="/login-bg-1109.webp"
        srcSet="/login-bg-640.webp 640w, /login-bg-1109.webp 1109w"
        sizes="100vw"
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  )
}
