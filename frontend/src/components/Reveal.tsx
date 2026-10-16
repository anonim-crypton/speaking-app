import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/hooks/useReveal";

type Direction = "up" | "down" | "left" | "right" | "zoom";

const DIRECTION_CLASS: Record<Direction, string> = {
  up: "reveal-up",
  down: "reveal-down",
  left: "reveal-left",
  right: "reveal-right",
  zoom: "reveal-zoom",
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Animation delay in milliseconds. */
  delay?: number;
  direction?: Direction;
  as?: ElementType;
}

/**
 * Reveals its children with a smooth animation when they scroll into view,
 * and fades them back out when they leave the viewport.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  as: Tag = "div",
}: RevealProps) {
  const [ref, visible] = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={cn("reveal", DIRECTION_CLASS[direction], visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
