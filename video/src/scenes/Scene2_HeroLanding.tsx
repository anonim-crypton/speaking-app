import React from "react";
import {
  AudioWaveform,
  Globe,
  Mic,
  Users,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserMockup } from "../components/BrowserMockup";

export const Scene2_HeroLanding: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 85 },
  });

  const card1 = spring({ frame: frame - 40, fps, config: { damping: 14 } });
  const card2 = spring({ frame: frame - 65, fps, config: { damping: 14 } });
  const card3 = spring({ frame: frame - 90, fps, config: { damping: 14 } });

  // Camera 3D angle movement
  const rotateX = interpolate(frame, [0, 360], [6, 1]);
  const rotateY = interpolate(frame, [0, 360], [-5, 2]);
  const scale = interpolate(frame, [0, 360], [0.95, 1.03]);

  return (
    <div className="relative flex h-full w-full items-center justify-center p-16 select-none">
      {/* Title above browser */}
      <div
        className="absolute top-12 left-1/2 -translate-x-1/2 text-center z-20"
        style={{
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [-20, 0])}px)`,
        }}
      >
        <span className="text-2xl font-bold uppercase tracking-widest text-violet-400">
          Zamonaviy Bosh Sahifa
        </span>
        <h2 className="mt-2 text-6xl font-black text-white">
          Intuitiv, Tezkor va Estetik Dizayn
        </h2>
      </div>

      {/* 3D Browser Window */}
      <div
        className="mt-24 w-[2800px] h-[1550px]"
        style={{
          transform: `perspective(1600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale * enter})`,
          opacity: enter,
        }}
      >
        <BrowserMockup url="https://lingospeek.uz">
          {/* Mockup Header */}
          <header className="flex h-24 items-center justify-between border-b border-white/10 px-12 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg">
                <AudioWaveform className="h-7 w-7" />
              </div>
              <span className="text-3xl font-black text-white">Lingo Speek</span>
            </div>

            <nav className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] p-2">
              <span className="rounded-full bg-white/10 px-6 py-2.5 text-lg font-bold text-white">
                Bosh sahifa
              </span>
              <span className="px-6 py-2.5 text-lg font-medium text-zinc-400">
                Amaliyot
              </span>
              <span className="px-6 py-2.5 text-lg font-medium text-zinc-400">
                Biz haqimizda
              </span>
              <span className="px-6 py-2.5 text-lg font-medium text-zinc-400">
                Yordam
              </span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-lg font-bold text-zinc-200">
                🇺🇿 O'zbekcha
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-lg font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)]">
                Kirish / Ro'yxatdan o'tish
              </div>
            </div>
          </header>

          {/* Mockup Hero Body */}
          <div className="flex flex-col items-center justify-center pt-24 px-16 text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-3 rounded-full border border-violet-400/30 bg-violet-500/10 px-6 py-2.5 text-lg font-bold text-violet-300">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <span>Hozirda 150+ faol suhbatdosh onlayn</span>
            </div>

            {/* Hero Big Headline */}
            <h1 className="mt-8 max-w-5xl text-7xl font-black tracking-tight text-white leading-tight">
              Ingliz Tilida Erkin Gapirishning{" "}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                Eng Samarali
              </span>{" "}
              Yo'li
            </h1>

            <p className="mt-6 max-w-3xl text-2xl font-normal text-zinc-400">
              Grammatika yodlashdan charchadingizmi? Dunyoning turli burchaklaridagi o'rganuvchilar bilan 1-ga-1 audio muloqot qilib, til to'sig'ini oson yenging!
            </p>

            {/* Big Action Button */}
            <div className="mt-12 flex items-center gap-6">
              <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-10 py-5 text-2xl font-black text-white shadow-[0_0_50px_rgba(139,92,246,0.6)] cursor-pointer">
                <Mic className="h-7 w-7 text-white" />
                <span>Hoziroq Suhbatni Boshlash</span>
                <ArrowRight className="h-7 w-7 ml-2" />
              </div>
            </div>

            {/* 3 Floating Stat Cards */}
            <div className="mt-20 grid grid-cols-3 gap-8 w-full max-w-6xl">
              <div
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-left backdrop-blur-2xl shadow-xl"
                style={{
                  opacity: card1,
                  transform: `translateY(${interpolate(card1, [0, 1], [40, 0])}px)`,
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300 mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-4xl font-extrabold text-white">10,000+</h3>
                <p className="mt-2 text-lg text-zinc-400">Faol foydalanuvchilar hamjamiyati</p>
              </div>

              <div
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-left backdrop-blur-2xl shadow-xl"
                style={{
                  opacity: card2,
                  transform: `translateY(${interpolate(card2, [0, 1], [40, 0])}px)`,
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 mb-4">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-4xl font-extrabold text-white">50+ Davlat</h3>
                <p className="mt-2 text-lg text-zinc-400">Xalqaro darajadagi jonli aloqa</p>
              </div>

              <div
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-left backdrop-blur-2xl shadow-xl"
                style={{
                  opacity: card3,
                  transform: `translateY(${interpolate(card3, [0, 1], [40, 0])}px)`,
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 mb-4">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-4xl font-extrabold text-white">100% Bepul</h3>
                <p className="mt-2 text-lg text-zinc-400">Darhol, ortiqcha to'lovlarsiz muloqot</p>
              </div>
            </div>
          </div>
        </BrowserMockup>
      </div>
    </div>
  );
};
