import React from "react";
import {
  AudioWaveform,
  Globe2,
  Sparkles,
} from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioWaveVisualizer } from "../components/AudioWaveVisualizer";

export const Scene1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const titleProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const subtitleProgress = spring({
    frame: frame - 55,
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  const waveProgress = spring({
    frame: frame - 85,
    fps,
    config: { damping: 16, stiffness: 80 },
  });

  // Camera drift
  const cameraZ = interpolate(frame, [0, 300], [1, 1.08]);
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.7, 1]);

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center text-center select-none"
      style={{
        transform: `scale(${cameraZ})`,
      }}
    >
      {/* Glow aura behind logo */}
      <div
        className="absolute h-96 w-96 rounded-full bg-violet-600/35 blur-[120px] pointer-events-none"
        style={{
          transform: `scale(${logoScale * glowPulse})`,
        }}
      />

      {/* Top Tag Pill */}
      <div
        className="mb-8 inline-flex items-center gap-3 rounded-full border border-violet-500/40 bg-violet-500/15 px-6 py-2.5 backdrop-blur-2xl shadow-[0_0_30px_rgba(139,92,246,0.35)]"
        style={{
          opacity: interpolate(frame, [0, 20], [0, 1]),
          transform: `translateY(${interpolate(frame, [0, 20], [30, 0])}px)`,
        }}
      >
        <Sparkles className="h-5 w-5 text-violet-300 animate-spin" />
        <span className="text-xl font-bold tracking-wider uppercase text-violet-200">
          Global Speaking Platform
        </span>
      </div>

      {/* 3D App Icon */}
      <div
        className="relative flex h-44 w-44 items-center justify-center rounded-[42px] border-2 border-violet-400/50 bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-white shadow-[0_0_80px_rgba(139,92,246,0.7),inset_0_2px_0_rgba(255,255,255,0.4)]"
        style={{
          transform: `scale(${logoScale}) rotate(${interpolate(frame, [0, 60], [-15, 0])}deg)`,
        }}
      >
        <AudioWaveform className="h-24 w-24 text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]" />
      </div>

      {/* Main Title */}
      <h1
        className="mt-10 text-8xl font-black tracking-tight text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        style={{
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
        }}
      >
        Lingo{" "}
        <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
          Speek
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className="mt-6 max-w-4xl text-3xl font-medium tracking-wide text-zinc-300"
        style={{
          opacity: subtitleProgress,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        Dunyo Bo'ylab Ingliz Tilida Erkin Gapiring • Real-Time Audio Calling
      </p>

      {/* Audio Wave Visualizer */}
      <div
        className="mt-12 flex items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-3 backdrop-blur-2xl"
        style={{
          opacity: waveProgress,
          transform: `scale(${waveProgress})`,
        }}
      >
        <Globe2 className="h-8 w-8 text-violet-400 animate-pulse" />
        <AudioWaveVisualizer barsCount={36} maxHeight={75} />
        <span className="text-xl font-bold text-zinc-300">Live Voice Match</span>
      </div>
    </div>
  );
};
