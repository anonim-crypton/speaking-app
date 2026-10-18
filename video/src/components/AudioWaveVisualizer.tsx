import React from "react";
import { useCurrentFrame } from "remotion";

interface Props {
  barsCount?: number;
  color?: string;
  maxHeight?: number;
}

export const AudioWaveVisualizer: React.FC<Props> = ({
  barsCount = 28,
  color = "from-violet-500 to-indigo-400",
  maxHeight = 90,
}) => {
  const frame = useCurrentFrame();

  const bars = Array.from({ length: barsCount });

  return (
    <div className="flex items-center justify-center gap-2 h-28 px-4">
      {bars.map((_, i) => {
        // Generate organic undulating speech wave pattern
        const speed = 0.18;
        const wave1 = Math.sin(frame * speed + i * 0.45);
        const wave2 = Math.cos(frame * (speed * 0.7) + i * 0.3);
        const combined = Math.abs(wave1 * 0.7 + wave2 * 0.3);
        const h = Math.max(8, combined * maxHeight);

        return (
          <div
            key={i}
            className={`w-2.5 rounded-full bg-gradient-to-t ${color} shadow-[0_0_12px_rgba(139,92,246,0.6)] transition-all`}
            style={{
              height: `${h}px`,
            }}
          />
        );
      })}
    </div>
  );
};
