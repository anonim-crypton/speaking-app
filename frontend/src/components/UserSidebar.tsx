import {
  Home,
  History,
  CheckSquare,
  Gamepad2,
  BookOpen,
  Users,
  Trophy,
  Award,
  Laptop,
  HelpCircle,
  MessageSquare,
  Crown,
  ArrowUpRight,
  AudioWaveform,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { DASHBOARD_TRANSLATIONS } from "@/i18n/dashboardTranslations";

export type UserNavTab =
  | "home"
  | "history"
  | "daily_tasks"
  | "task_game"
  | "books"
  | "friends"
  | "rating"
  | "achievements"
  | "devices"
  | "help"
  | "feedback"
  | "profile";

interface UserSidebarProps {
  activeTab: UserNavTab;
  onSelectTab: (tab: UserNavTab) => void;
  className?: string;
  isCollapsed?: boolean;
  onOpenPremium?: () => void;
}

export default function UserSidebar({
  activeTab,
  onSelectTab,
  className,
  isCollapsed = false,
  onOpenPremium,
}: UserSidebarProps) {
  const { lang } = useLanguage();
  const t = DASHBOARD_TRANSLATIONS[lang] ?? DASHBOARD_TRANSLATIONS.uz;

  const navItems: Array<{
    id: UserNavTab;
    label: string;
    icon: any;
    isPremiumBadge?: boolean;
  }> = [
    { id: "home", label: t.sidebar.home, icon: Home },
    { id: "history", label: t.sidebar.history, icon: History },
    { id: "daily_tasks", label: "Kunlik topshiriqlar", icon: CheckSquare },
    { id: "task_game", label: "Topshiriqli o'yin", icon: Gamepad2 },
    { id: "books", label: "Foydali kitoblar", icon: BookOpen, isPremiumBadge: true },
    { id: "friends", label: t.sidebar.friends, icon: Users },
    { id: "rating", label: t.sidebar.rating, icon: Trophy },
    { id: "achievements", label: t.sidebar.achievements, icon: Award },
    { id: "help", label: t.sidebar.help, icon: HelpCircle },
    { id: "feedback", label: t.sidebar.feedback, icon: MessageSquare },
  ];

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/[0.08] bg-[#080514]/85 backdrop-blur-2xl text-foreground transition-all duration-200 select-none z-20",
        isCollapsed ? "w-16 p-2.5" : "w-60 lg:w-64 p-4",
        className
      )}
    >
      {/* ── 1. Brand Header (shadcn/ui style) ── */}
      <div
        className={cn(
          "flex items-center gap-3 px-2 py-1.5 mb-4",
          isCollapsed && "justify-center px-0"
        )}
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]">
          <AudioWaveform className="h-4.5 w-4.5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-bold tracking-tight text-white leading-none">
              Speaking
            </span>
            <span className="mt-1 text-[11px] text-zinc-400 font-medium tracking-wide">
              Speak • Learn • Grow
            </span>
          </div>
        )}
      </div>

      {/* ── 2. Navigation Group ── */}
      {!isCollapsed && (
        <div className="px-2.5 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Platforma
          </span>
        </div>
      )}

      <nav className="flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "group relative flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer",
                isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                isActive
                  ? "bg-gradient-to-r from-violet-600/25 via-indigo-600/15 to-transparent text-white font-semibold border border-violet-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  : "text-zinc-400 border border-transparent hover:bg-white/[0.04] hover:text-zinc-100"
              )}
              title={item.label}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
                />
              )}
              <div
                className={cn(
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-zinc-400 group-hover:text-zinc-200"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {isCollapsed && item.isPremiumBadge && (
                  <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 drop-shadow" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.isPremiumBadge && (
                    <span className="ml-1.5 inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <Crown className="h-2.5 w-2.5 text-amber-300" />
                      <span>PRO</span>
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* ── 3. Bottom Premium Card (shadcn/ui card style) ── */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={onOpenPremium}
          className="mt-4 w-full text-left group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200 hover:border-amber-500/35 hover:bg-white/[0.06]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-500/10 blur-xl transition-opacity group-hover:opacity-100 opacity-60"
          />
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/15 text-amber-300 shadow-inner">
                <Crown className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-white leading-none">
                    Premium
                  </p>
                  <span className="rounded-md bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                    PRO
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] text-zinc-400">
                  {t.sidebar.premiumDesc}
                </p>
              </div>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 group-hover:border-amber-400/30 group-hover:text-amber-300 transition-colors">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>
      )}
    </aside>
  );
}
