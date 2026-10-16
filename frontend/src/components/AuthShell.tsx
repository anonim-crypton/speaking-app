import type { ReactNode } from "react";

import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  error?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Auth page layout: centred card without footer or header back-links.
 */
export default function AuthShell({
  title,
  subtitle,
  error,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10">
      <Reveal direction="zoom" className="w-full max-w-[440px]">
        <Card className="p-7 sm:p-9 border border-border/80 bg-night-950/70 shadow-glow-sm backdrop-blur-xl">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">{subtitle}</p>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-300">
              {error}
            </div>
          ) : null}

          <div className="mt-6">{children}</div>

          {footer ? (
            <div className="mt-6 text-center text-[13px] text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </Card>
      </Reveal>
    </div>
  );
}
