import React from "react";
import { Video, staticFile } from "remotion";
import { Lock } from "lucide-react";

interface Props {
  startFromFrame: number;
  scale?: number;
  originX?: number; // percentage 0-100
  originY?: number; // percentage 0-100
  className?: string;
  url?: string;
}

export const RealVideoWindow: React.FC<Props> = ({
  startFromFrame,
  scale = 1,
  originX = 50,
  originY = 50,
  className = "",
  url = "https://lingospeek.uz",
}) => {
  return (
    <div
      className={`relative w-[3240px] h-[1800px] rounded-[42px] border border-white/20 bg-[#0a061c]/95 backdrop-blur-3xl shadow-[0_50px_140px_rgba(0,0,0,0.9),0_0_100px_rgba(139,92,246,0.3)] overflow-hidden flex flex-col ${className}`}
    >
      {/* Sleek macOS Apple Glass Header Bar (scaled for 4K) */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.03] px-10">
        {/* Traffic Lights */}
        <div className="flex items-center gap-3.5">
          <div className="h-5 w-5 rounded-full bg-[#ff5f56] shadow-[0_0_10px_rgba(255,95,86,0.7)]" />
          <div className="h-5 w-5 rounded-full bg-[#ffbd2e] shadow-[0_0_10px_rgba(255,189,46,0.7)]" />
          <div className="h-5 w-5 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.7)]" />
        </div>

        {/* URL Pill */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/50 px-8 py-2.5 text-lg font-bold text-zinc-300 shadow-inner">
          <Lock className="h-5 w-5 text-emerald-400" />
          <span className="tracking-wide text-zinc-100 font-mono">{url}</span>
        </div>

        {/* Window Controls Dummy */}
        <div className="flex items-center gap-2.5 opacity-40">
          <div className="h-4 w-12 rounded-full bg-white/25" />
        </div>
      </div>

      {/* Video Content Viewport (Browser header clipped out) */}
      <div className="relative flex-1 overflow-hidden bg-[#080514]">
        <div
          className="relative w-full h-full transition-transform"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: `${originX}% ${originY}%`,
          }}
        >
          {/* We offset top by -7.8% and scale height by 107.8% to crop out the localhost tabs bar */}
          <div className="absolute inset-0 -top-[7.8%] h-[107.8%] w-full">
            <Video
              src={staticFile("video.mp4")}
              startFrom={startFromFrame}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
