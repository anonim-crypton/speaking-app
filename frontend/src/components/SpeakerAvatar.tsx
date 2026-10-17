import { memo, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

export function resolveAvatarUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return API_BASE ? `${API_BASE}${trimmed}` : trimmed;
  }
  return trimmed;
}

/**
 * Renders the user's uploaded profile photo (from onboarding / question step).
 * Default cartoon SVG avatar has been removed so the uploaded image is always displayed.
 */
function SpeakerAvatarComponent({
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

  const imageSrc = useMemo(() => {
    if (src || avatarUrl) return resolveAvatarUrl(src || avatarUrl);
    try {
      const fallback = localStorage.getItem("ls_user_avatar");
      return resolveAvatarUrl(fallback);
    } catch {
      return null;
    }
  }, [src, avatarUrl]);

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

  const initial = (name || "").trim().replace(/^@+/, "").charAt(0).toUpperCase();

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
          "grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-[#160f30] text-white font-bold select-none",
          !isPremium && className
        )}
        style={{
          width: resolvedSize,
          height: resolvedSize,
          fontSize: Math.max(12, Math.round(resolvedSize * 0.4)),
        }}
      >
        {initial || ""}
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

const SpeakerAvatar = memo(SpeakerAvatarComponent);
export default SpeakerAvatar;

