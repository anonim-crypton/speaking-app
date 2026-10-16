import { cn } from "@/lib/utils";

/**
 * Default profile picture: a speaker wearing headphones with a microphone —
 * matching the Lingo Speek brand mark.
 */
export default function SpeakerAvatar({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full",
        "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500",
        className
      )}
      style={{ width: size, height: size }}
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
}
