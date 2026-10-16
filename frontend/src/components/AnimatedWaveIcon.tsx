import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * The exact `AudioLines` mark (6 vertical bars at x = 2, 6, 10, 14, 18, 22),
 * redrawn as individual bars so each one can pulse on its own.
 *
 * Visually identical to the lucide icon at rest — only the white bars move,
 * rising and falling like a voice while speaking.
 */
const BARS = [
  { d: "M2 10v3", min: "0.72", dur: "0.95s", delay: "-0.10s" },
  { d: "M6 6v11", min: "0.46", dur: "1.15s", delay: "-0.35s" },
  { d: "M10 3v18", min: "0.38", dur: "0.85s", delay: "-0.05s" },
  { d: "M14 8v7", min: "0.52", dur: "1.05s", delay: "-0.55s" },
  { d: "M18 5v13", min: "0.46", dur: "0.90s", delay: "-0.20s" },
  { d: "M22 10v3", min: "0.72", dur: "1.20s", delay: "-0.65s" },
];

interface AnimatedWaveIconProps {
  className?: string;
  strokeWidth?: number;
}

export default function AnimatedWaveIcon({
  className,
  strokeWidth = 2,
}: AnimatedWaveIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {BARS.map((bar) => (
        <path
          key={bar.d}
          d={bar.d}
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
