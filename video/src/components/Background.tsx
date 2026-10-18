import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const rot1 = (frame * 0.15) % 360;
  const rot2 = (-frame * 0.1) % 360;

  const glowOpacity = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [0.6, 0.95]
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070412]">
      {/* Dynamic Cosmic Gradient Orbs */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[140px] pointer-events-none transition-transform"
        style={{
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.45) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)",
          transform: `rotate(${rot1}deg) translate(50px, -30px)`,
          opacity: glowOpacity,
        }}
      />
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full blur-[150px] pointer-events-none transition-transform"
        style={{
          background: "radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)",
          transform: `rotate(${rot2}deg) translate(-40px, 40px)`,
          opacity: glowOpacity,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)",
        }}
      />

      {/* Cyber Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none shadow-[inset_0_0_160px_rgba(0,0,0,0.85)]" />
    </div>
  );
};
