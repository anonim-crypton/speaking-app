import {
  Globe,
  GraduationCap,
  BookOpen,
  AudioWaveform,
  Hash,
  Hand,
  Heart,
  Home,
  MessageSquare,
  Mic,
  Radio,
  TrendingUp,
  Users,
} from "lucide-react";

import AnimatedWaveIcon from "@/components/AnimatedWaveIcon";

import SmartImage from "@/components/SmartImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IMG, avatarImage } from "@/lib/assets";
import { BRAND } from "@/i18n/translations";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

/** Animated audio waveform (equaliser) bars. */
function Waveform({ bars = 26, className }: { bars?: number; className?: string }) {
  return (
    <div className={cn("flex items-end gap-[2px]", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom animate-wave rounded-full bg-gradient-to-t from-brand-500 to-fuchsia-400"
          style={{
            height: `${9 + ((i * 41) % 19)}px`,
            animationDelay: `${(i % 9) * 95}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** Tiny "speaking" indicator shown next to a participant. */
function MicBars({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-end gap-[1.5px]", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-[2px] origin-bottom animate-wave rounded-full bg-emerald-400"
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );
}

export default function AppMockup() {
  const { t } = useLanguage();
  const m = t.mockup;

  const navItems = [
    { icon: AudioWaveform, label: m.nav.home },
    { icon: Radio, label: m.nav.liveRooms, active: true },
    { icon: MessageSquare, label: m.nav.messages, badge: 3 },
    { icon: Users, label: m.nav.community },
    { icon: BookOpen, label: m.nav.courses },
    { icon: TrendingUp, label: m.nav.progress },
  ];

  const reactions = m.reactions;
  const reactionPos = [
    "right-0 top-[9%]",
    "right-[-1.75rem] top-[33%]",
    "right-[0.5rem] top-[52%]",
  ];

  return (
    <div className="relative mx-auto w-full max-w-[620px] xl:max-w-none">
      {/* ambient glow behind the window */}
      <div
        className="absolute -inset-6 -z-10 animate-pulse-glow rounded-[3rem] bg-brand-600/25 blur-3xl"
        aria-hidden
      />

      <div className="neon-panel overflow-hidden rounded-[22px]">
        <div className="flex h-[400px] sm:h-[440px] lg:h-[470px]">
          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="hidden w-[176px] shrink-0 flex-col border-r border-border/60 bg-night-950/50 p-3.5 sm:flex">
            <div className="flex items-center gap-2 px-1 pb-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <AnimatedWaveIcon className="h-3.5 w-3.5 text-white" strokeWidth={2.6} />
              </span>
              <span className="text-[13px] font-bold">{BRAND}</span>
            </div>

            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium",
                    item.active
                      ? "bg-brand-500/20 text-brand-100"
                      : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              ))}
            </nav>

            <div className="mt-4 min-h-0 flex-1">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {m.voiceChannels}
                </span>
                <span className="text-[9px] text-muted-foreground">▾</span>
              </div>
              <div className="space-y-0.5">
                {m.channels.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    <Hash className="h-3 w-3 shrink-0 opacity-70" />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-[9.5px] tabular-nums opacity-70">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Live video ──────────────────────────────────── */}
          <div className="min-w-0 flex-1 p-2.5">
            <div className="relative h-full overflow-hidden rounded-2xl border border-border/60">
              <SmartImage
                src={IMG.speaker}
                alt="Learner speaking in a live room"
                loading="eager"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/15 to-night-950/30" />

              <span className="absolute right-3.5 top-3.5 rotate-[-3deg] font-script text-3xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-4xl">
                {m.letsSpeak}
              </span>

              <span className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-night-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {t.rooms.live}
              </span>

              <div className="absolute bottom-3.5 left-3.5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-glow">
                  <Mic className="h-5 w-5 text-white" />
                </span>
                <Waveform className="hidden sm:flex" />
              </div>

              <div className="absolute bottom-4 right-3.5 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[10.5px] font-semibold text-emerald-100">{m.speaking}</span>
              </div>
            </div>
          </div>

          {/* ── Participants ────────────────────────────────── */}
          <aside className="hidden w-[110px] shrink-0 flex-col gap-2 border-l border-border/60 bg-night-950/50 p-2.5 md:flex">
            {m.participants.map((p, i) => (
              <div
                key={p.name}
                className="relative overflow-hidden rounded-xl border border-border/60"
              >
                <Avatar className="h-[62px] w-full rounded-none">
                  <AvatarImage src={avatarImage(i)} alt={p.name} />
                  <AvatarFallback className="rounded-none text-[10px]">
                    {p.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-night-950/80 px-1.5 py-1 backdrop-blur">
                  <Mic className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                  <span className="truncate text-[9px] font-semibold text-white">{p.name}</span>
                  <MicBars className="ml-auto" />
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>

      {/* ── Floating reactions (desktop) ──────────────────── */}
      {reactions.map((text, i) => (
        <div
          key={text}
          className={cn(
            "absolute hidden animate-float items-center rounded-2xl rounded-br-sm border border-border/70 bg-card/90 px-3 py-2 text-[11px] font-semibold shadow-glow-sm backdrop-blur-xl xl:flex",
            reactionPos[i]
          )}
          style={{ animationDelay: `${i * 900}ms` }}
        >
          <span className="whitespace-nowrap">{text}</span>
        </div>
      ))}

      <span
        className="absolute right-[-0.5rem] top-[24%] hidden animate-float-slow text-2xl xl:block"
        aria-hidden
      >
        <Heart className="h-6 w-6 fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
      </span>
      <span
        className="absolute right-[-1.5rem] top-[46%] hidden animate-float text-2xl xl:block"
        style={{ animationDelay: "600ms" }}
        aria-hidden
      >
        <Hand className="h-6 w-6 rotate-12 fill-amber-300 text-amber-300" />
      </span>

      {/* ── Friends card ──────────────────────────────────── */}
      <div className="absolute -right-2 bottom-5 hidden w-[172px] animate-float-slow rounded-2xl border border-border/70 bg-card/90 p-3 shadow-glow-sm backdrop-blur-xl xl:block">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-500/20">
            <Globe className="h-3.5 w-3.5 text-brand-300" />
          </span>
          <span className="text-[11px] font-semibold leading-tight">{m.friendsTitle}</span>
        </div>
        <div className="mt-2.5 flex items-center">
          {IMG.avatars.slice(0, 4).map((src, i) => (
            <Avatar
              key={i}
              className={cn("h-7 w-7 border-2 border-card", i > 0 && "-ml-2.5")}
            >
              <AvatarImage src={src} alt="" />
              <AvatarFallback className="text-[9px]">{i + 1}</AvatarFallback>
            </Avatar>
          ))}
          <span className="ml-2 rounded-full bg-brand-500/25 px-2 py-0.5 text-[10px] font-bold text-brand-200">
            +99
          </span>
        </div>
      </div>
    </div>
  );
}
