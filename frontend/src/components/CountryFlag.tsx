import { useState } from "react";

import { flagUrl } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * A country flag image with a graceful fallback: if flagcdn is unreachable the
 * two-letter code is shown on a gradient chip instead of a broken image.
 */
export default function CountryFlag({
  code,
  width = 40,
  className,
  fallbackClassName,
}: {
  code: string;
  width?: 20 | 40 | 80 | 160;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const upper = code.toUpperCase();

  const frame = cn(
    "inline-flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[3px] ring-1 ring-inset ring-white/20",
    className
  );

  if (failed) {
    return (
      <span className={cn(frame, "bg-brand-500/30", fallbackClassName)} aria-hidden>
        <span className="text-[7px] font-bold leading-none text-white/90">{upper}</span>
      </span>
    );
  }

  return (
    <span className={frame} aria-hidden>
      <img
        src={flagUrl(upper, width)}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}
