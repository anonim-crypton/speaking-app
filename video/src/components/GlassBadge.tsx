import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  icon: React.ComponentType<{ className?: string }>;
  step: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export const GlassBadge: React.FC<Props> = ({
  icon: Icon,
  step,
  title,
  subtitle,
  className = "",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <div
      className={`inline-flex items-center gap-6 rounded-[36px] border border-white/25 bg-[#0f0a28]/90 px-12 py-5 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(139,92,246,0.4)] ring-1 ring-white/15 ${className}`}
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [-30, 0])}px) scale(${enter})`,
      }}
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/20 bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-white shadow-xl shadow-violet-900/50">
        <Icon className="h-10 w-10 text-white" />
      </div>

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-2.5 mb-0.5">
          <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="text-base font-black tracking-widest uppercase text-violet-300">
            {step}
          </span>
        </div>
        <span className="text-4xl font-black text-white tracking-tight">
          {title}
        </span>
        {subtitle && (
          <span className="mt-1 text-xl font-medium text-zinc-300">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
