/**
 * Stand-in for the Figma's desaturated open-plan office photo, drawn with CSS only:
 * a dark teal/grey base, ceiling light strips, soft blurred "desks and glass partitions"
 * for depth, and a vignette so the heading and card stay legible.
 */
export function OfficeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Base: cool grey fading into brand teal */}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#2b3536_0%,#1f3332_45%,#133534_100%)]" />

      {/* Window light from the left */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_10%_35%,rgb(180_205_200/0.22),transparent_65%)]" />

      {/* Ceiling light strips in perspective */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-[repeating-linear-gradient(90deg,transparent_0_9%,rgb(255_255_255/0.07)_9%_10%)] [mask-image:linear-gradient(180deg,black,transparent)] [transform:perspective(600px)_rotateX(55deg)] origin-top" />

      {/* Glass partitions / shelving */}
      <div className="absolute top-[18%] left-[38%] h-[45%] w-[14%] rounded-sm bg-white/5 blur-[2px]" />
      <div className="absolute top-[22%] left-[55%] h-[38%] w-[9%] rounded-sm bg-white/[0.04] blur-[3px]" />

      {/* Desks and people, out of focus */}
      <div className="absolute bottom-[14%] left-[-5%] h-[22%] w-[55%] rounded-[40%] bg-[#0e2221]/70 blur-2xl" />
      <div className="absolute bottom-[24%] left-[30%] h-[14%] w-[30%] rounded-full bg-[#3c4f4e]/50 blur-2xl" />
      <div className="absolute right-[8%] bottom-[10%] h-[30%] w-[40%] rounded-full bg-[#0b1d1c]/70 blur-3xl" />
      <div className="absolute top-[30%] left-[18%] h-24 w-24 rounded-full bg-brand-300/15 blur-3xl" />
      <div className="absolute top-[12%] right-[20%] h-40 w-40 rounded-full bg-[#9fb3b0]/10 blur-3xl" />

      {/* Floor */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/45 to-transparent" />

      {/* Vignette + darkening so foreground content reads */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_40%,rgb(0_0_0/0.55)_100%)]" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}
