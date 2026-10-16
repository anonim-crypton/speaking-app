import AnimatedWaveIcon from "@/components/AnimatedWaveIcon";
import { BRAND } from "@/i18n/translations";
import { cn } from "@/lib/utils";

export default function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const iconBox = size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const text = size === "sm" ? "text-base" : "text-lg";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid place-items-center bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500 shadow-glow-sm",
          iconBox
        )}
      >
        {/* same AudioLines mark — now with the bars speaking */}
        <AnimatedWaveIcon className={cn("text-white", icon)} strokeWidth={2.5} />
      </span>
      <span className={cn("font-extrabold tracking-tight text-foreground", text)}>
        {BRAND}
      </span>
    </span>
  );
}
