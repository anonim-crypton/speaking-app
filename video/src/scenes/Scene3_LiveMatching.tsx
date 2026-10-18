import React from "react";
import {
  Mic,
  Volume2,
  Heart,
  Sparkles,
  Timer,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioWaveVisualizer } from "../components/AudioWaveVisualizer";

export const Scene3_LiveMatching: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14 } });
  const pulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.92, 1.08]);

  // Simulated seconds
  const totalSeconds = 24 + Math.floor(frame / 60);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-16 select-none">
      {/* Title */}
      <div
        className="text-center mb-16"
        style={{
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [-30, 0])}px)`,
        }}
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-6 py-2 backdrop-blur-xl mb-4">
          <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xl font-bold uppercase tracking-wider text-emerald-300">
            Real-Time Audio Call
          </span>
        </div>
        <h2 className="text-7xl font-black text-white">
          1-ga-1 Jonli Suhbat Mexanizmi
        </h2>
        <p className="mt-4 text-2xl text-zinc-300">
          Avtomatik tanlash (matchmaking) orqali soniyalar ichida suhbatdosh toping
        </p>
      </div>

      {/* Main Calling Stage */}
      <div
        className="relative flex items-center justify-between w-full max-w-7xl rounded-[40px] border border-white/20 bg-[#0e0926]/90 p-16 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8),0_0_80px_rgba(139,92,246,0.3)]"
        style={{
          opacity: enter,
          transform: `scale(${enter})`,
        }}
      >
        {/* Left User Profile (You) */}
        <div className="flex flex-col items-center text-center w-80">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-violet-600/40 blur-2xl"
              style={{ transform: `scale(${pulse})` }}
            />
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-violet-400 bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-2xl">
              <span className="text-6xl font-black text-white">A</span>
            </div>
            <span className="absolute bottom-1 right-2 text-4xl shadow-md">🇺🇿</span>
          </div>
          <h3 className="mt-6 text-3xl font-extrabold text-white">Azizbek</h3>
          <p className="text-xl font-semibold text-violet-300">Toshkent, O'zbekiston</p>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-emerald-300 text-sm font-bold">
            <Mic className="h-4 w-4 text-emerald-400" />
            <span>Gapirmoqda...</span>
          </div>
        </div>

        {/* Center Connecting Bridge / Wave */}
        <div className="flex flex-1 flex-col items-center px-12">
          {/* Active Call Timer */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/50 px-6 py-2.5 backdrop-blur-xl shadow-lg">
            <Timer className="h-6 w-6 text-violet-400" />
            <span className="text-3xl font-black text-white font-mono">
              {minutes}:{seconds}
            </span>
          </div>

          {/* Discussion Topic Card */}
          <div className="mt-8 w-full max-w-xl rounded-2xl border border-violet-500/30 bg-violet-950/40 p-6 text-center backdrop-blur-xl shadow-inner">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Muloqot Mavzusi (Topic)
            </span>
            <p className="mt-2 text-2xl font-bold text-white">
              "What is your dream travel destination and why?"
            </p>
          </div>

          {/* Animated Connecting Waveform */}
          <div className="mt-8 w-full">
            <AudioWaveVisualizer barsCount={48} maxHeight={110} />
          </div>

          {/* Floating Live Reactions */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-violet-600/30 border border-violet-400/30 px-4 py-2 text-white font-bold text-sm shadow">
              <ThumbsUp className="h-4 w-4 text-amber-300" /> Great accent!
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-violet-600/30 border border-violet-400/30 px-4 py-2 text-white font-bold text-sm shadow">
              <Sparkles className="h-4 w-4 text-yellow-300" /> +50 XP
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-rose-600/30 border border-rose-400/30 px-4 py-2 text-white font-bold text-sm shadow">
              <Heart className="h-4 w-4 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Right User Profile (Partner) */}
        <div className="flex flex-col items-center text-center w-80">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-indigo-600/40 blur-2xl"
              style={{ transform: `scale(${pulse})` }}
            />
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-indigo-400 bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-2xl">
              <span className="text-6xl font-black text-white">E</span>
            </div>
            <span className="absolute bottom-1 right-2 text-4xl shadow-md">🇬🇧</span>
          </div>
          <h3 className="mt-6 text-3xl font-extrabold text-white">Emma</h3>
          <p className="text-xl font-semibold text-indigo-300">London, United Kingdom</p>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-blue-300 text-sm font-bold">
            <Volume2 className="h-4 w-4 text-blue-400" />
            <span>Tinglamoqda</span>
          </div>
        </div>
      </div>
    </div>
  );
};
