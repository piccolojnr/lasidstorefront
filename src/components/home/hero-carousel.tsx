"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Slide = {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  imageSrc?: string | null;
  imageAlt: string;
  eyebrow?: string;
};

type Props = {
  slides: Slide[];
};

export default function HeroCarousel({ slides }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const activeSlide = slides[activeIndex];

  React.useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <div
      className="relative overflow-hidden bg-foreground/5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      style={{ isolation: "isolate" }}
    >
      <div className="max-w-7xl mx-auto relative">
        <div
          key={`${activeSlide.title}-${activeIndex}`}
          className="min-h-80 sm:min-h-96 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="grid h-full items-center gap-8 px-5 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,24rem)] lg:gap-10">
            <div className="max-w-lg">
              {activeSlide.eyebrow ? (
                <p className="flex items-center gap-2.5 text-sm font-semibold tracking-widest uppercase text-primary/70">
                  <span className="block h-5 w-[3px] rounded-full bg-primary/50" />
                  {activeSlide.eyebrow}
                </p>
              ) : null}
              <h1 className="mt-2 font-heading text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl">
                {activeSlide.title}
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
                {activeSlide.description}
              </p>
              <div className="mt-6">
                <a
                  href={activeSlide.ctaHref}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  aria-label={activeSlide.ctaLabel}
                >
                  {activeSlide.ctaLabel}
                </a>
              </div>
            </div>

            <div className="flex items-end justify-center overflow-hidden">
              {activeSlide.imageSrc ? (
                <img
                  src={activeSlide.imageSrc}
                  alt={activeSlide.imageAlt}
                  className="h-64 w-full object-contain object-bottom sm:h-80 mix-blend-multiply dark:mix-blend-luminosity"
                />
              ) : (
                <div className="grid w-full max-w-sm grid-cols-2 gap-3 pb-8">
                  <div className="aspect-4/5 rounded-2xl border border-border bg-background"></div>
                  <div className="aspect-4/5 rounded-2xl border border-border bg-background"></div>
                  <div className="aspect-4/5 rounded-2xl border border-border bg-background"></div>
                  <div className="aspect-4/5 rounded-2xl border border-border bg-background"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {slides.length > 1 ? (
          <div className="absolute bottom-6 left-5 flex items-center gap-2.5 sm:left-8">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${slide.title}-dot-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "rounded-full border transition-all duration-300",
                    isActive
                      ? "w-6 h-2.5 border-foreground bg-foreground"
                      : "size-2.5 border-border bg-background/90 hover:border-muted-foreground",
                  )}
                  aria-label={`Show slide ${index + 1}`}
                  aria-pressed={isActive}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
