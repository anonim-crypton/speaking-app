import { Clock, Mic, Star, Users, type LucideIcon } from "lucide-react";

import Reveal from "@/components/Reveal";
import { useLanguage } from "@/context/LanguageContext";

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  mic: Mic,
  clock: Clock,
  star: Star,
};

/** Icon accent colours, one per stat column. */
const ICON_COLORS = [
  "text-brand-300",
  "text-brand-300",
  "text-brand-300",
  "text-amber-400",
];

export default function StatsBar() {
  const { t } = useLanguage();

  return (
    <section id="stats" className="py-6 lg:py-8">
      <div className="container">
        <Reveal direction="zoom">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-border/40 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.9)]">
            <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
              {t.stats.items.map((item, i) => {
                const Icon = ICONS[item.icon] ?? Users;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 bg-card/80 p-6 backdrop-blur-xl"
                  >
                    <Icon
                      className={`h-8 w-8 shrink-0 ${ICON_COLORS[i % ICON_COLORS.length]}`}
                      strokeWidth={2}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-2xl font-extrabold leading-none tracking-tight">
                          {item.value}
                        </span>
                        <span className="text-[13.5px] font-bold text-foreground/90">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
