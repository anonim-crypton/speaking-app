import { ArrowRight, BarChart3, Bot, Globe2, Mic, Users, type LucideIcon } from "lucide-react";

import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  mic: Mic,
  bot: Bot,
  globe: Globe2,
  chart: BarChart3,
  users: Users,
};

/** Icon tile gradients, mirroring the purple / blue / green / amber cards. */
const TILE_STYLES = [
  "from-violet-500 to-purple-600 shadow-violet-600/40",
  "from-sky-500 to-blue-600 shadow-sky-600/40",
  "from-emerald-500 to-green-600 shadow-emerald-600/40",
  "from-amber-500 to-orange-600 shadow-amber-600/40",
];

export default function FeatureGrid() {
  const { t } = useLanguage();

  return (
    <section id="practice" className="py-14 lg:py-16">
      <div className="container">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Mic;
            return (
              <Reveal key={item.title} delay={i * 90}>
                <Card className="group flex h-full items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:bg-card/85 hover:shadow-glow-sm">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br shadow-lg",
                      TILE_STYLES[i % TILE_STYLES.length]
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.2} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold leading-snug">{item.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>

                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-300" />
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
