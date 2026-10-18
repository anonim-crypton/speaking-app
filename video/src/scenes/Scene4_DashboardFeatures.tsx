import React from "react";
import {
  AudioWaveform,
  Radio,
  History,
  Users,
  MessageCircle,
  Gamepad2,
  BookOpen,
  Trophy,
  CheckSquare,
  Crown,
} from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Scene4_DashboardFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  const features = [
    {
      icon: AudioWaveform,
      title: "Speaking (1-on-1)",
      desc: "Xalqaro suhbatdoshlar bilan tezkor audio muloqot",
      color: "from-violet-600 to-indigo-600",
      border: "border-violet-500/40",
      delay: 10,
    },
    {
      icon: Radio,
      title: "Audio Klublar",
      desc: "Qiziqarli mavzularda guruhli jonli podcast xonalari",
      color: "from-indigo-600 to-blue-600",
      border: "border-indigo-500/40",
      delay: 25,
    },
    {
      icon: MessageCircle,
      title: "Do'stlar & Xabarlar",
      desc: "Do'stlar orttirish va shaxsiy xabar yozishish imkoni",
      color: "from-blue-600 to-cyan-600",
      border: "border-blue-500/40",
      delay: 40,
      badge: "Yangi",
    },
    {
      icon: Gamepad2,
      title: "Topshiriqli O'yinlar",
      desc: "Interaktiv so'z boyligi va grammatika o'yinlari",
      color: "from-purple-600 to-pink-600",
      border: "border-purple-500/40",
      delay: 55,
    },
    {
      icon: BookOpen,
      title: "Foydali Kitoblar",
      desc: "Barcha darajadagi elektron kitoblar va audio resurslar",
      color: "from-amber-600 to-orange-600",
      border: "border-amber-500/40",
      delay: 70,
      badge: "PRO",
    },
    {
      icon: Trophy,
      title: "Reyting & Yutuqlar",
      desc: "Kunlik peshqadamlar, darajalar va qimmatbaho mukofotlar",
      color: "from-yellow-600 to-amber-500",
      border: "border-yellow-500/40",
      delay: 85,
    },
  ];

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
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/15 px-6 py-2 backdrop-blur-xl mb-4">
          <Crown className="h-5 w-5 text-amber-300" />
          <span className="text-xl font-bold uppercase tracking-wider text-violet-300">
            Keng Qamrovli Ekotizim
          </span>
        </div>
        <h2 className="text-7xl font-black text-white">
          O'rganish Uchun Barcha Zarur Imkoniyatlar
        </h2>
        <p className="mt-4 text-2xl text-zinc-300">
          Shunchaki suhbat emas — to'liq ingliz tili platformasi
        </p>
      </div>

      {/* 6 Feature Grid Cards */}
      <div className="grid grid-cols-3 gap-8 w-full max-w-7xl">
        {features.map((f, i) => {
          const cardSpring = spring({
            frame: frame - f.delay,
            fps,
            config: { damping: 14, stiffness: 90 },
          });

          const Icon = f.icon;

          return (
            <div
              key={i}
              className={`relative overflow-hidden rounded-[32px] border ${f.border} bg-[#0d0824]/80 p-10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]`}
              style={{
                opacity: cardSpring,
                transform: `translateY(${interpolate(cardSpring, [0, 1], [60, 0])}px) scale(${cardSpring})`,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr ${f.color} text-white shadow-xl`}
                >
                  <Icon className="h-10 w-10 text-white" />
                </div>
                {f.badge && (
                  <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-black uppercase tracking-wider text-white shadow">
                    {f.badge}
                  </span>
                )}
              </div>
              <h3 className="text-3xl font-black text-white">{f.title}</h3>
              <p className="mt-3 text-xl text-zinc-300 leading-relaxed">
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
