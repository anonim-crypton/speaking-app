import React from "react";
import { Lock } from "lucide-react";

interface Props {
  children: React.ReactNode;
  url?: string;
  className?: string;
}

export const BrowserMockup: React.FC<Props> = ({
  children,
  url = "https://lingospeek.uz",
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border border-white/20 bg-[#0c0822]/90 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8),0_0_60px_rgba(139,92,246,0.25)] overflow-hidden flex flex-col ${className}`}
    >
      {/* Browser Chrome Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.04] px-6">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-4 rounded-full bg-[#ff5f56] shadow-[0_0_8px_rgba(255,95,86,0.6)]" />
          <div className="h-4 w-4 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.6)]" />
          <div className="h-4 w-4 rounded-full bg-[#27c93f] shadow-[0_0_8px_rgba(39,201,63,0.6)]" />
        </div>

        {/* URL Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-1.5 text-xs font-semibold text-zinc-300">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <span className="tracking-wide text-zinc-200">{url}</span>
        </div>

        {/* Right dummy actions */}
        <div className="flex items-center gap-2 opacity-50">
          <div className="h-3 w-8 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Browser Viewport */}
      <div className="relative flex-1 overflow-hidden bg-[#080514]/95">
        {children}
      </div>
    </div>
  );
};
