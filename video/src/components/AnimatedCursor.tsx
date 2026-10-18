import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  x: number;
  y: number;
  isClicking?: boolean;
}

export const AnimatedCursor: React.FC<Props> = ({ x, y, isClicking = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clickSpring = spring({
    frame: isClicking ? frame % 30 : 0,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const rippleScale = interpolate(clickSpring, [0, 1], [0.8, 2.2]);
  const rippleOpacity = interpolate(clickSpring, [0, 1], [0.8, 0]);

  return (
    <div
      className="pointer-events-none absolute z-50 -translate-x-3 -translate-y-3 transition-transform"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {/* Click ripple circle */}
      {isClicking && (
        <div
          className="absolute -top-6 -left-6 h-18 w-18 rounded-full border-2 border-violet-400 bg-violet-500/20 shadow-[0_0_25px_rgba(139,92,246,0.8)]"
          style={{
            transform: `scale(${rippleScale})`,
            opacity: rippleOpacity,
          }}
        />
      )}

      {/* iOS/macOS Translucent Sleek Pointer */}
      <svg
        width="38"
        height="38"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
      >
        <path
          d="M4.5 3.5L11.5 20.5L14.5 13.5L21.5 10.5L4.5 3.5Z"
          fill="rgba(15, 10, 30, 0.9)"
          stroke="#a78bfa"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
