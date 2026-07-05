import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[78vh] w-full max-w-6xl items-center px-6 py-24">
      <div className="surface-strong grid w-full gap-8 rounded-lg p-6 md:grid-cols-[0.9fr_1.1fr] md:p-10">
        <div className="flex aspect-square max-w-sm items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
          <Compass className="h-16 w-16 text-[#ff6262]" aria-hidden="true" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="mb-3 font-mono text-sm text-[#ff6262]">404 / Route not found</p>
          <h1 className="max-w-xl text-4xl font-semibold text-white md:text-6xl">
            This page is outside the lab map.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
            The link may have moved, or the page has not been built yet. Head back to the main
            studio surface and keep moving.
          </p>
          <Link
            href="/"
            className="button-shine mt-8 inline-flex w-fit items-center gap-2 rounded-md border border-white/14 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#fff0ed]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
