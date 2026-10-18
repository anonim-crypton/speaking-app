import React from "react";
import { AudioWaveform, Sparkles } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RealVideoWindow } from "../components/RealVideoWindow";
import { GlassBadge } from "../components/GlassBadge";
import { AnimatedCursor } from "../components/AnimatedCursor";
import { AudioWaveVisualizer } from "../components/AudioWaveVisualizer";

export const Real_Scene_Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  // Camera Zoom Choreography
  // Phase 1 (0-240): Wide view
  // Phase 2 (240-580): Zoom into START button & language selector
  // Phase 3 (580-840): Pan to stats
  const zoom = interpolate(
    frame,
    [0, 240, 320, 560, 640, 840],
    [1, 1, 1.45, 1.45, 1.25, 1.05],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const originX = interpolate(
    frame,
    [0, 240, 320, 560, 640, 840],
    [50, 50, 38, 38, 75, 50],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const originY = interpolate(
    frame,
    [0, 240, 320, 560, 640, 840],
    [50, 50, 72, 72, 45, 50],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const rotY = interpolate(frame, [0, 840], [-3, 3]);

  // Cursor moves to big START button
  const cursorX = interpolate(
    frame,
    [0, 260, 380, 500],
    [2400, 1100, 1050, 1050]
  );
  const cursorY = interpolate(
    frame,
    [0, 260, 380, 500],
    [1400, 1350, 1380, 1380]
  );
  const isClicking = frame > 390 && frame < 450;

  return (
    <div className="relative flex h-full w-full items-center justify-center p-16 select-none">
      {/* Top Floating iOS Glass Badge */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30">
        <GlassBadge
          icon={AudioWaveform}
          step="03 / Asosiy Dashboard"
          title="1-ga-1 Jonli Speaking Muloqoti"
          subtitle="O'zingizga ma'qul tilni tanlang va bir tugma bilan suhbatdosh toping"
        />
      </div>

      {/* Floating Audio Waveform Accent (Bottom Right) */}
      <div
        className="absolute bottom-16 right-20 z-30 flex items-center gap-4 rounded-3xl border border-white/20 bg-[#0e0924]/90 px-8 py-4 backdrop-blur-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
        style={{
          opacity: interpolate(frame, [150, 200], [0, 1], {
            extrapolateLeft: "clamp",
          }),
        }}
      >
        <Sparkles className="h-6 w-6 text-violet-300 animate-spin" />
        <span className="text-xl font-bold text-white">Jonli Ovozli To'lqin</span>
        <AudioWaveVisualizer barsCount={24} maxHeight={60} />
      </div>

      {/* 3D Real Video Window */}
      <div
        className="mt-24 transition-transform"
        style={{
          transform: `perspective(1600px) rotateY(${rotY}deg) scale(${enter})`,
          opacity: enter,
        }}
      >
        <RealVideoWindow
          startFromFrame={1560} // ~26s in recording
          scale={zoom}
          originX={originX}
          originY={originY}
          url="https://lingospeek.uz/dashboard"
        />

        {/* Custom Animated Glass Cursor */}
        <AnimatedCursor x={cursorX} y={cursorY} isClicking={isClicking} />
      </div>
    </div>
  );
};
