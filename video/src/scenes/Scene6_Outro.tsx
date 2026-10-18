import React from "react";
import {
  AudioWaveform,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
} from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Scene6_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14 } });
  const scale = spring({ frame: frame - 15, fps, config: { damping: 14 } });

  const pulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.95, 1.05]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center text-center p-16 select-none">
      {/* Background glow orb */}
      <div
        className="absolute h-[600px] w-[600px] rounded-full bg-violet-600/35 blur-[160px] pointer-events-none"
        style={{ transform: `scale(${pulse})` }}
      />

      {/* 3D App Icon */}
      <div
        className="relative flex h-36 w-36 items-center justify-center rounded-[36px] border-2 border-violet-400/50 bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-white shadow-[0_0_80px_rgba(139,92,246,0.7)]"
        style={{
          transform: `scale(${scale})`,
          opacity: enter,
        }}
      >
        <AudioWaveform className="h-20 w-20 text-white" />
      </div>

      {/* Main Call to action */}
      <h2
        className="mt-10 text-8xl font-black tracking-tight text-white leading-tight"
        style={{
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        }}
      >
        Hoziroq O'z Muloqotingizni{" "}
        <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
          Boshlang!
        </span>
      </h2>

      <p
        className="mt-6 max-w-4xl text-3xl font-medium text-zinc-300"
        style={{
          opacity: enter,
        }}
      >
        O'z darajangizdagi suhbatdoshlar bilan har kuni jonli amaliyot qiling
      </p>

      {/* Web address pill */}
      <div
        className="mt-12 inline-flex items-center gap-4 rounded-3xl border-2 border-violet-500/50 bg-gradient-to-r from-violet-600 to-indigo-600 px-12 py-6 text-3xl font-black text-white shadow-[0_0_60px_rgba(139,92,246,0.6)]"
        style={{
          transform: `scale(${enter})`,
        }}
      >
        <Globe2 className="h-9 w-9 text-white" />
        <span>lingospeek.uz</span>
        <ArrowRight className="h-9 w-9 ml-2" />
      </div>

      {/* Feature perks */}
      <div
        className="mt-16 flex items-center gap-12 text-zinc-400 text-xl font-bold"
        style={{ opacity: enter }}
      >
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-amber-400" />
          <span>Tezkor ro'yxatdan o'tish</span>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <span>100% Xavfsiz & Bepul</span>
        </div>
        <div className="flex items-center gap-3">
          <Globe2 className="h-6 w-6 text-indigo-400" />
          <span>Barcha mamlakatlar</span>
        </div>
      </div>
    </div>
  );
};
