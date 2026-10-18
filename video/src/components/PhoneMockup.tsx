import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const PhoneMockup: React.FC<Props> = ({ children, className = "" }) => {
  return (
    <div
      className={`relative mx-auto rounded-[52px] p-3.5 border-[3px] border-zinc-700/80 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(139,92,246,0.3)] ring-1 ring-white/20 ${className}`}
      style={{
        width: "480px",
        height: "960px",
      }}
    >
      {/* Outer titanium bevel reflection */}
      <div className="absolute inset-0 rounded-[50px] pointer-events-none ring-1 ring-inset ring-white/20" />

      {/* Screen Frame */}
      <div className="relative h-full w-full rounded-[44px] overflow-hidden bg-[#080514] border border-white/10 flex flex-col">
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex h-7 w-28 items-center justify-between rounded-full bg-black px-3 shadow-md">
          <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-700" />
          <div className="h-2.5 w-2.5 rounded-full bg-blue-950/80" />
        </div>

        {/* Screen Content */}
        <div className="relative flex-1 overflow-hidden pt-10">
          {children}
        </div>
      </div>
    </div>
  );
};
