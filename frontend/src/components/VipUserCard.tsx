import React from "react";
import { Mic, MicOff, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import SpeakerAvatar from "@/components/SpeakerAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface VipUserCardProps {
  name: string;
  username: string;
  avatarUrl?: string | null;
  isPremium?: boolean;
  isVerified?: boolean;
  roleBadge?: "Siz" | "Sherik" | string;
  isMicMuted?: boolean;
  isPartner?: boolean;
  rightExtra?: React.ReactNode;
  className?: string;
}

/**
 * 4-Point Star Lens Flare / Sparkle Graphic matching the VIP mockups
 */
function SparkleGlint({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("pointer-events-none select-none text-amber-200 filter drop-shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-pulse", className)}
      fill="currentColor"
    >
      <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
    </svg>
  );
}

/**
 * Solid Golden Crown Icon
 */
function VipCrownIcon({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="url(#vipCrownGold)"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("filter drop-shadow-[0_2px_4px_rgba(245,166,35,0.6)]", className)}
    >
      <defs>
        <linearGradient id="vipCrownGold" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <path d="M3 18h18v2.5H3V18zm1.5-12l4.5 5 3-7 3 7 4.5-5L18 16H6L4.5 6z" />
    </svg>
  );
}

export default function VipUserCard({
  name,
  username,
  avatarUrl,
  isPremium = false,
  isVerified = false,
  roleBadge,
  isMicMuted,
  isPartner = false,
  rightExtra,
  className,
}: VipUserCardProps) {
  const cleanUsername = (username || "").replace(/^@+/, "");

  /* ════════════════════════════════════════════════════════════════
     1. VIP / PREMIUM STYLING (Image 2 Replica)
     ════════════════════════════════════════════════════════════════ */
  if (isPremium) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-between gap-4 rounded-3xl p-4 sm:p-5",
          "bg-[#0b071b] border-2 border-amber-400/90",
          "shadow-[0_0_28px_rgba(245,158,11,0.35),inset_0_0_15px_rgba(245,158,11,0.06)]",
          "backdrop-blur-2xl transition-all duration-300 overflow-hidden",
          className
        )}
      >
        {/* Top-left Corner Golden Lens Flare Glint */}
        <SparkleGlint className="absolute -top-1 -left-1 opacity-90 scale-125" size={24} />
        {/* Bottom-right Corner Soft Lens Flare Glint */}
        <SparkleGlint className="absolute -bottom-1 -right-1 opacity-75 scale-90" size={20} />

        {/* ── Left Side: Avatar + Name + Username ── */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Avatar with Double Golden Ring + Glint + Overlapping Star Verified Badge */}
          <div className="relative shrink-0">
            {/* Top-left Sparkle on Avatar Ring */}
            <SparkleGlint className="absolute -top-1.5 -left-1.5 z-20 scale-110" size={18} />

            <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              <div className="rounded-full p-[2px] bg-[#0b071b]">
                <SpeakerAvatar size={54} src={avatarUrl} className="ring-1 ring-amber-400/50" />
              </div>
            </div>

            {/* Overlapping Golden Verified 8-Point Star Badge (Bottom Right of Avatar) */}
            <div className="absolute -bottom-1.5 -right-1.5 z-20">
              <VerifiedBadge size={22} />
            </div>

            {/* Mic / Connection Status Indicator if applicable */}
            {typeof isMicMuted === "boolean" && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#0b071b]",
                  isMicMuted ? "bg-red-500" : "bg-emerald-500"
                )}
              >
                {isMicMuted ? (
                  <MicOff className="h-2.5 w-2.5 text-white" />
                ) : (
                  <Mic className="h-2.5 w-2.5 text-white" />
                )}
              </span>
            )}
            {isPartner && typeof isMicMuted !== "boolean" && (
              <span className="absolute -top-1 -right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0b071b]">
                <UserCheck className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </div>

          {/* User Name & @username */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {roleBadge && (
                <span className="rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  {roleBadge}
                </span>
              )}
              <p className="truncate text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {name}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs sm:text-sm font-semibold font-mono text-[#b8a5e8]">
              @{cleanUsername}
            </p>
          </div>
        </div>

        {/* ── Right Side: Golden VIP Pill Badge + Optional Extra (e.g. Flag) ── */}
        <div className="shrink-0 flex items-center gap-2.5">
          {rightExtra}

          {/* Elongated Golden VIP Badge */}
          <div className="relative flex items-center gap-2 rounded-full border-2 border-amber-400/90 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 px-4 sm:px-5 py-1.5 sm:py-2 shadow-[0_0_22px_rgba(245,158,11,0.45)] select-none">
            {/* Sparkle on VIP pill right curve */}
            <SparkleGlint className="absolute -top-1 -right-1 opacity-90 scale-90" size={16} />
            <VipCrownIcon size={20} />
            <span className="text-base sm:text-lg font-black tracking-wider text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              VIP
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     2. STANDARD / CLEAN NON-VIP STYLING (Image 1 Style)
     ════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3.5 rounded-2xl border border-white/[0.08] bg-[#0b071b]/90 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl transition-all duration-300",
        className
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative shrink-0">
          <SpeakerAvatar size={48} src={avatarUrl} className="ring-2 ring-white/10" />

          {isVerified && (
            <div className="absolute -bottom-1 -right-1 z-10">
              <VerifiedBadge size={18} />
            </div>
          )}

          {typeof isMicMuted === "boolean" && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#0b071b]",
                isMicMuted ? "bg-red-500" : "bg-emerald-500"
              )}
            >
              {isMicMuted ? (
                <MicOff className="h-2.5 w-2.5 text-white" />
              ) : (
                <Mic className="h-2.5 w-2.5 text-white" />
              )}
            </span>
          )}
          {isPartner && typeof isMicMuted !== "boolean" && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0b071b]">
              <UserCheck className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {roleBadge && (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  isPartner
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border border-violet-500/30 bg-violet-500/10 text-violet-300"
                )}
              >
                {roleBadge}
              </span>
            )}
            <p className="truncate text-sm sm:text-base font-bold text-white">{name}</p>
          </div>
          <p className="mt-0.5 truncate text-xs font-mono font-medium text-violet-300">
            @{cleanUsername}
          </p>
        </div>
      </div>

      {rightExtra && <div className="shrink-0">{rightExtra}</div>}
    </div>
  );
}
