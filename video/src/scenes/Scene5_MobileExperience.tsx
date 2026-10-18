import React from "react";
import {
  AudioWaveform,
  Radio,
  History,
  Users,
  MessageCircle,
  Bell,
  Sparkles,
  Flame,
  Award,
} from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";

export const Scene5_MobileExperience: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  // 3D rotation of the phone
  const phoneRotY = interpolate(frame, [0, 360], [-10, 8]);
  const phoneRotX = interpolate(frame, [0, 360], [8, 3]);

  return (
    <div className="relative flex h-full w-full items-center justify-between px-32 select-none">
      {/* Left Text Explanations */}
      <div
        className="w-[45%] text-left"
        style={{
          opacity: enter,
          transform: `translateX(${interpolate(enter, [0, 1], [-60, 0])}px)`,
        }}
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-violet-500/40 bg-violet-500/15 px-6 py-2 backdrop-blur-xl mb-6">
          <Sparkles className="h-5 w-5 text-violet-300" />
          <span className="text-xl font-bold uppercase tracking-wider text-violet-200">
            Mobil Moslashuvchanlik
          </span>
        </div>

        <h2 className="text-7xl font-black text-white leading-tight">
          Istalgan Qurilmada Qulay Foydalanish
        </h2>

        <p className="mt-8 text-2xl text-zinc-300 leading-relaxed">
          Smartfoningizdan turib to'liq tajribadan bahramand bo'ling. Yangi, maxsus ishlab chiqilgan{" "}
          <span className="text-violet-400 font-bold">Floating Dock</span> navigatsiyasi orqali bir qo'l bilan barcha bo'limlarga oson o'ting.
        </p>

        {/* Feature Highlights */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/30 text-violet-300 font-bold">
              1
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">Yaxlit Kapsula Menyu</h4>
              <p className="text-lg text-zinc-400">Asosiy bo'limlar ixcham va ergonomik tarzda joylashgan</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 font-bold">
              2
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">Alohida Avatar Profil</h4>
              <p className="text-lg text-zinc-400">Profil va shaxsiy sozlamalar maxsus ajratilgan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Phone Mockup in 3D */}
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `perspective(1400px) rotateY(${phoneRotY}deg) rotateX(${phoneRotX}deg) scale(${enter})`,
        }}
      >
        <PhoneMockup>
          {/* Phone Header */}
          <div className="flex items-center justify-between px-6 pt-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                <AudioWaveform className="h-5 w-5" />
              </div>
              <span className="text-lg font-black text-white">Speaking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-zinc-300">
                <Bell className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Phone Screen Body */}
          <div className="p-6 space-y-4">
            {/* Daily Streak Card */}
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-3">
                <Flame className="h-7 w-7 text-amber-400 animate-bounce" />
                <div>
                  <h5 className="text-base font-bold text-white">Kunlik Streak: 5 kun!</h5>
                  <p className="text-xs text-zinc-400">O'rganishda davom eting</p>
                </div>
              </div>
              <span className="text-sm font-black text-amber-300">+100 XP</span>
            </div>

            {/* Speaking Call Card */}
            <div className="rounded-3xl border border-violet-500/40 bg-gradient-to-b from-violet-600/20 to-indigo-600/10 p-6 text-center shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_25px_rgba(139,92,246,0.5)]">
                <AudioWaveform className="h-8 w-8" />
              </div>
              <h4 className="mt-4 text-xl font-black text-white">Jonli Muloqotni Boshlash</h4>
              <p className="mt-1 text-xs text-zinc-300">Tasodifiy suhbatdosh bilan ulaning</p>
              <div className="mt-4 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow">
                Hozir bog'lanish
              </div>
            </div>

            {/* Active Clubs */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Faol Klublar</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Tech & Startups Club</span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">8 kishi</span>
              </div>
            </div>
          </div>

          {/* Floating Mobile Dock (Exactly like the real app!) */}
          <div className="absolute bottom-6 left-0 right-0 z-40 flex items-center justify-center gap-2 px-3 pointer-events-none">
            {/* Connected Capsule */}
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/20 bg-[#0e0924]/95 p-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                <AudioWaveform className="h-4.5 w-4.5" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400">
                <Radio className="h-4.5 w-4.5" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400">
                <History className="h-4.5 w-4.5" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full text-blue-400">
                <MessageCircle className="h-4.5 w-4.5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                  1
                </span>
              </div>
            </div>

            {/* Standalone Profile Avatar */}
            <div className="pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0e0924]/95 text-white shadow-xl ring-2 ring-violet-400">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                A
              </div>
            </div>
          </div>
        </PhoneMockup>
      </div>
    </div>
  );
};
