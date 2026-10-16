import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface AuthToggleProps {
  className?: string;
  /** Full-width, roomier variant (mobile sheet). */
  block?: boolean;
  /** Runs just before navigating — e.g. to close the mobile sheet. */
  onNavigate?: () => void;
  /** How long the activity indicator holds before navigating (ms). */
  delay?: number;
}

/**
 * A single segmented pill holding both auth actions.
 *
 * Both labels live inside ONE shared background, and exactly ONE activity
 * indicator slides underneath whichever segment is pressed — then navigates.
 * The pill also parks itself on Login/Register to match the current route.
 */
export default function AuthToggle({
  className,
  block = false,
  onNavigate,
  delay = 1000,
}: AuthToggleProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [pending, setPending] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const segments = [
    { to: "/login", label: t.nav.login },
    { to: "/register", label: t.nav.register },
  ];

  /* Route decides where the pill rests; a pressed segment wins until we land. */
  const routeIndex = location.pathname === segments[1].to ? 1 : 0;
  const activeIndex = pending ?? routeIndex;

  function handleSelect(index: number) {
    if (pending !== null) return;

    setPending(index);
    timer.current = window.setTimeout(() => {
      const target = segments[index].to;
      onNavigate?.();
      // Replace instead of push when we are already on the target route.
      navigate(target, { replace: location.pathname === target });
      setPending(null);
    }, delay);
  }

  return (
    <div
      className={cn(
        "relative grid grid-cols-2 items-center rounded-full border border-border/70 bg-white/[0.04] p-1 backdrop-blur-xl",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        block && "w-full",
        className
      )}
    >
      {/* ── the one activity indicator ── */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full",
          "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500",
          "transition-all duration-500 ease-out",
          pending === null ? "shadow-glow-sm" : "shadow-glow"
        )}
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {segments.map((segment, index) => (
        <button
          key={segment.to}
          type="button"
          onClick={() => handleSelect(index)}
          aria-current={activeIndex === index ? "page" : undefined}
          className={cn(
            "relative z-10 whitespace-nowrap rounded-full font-semibold transition-colors duration-300",
            block ? "px-5 py-2.5 text-sm" : "px-4 py-1.5 text-[13px]",
            activeIndex === index ? "text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
