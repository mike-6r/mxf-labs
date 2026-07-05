export function SiteBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[#05070a]" />
      <div className="grid-layer absolute inset-0 opacity-55" />
      <div className="noise-layer absolute inset-0" />
      <div className="mesh-gradient absolute inset-x-0 top-0 h-[540px] opacity-80" />
      <div className="absolute left-0 top-24 h-px w-full bg-gradient-to-r from-transparent via-[#ff8a8a]/18 to-transparent" />
      <div className="absolute left-0 top-[62vh] h-px w-full bg-gradient-to-r from-transparent via-[#f7b955]/18 to-transparent" />
      <div className="absolute right-[12%] top-20 h-52 w-px bg-gradient-to-b from-transparent via-[#ffb0b0]/26 to-transparent" />
      <div className="absolute left-[7%] top-32 h-72 w-px bg-gradient-to-b from-transparent via-[#ffd166]/24 to-transparent" />
      <div className="absolute right-0 top-[18vh] h-28 w-1/3 border-y border-white/8 bg-white/[0.018]" />
      <div className="absolute bottom-[12vh] left-0 h-24 w-1/4 border-y border-white/7 bg-white/[0.015]" />
    </div>
  );
}
