import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Default profile picture: a speaker wearing headphones with a microphone —
 * matching the Lingo Speek brand mark.
 * If `src` is passed, renders the uploaded image with fallback to the SVG icon.
 */
export default function SpeakerAvatar({
  className,
  size = 36,
  src,
  avatarUrl,
  isPremium,
  name,
}: {
  className?: string;
  size?: number | "sm" | "md" | "lg";
  src?: string | null;
  avatarUrl?: string | null;
  isPremium?: boolean;
  name?: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const resolvedSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 40
      : size === "md"
      ? 48
      : size === "lg"
      ? 64
      : 36;

  const imageSrc = src || avatarUrl || null;

  const innerAvatar =
    imageSrc && !imgFailed ? (
      <span
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#120b2d]",
          !isPremium && className
        )}
        style={{ width: resolvedSize, height: resolvedSize }}
      >
        <img
          src={imageSrc}
          alt={name || "Avatar"}
          className="h-full w-full object-cover rounded-full"
          onError={() => setImgFailed(true)}
        />
      </span>
    ) : (
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-full",
          "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500",
          !isPremium && className
        )}
        style={{ width: resolvedSize, height: resolvedSize }}
      >
        <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
          {/* shoulders */}
          <path d="M8.5 46c0-7.6 6.9-12.8 15.5-12.8S39.5 38.4 39.5 46z" fill="#ffffff" opacity="0.95" />
          {/* head */}
          <circle cx="24" cy="19.5" r="8.6" fill="#ffffff" opacity="0.95" />
          {/* headphone band */}
          <path
            d="M13.2 20.5a10.8 10.8 0 0 1 21.6 0"
            fill="none"
            stroke="#3b0764"
            strokeWidth="2.7"
            strokeLinecap="round"
          />
          {/* ear cups */}
          <rect x="10.2" y="18.6" width="4.6" height="7.6" rx="2.3" fill="#3b0764" />
          <rect x="33.2" y="18.6" width="4.6" height="7.6" rx="2.3" fill="#3b0764" />
          {/* microphone boom */}
          <path
            d="M12.5 26.2c0 4.4 3.4 6.6 7.4 6.6"
            fill="none"
            stroke="#3b0764"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="20.6" cy="32.8" r="2.3" fill="#3b0764" />
        </svg>
      </span>
    );

  if (isPremium) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_16px_rgba(245,158,11,0.55)]",
          className
        )}
      >
        {innerAvatar}
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-yellow-200 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-1.5 py-[0.5px] text-[8px] font-black uppercase tracking-wider text-slate-950 shadow">
          VIP
        </span>
      </span>
    );
  }

  return innerAvatar;
}
