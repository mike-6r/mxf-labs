"use client";

/* eslint-disable @next/next/no-img-element */
import { Maximize2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ShowcaseImage = {
  src: string;
  caption?: string;
};

export function ProductShowcaseGallery({
  images,
  title,
}: {
  images: ShowcaseImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : images[activeIndex];

  if (!images.length) return null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "group relative min-h-[18rem] overflow-hidden rounded-lg border border-white/10 bg-[#070a0f] text-left premium-depth transition hover:-translate-y-1 hover:border-white/20",
              index === 0 && images.length > 2 && "md:col-span-2 md:min-h-[26rem]",
            )}
          >
            <img src={image.src} alt={image.caption || `${title} image ${index + 1}`} className="absolute inset-0 h-full w-full object-contain p-4" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-white">{image.caption || `Showcase image ${index + 1}`}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.08] text-white/70 transition group-hover:text-white">
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </span>
          </button>
        ))}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/82 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={title}>
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white/70 transition hover:text-white"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <figure className="grid max-h-[90vh] w-full max-w-6xl gap-4">
            <img src={active.src} alt={active.caption || title} className="max-h-[78vh] w-full rounded-lg border border-white/10 bg-[#070a0f] object-contain p-3" />
            {active.caption ? <figcaption className="text-center text-sm text-white/62">{active.caption}</figcaption> : null}
          </figure>
        </div>
      ) : null}
    </>
  );
}
