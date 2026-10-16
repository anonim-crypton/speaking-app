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
  const isSm = size === "sm";
  const boxDim = isSm ? "h-7 w-7 min-w-7 min-h-7 rounded-lg" : "h-9 w-9 min-w-9 min-h-9 rounded-xl";
  const iconSize = isSm ? 16 : 20;
  const textSize = isSm ? "text-base" : "text-lg";

  return (
    <span className={cn("inline-flex items-center gap-2.5 shrink-0 select-none", className)}>
      <span
        className={cn(
          "grid place-items-center bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500 shadow-glow-sm shrink-0",
          boxDim
        )}
        style={{ width: isSm ? 28 : 36, height: isSm ? 28 : 36 }}
      >
        {/* same AudioLines mark — now with the bars speaking */}
        <AnimatedWaveIcon
          width={iconSize}
          height={iconSize}
          className="text-white shrink-0"
          strokeWidth={2.5}
        />
      </span>
      <span
        className={cn(
          "font-extrabold tracking-tight text-foreground whitespace-nowrap leading-none shrink-0",
          textSize
        )}
      >
        {BRAND}
      </span>
    </span>
  );
}
