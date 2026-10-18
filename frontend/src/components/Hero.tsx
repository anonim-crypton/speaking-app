import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Globe, Users } from "lucide-react";

import AppMockup from "@/components/AppMockup";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { BRAND } from "@/i18n/translations";

const PERK_ICONS = {
  check: CheckCircle2,
  users: Users,
  globe: Globe,
} as const;

const PERK_COLORS: Record<string, string> = {
  check: "text-emerald-400",
  users: "text-sky-400",
  globe: "text-cyan-400",
};

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section id="home" className="relative overflow-x-clip pb-14 pt-10 lg:pb-20 lg:pt-14 scroll-mt-24">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-14">
          {/* ── Copy ── */}
          <div className="max-w-[640px]">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                {t.hero.badge}
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                {t.hero.welcome} <span className="text-gradient">{BRAND}</span>
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-3 text-2xl font-bold leading-snug text-foreground/95 sm:text-[1.75rem] lg:text-[2rem]">
                {t.hero.heading}
              </p>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-muted-foreground">
                {t.hero.description}
              </p>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button variant="glow" size="xl" asChild>
                  <Link to="/register">
                    {t.hero.ctaPrimary}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <ul className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
                {t.hero.perks.map((perk) => {
                  const Icon = PERK_ICONS[perk.icon] ?? CheckCircle2;
                  return (
                    <li
                      key={perk.label}
                      className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground/90"
                    >
                      <Icon className={`h-4 w-4 ${PERK_COLORS[perk.icon] ?? ""}`} />
                      {perk.label}
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>

          {/* ── Product mockup ── */}
          <Reveal direction="left" delay={140} className="lg:pl-4">
            <AppMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
