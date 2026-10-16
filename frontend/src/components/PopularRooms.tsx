import { ArrowRight, Flame, Users } from "lucide-react";

import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { avatarImage, roomImage } from "@/lib/assets";
import { cn } from "@/lib/utils";

export default function PopularRooms() {
  const { t } = useLanguage();

  return (
    <section id="community" className="py-12 lg:py-14">
      <div className="container">
        {/* ── Section header ── */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight sm:text-2xl">
                <Flame className="h-6 w-6 fill-orange-500 text-orange-500" />
                {t.rooms.title}
              </h2>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground">{t.rooms.subtitle}</p>
            </div>

            <button
              type="button"
              className="group hidden items-center gap-1.5 text-[13.5px] font-semibold text-brand-300 transition-colors hover:text-brand-200 sm:inline-flex"
            >
              {t.rooms.viewAll}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </Reveal>

        {/* ── Room cards ── */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.rooms.items.map((room, i) => (
            <Reveal key={room.title} delay={i * 90}>
              <Card className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-glow-sm">
                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden">
                  <SmartImage
                    src={roomImage(i)}
                    alt={room.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night-950/80 via-night-950/10 to-transparent" />

                  <Badge
                    variant="live"
                    className="absolute left-3 top-3 bg-red-500/20 backdrop-blur-md"
                  >
                    <Flame className="h-3 w-3" />
                    {t.rooms.live}
                  </Badge>

                  <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-night-950/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    <Users className="h-3 w-3" />
                    {room.count}
                  </span>
                </div>

                {/* Body */}
                <CardContent className="p-4">
                  <h3 className="text-[14.5px] font-bold leading-snug">{room.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                    {room.desc}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Badge variant="soft" className="shrink-0 px-2 py-0 text-[10px]">
                        {room.tag}
                      </Badge>
                      <Badge variant="muted" className="truncate px-2 py-0 text-[10px]">
                        {room.level}
                      </Badge>
                    </div>

                    <div className="flex shrink-0 items-center">
                      {[0, 1, 2].map((a) => {
                        const idx = (i + a) % 4;
                        return (
                          <Avatar
                            key={a}
                            className={cn("h-6 w-6 border-2 border-card", a > 0 && "-ml-2")}
                          >
                            <AvatarImage src={avatarImage(idx)} alt="" />
                            <AvatarFallback className="text-[8px]">
                              {String.fromCharCode(65 + idx)}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      <span className="ml-1.5 text-[10px] font-bold text-muted-foreground">
                        +{Math.max(4, Math.round(room.count / 5))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
