import { useEffect, useState, type CSSProperties } from "react";

import { BRAND } from "@/i18n/translations";
import { cn } from "@/lib/utils";

/** The supplied voice-bar animation (150x150, VP8 with alpha, 4 s loop). */
const VIDEO_SRC = "/loading.webm";

/**
 * CSS replica of the voice bars, used only when the browser cannot decode the
 * WebM (e.g. VP8 alpha in older Safari). Same look, same behaviour.
 */
function WaveFallback() {
  const bars = [
    { x: 14, h: 26, min: "0.72", dur: "0.95s", delay: "-0.10s" },
    { x: 32, h: 58, min: "0.46", dur: "1.15s", delay: "-0.35s" },
    { x: 50, h: 88, min: "0.34", dur: "0.85s", delay: "-0.05s" },
    { x: 68, h: 44, min: "0.52", dur: "1.05s", delay: "-0.55s" },
    { x: 86, h: 66, min: "0.46", dur: "0.90s", delay: "-0.20s" },
    { x: 104, h: 26, min: "0.72", dur: "1.20s", delay: "-0.65s" },
  ];

  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 text-white" aria-hidden="true">
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={60 - bar.h / 2}
          width={7}
          height={bar.h}
          rx={3.5}
          fill="currentColor"
          className="wave-bar"
          style={
            {
              "--wave-min": bar.min,
              "--wave-dur": bar.dur,
              "--wave-delay": bar.delay,
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}

function canPlayWebm(): boolean {
  try {
    const probe = document.createElement("video");
    return probe.canPlayType('video/webm; codecs="vp8"') !== "";
  } catch {
    return true;
  }
}

interface LoadingScreenProps {
  visible: boolean;
  /** Screen-reader label. */
  label?: string;
}

export default function LoadingScreen({ visible, label = "Loading" }: LoadingScreenProps) {
  /* Kept mounted during the fade-out so the animation never cuts abruptly. */
  const [mounted, setMounted] = useState(visible);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoSupported] = useState(canPlayWebm);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), 550);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  const showVideo = videoSupported && !videoFailed;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background",
        "transition-opacity duration-500 ease-out",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="neon-backdrop" aria-hidden />

      <div className="relative grid place-items-center">
        {/* ambient halo behind the animation */}
        <div
          className="absolute h-44 w-44 animate-pulse-glow rounded-full bg-brand-500/30 blur-3xl"
          aria-hidden
        />

        {showVideo ? (
          <video
            src={VIDEO_SRC}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => setVideoFailed(true)}
            className="relative h-32 w-32 select-none"
            aria-hidden
          />
        ) : (
          <div className="relative">
            <WaveFallback />
          </div>
        )}
      </div>

      <p className="relative mt-5 text-lg font-extrabold tracking-tight text-foreground">
        {BRAND}
      </p>
    </div>
  );
}
