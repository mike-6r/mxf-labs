export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center px-6">
      <div className="surface flex w-full max-w-sm flex-col gap-5 rounded-lg p-5">
        <div className="h-2 w-28 animate-pulse rounded-sm bg-white/15" />
        <div className="grid gap-3">
          <div className="h-10 animate-pulse rounded-md bg-white/10" />
          <div className="h-10 animate-pulse rounded-md bg-white/10" />
          <div className="h-10 animate-pulse rounded-md bg-white/10" />
        </div>
        <div className="h-1 overflow-hidden rounded-sm bg-white/10">
          <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-sm bg-[#ff6262]" />
        </div>
      </div>
    </div>
  );
}
