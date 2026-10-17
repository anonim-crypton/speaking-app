import {
  ChevronDown,
  Flag,
  Gem,
  Headset,
  HelpCircle,
  History,
  Laptop,
  LogOut,
  Settings,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import SpeakerAvatar from "@/components/SpeakerAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

import type { UserNavTab } from "@/components/UserSidebar";

interface AccountMenuProps {
  onSelectTab?: (tab: UserNavTab) => void;
  diamondsOverride?: number;
}

/** 
 * Navbar account qismi:
 * Spiker avatar + kiritilgan ism.
 * Bosilganda ochiladigan dropdown:
 * Olmoslar soni, XP Daraja, Profil, Do'stlar, Gaplashish tarixi, Yordam, Sozlamalar,
 * chiziq, Shikoyat bo'limi, Admin bilan bog'lanish, chiziq, Hisobdan chiqish.
 */
export default function AccountMenu({ onSelectTab, diamondsOverride }: AccountMenuProps = {}) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleTabClick = (tab: UserNavTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      navigate("/dashboard");
    }
  };

  const displayName =
    user?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    user?.phone ||
    "Foydalanuvchi";

  const localSavedDiamonds = (() => {
    try {
      const v = Number(localStorage.getItem(`ls_local_diamonds_${user?.id || "guest"}`) || 0);
      return isNaN(v) ? 0 : v;
    } catch {
      return 0;
    }
  })();
  const diamonds = Math.max(diamondsOverride ?? 0, user?.diamonds ?? 0, localSavedDiamonds);
  const xp = user?.xp ?? 0;
  const level = user?.level ?? Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const isPremium = Boolean(user?.isPremium);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border py-1 pl-1.5 pr-3 transition-all duration-200 cursor-pointer shadow-sm",
            isPremium
              ? "border-amber-400/60 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-300"
              : "border-border/80 bg-white/[0.06] hover:border-brand-400/70 hover:bg-brand-500/15"
          )}
          aria-label="Foydalanuvchi hisobi"
        >
          <div className={cn("relative shrink-0 rounded-full", isPremium && "p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]")}>
            <SpeakerAvatar size={30} src={user?.avatarUrl} name={displayName} />
          </div>
          <span className="max-w-[120px] truncate text-[13.5px] font-bold text-foreground">
            {displayName}
          </span>
          {isPremium && <VerifiedBadge size={16} />}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[275px] p-2.5 bg-[#0e0a24]/95 border-white/[0.12] backdrop-blur-xl shadow-2xl z-50">
        {/* ── Foydalanuvchi ismi va avatari ── */}
        <div
          onClick={() => handleTabClick("profile")}
          className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5 cursor-pointer hover:bg-white/[0.08] transition-colors"
        >
          <div className={cn("relative shrink-0 rounded-full", isPremium && "p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.5)]")}>
            <SpeakerAvatar size={36} src={user?.avatarUrl} name={displayName} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold text-white">{displayName}</p>
              {isPremium && <VerifiedBadge size={16} />}
            </div>
            {isPremium ? (
              <span className="inline-block rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-black text-amber-300 border border-amber-500/40 tracking-wider">
                PREMIUM VIP
              </span>
            ) : user?.username ? (
              <p className="truncate text-[11.5px] font-medium text-violet-300">@{user.username}</p>
            ) : user?.email || user?.phone ? (
              <p className="truncate text-[11.5px] text-zinc-400">{user?.email || user?.phone}</p>
            ) : null}
          </div>
        </div>

        {/* ── 1. Yig'gan olmoslar soni ── */}
        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-fuchsia-500/15 px-3 py-2">
          <Gem className="h-4 w-4 shrink-0 text-violet-300 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-300">
            {t.account.diamonds || "Olmoslar"}
          </span>
          <span className="ml-auto text-base font-extrabold tabular-nums text-violet-200">
            {diamonds}
          </span>
        </div>

        {/* ── 1.5. XP va Daraja (Level) ko'rsatkichi ── */}
        <div className="mt-1.5 flex flex-col gap-1.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/15 to-teal-500/10 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                {level}-Daraja (Level {level})
              </span>
            </div>
            <span className="text-xs font-extrabold tabular-nums text-white">
              {xp} XP
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
              style={{ width: `${Math.max(4, xpInLevel)}%` }}
            />
          </div>
        </div>

        <DropdownMenuSeparator className="my-2 bg-white/[0.08]" />

        {/* ── 2. Profil ── */}
        <DropdownMenuItem
          onClick={() => handleTabClick("profile")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white"
        >
          <User className="h-4 w-4 shrink-0 text-violet-400" />
          <span className="text-[13.5px] font-medium">{t.account.profile || "Profil"}</span>
        </DropdownMenuItem>

        {/* ── 3. Do'stlar ── */}
        <DropdownMenuItem
          onClick={() => handleTabClick("friends")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white"
        >
          <Users className="h-4 w-4 shrink-0 text-violet-400" />
          <span className="text-[13.5px] font-medium">{t.account.friends || "Do'stlar"}</span>
        </DropdownMenuItem>

        {/* ── 4. Gaplashish tarixi ── */}
        <DropdownMenuItem
          onClick={() => handleTabClick("history")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white"
        >
          <History className="h-4 w-4 shrink-0 text-violet-400" />
          <span className="text-[13.5px] font-medium">{t.account.history || "Mening tarixim"}</span>
        </DropdownMenuItem>

        {/* ── 5. Yordam ── */}
        <DropdownMenuItem
          onClick={() => handleTabClick("help")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white"
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-violet-400" />
          <span className="text-[13.5px] font-medium">{t.account.help || "Yordam"}</span>
        </DropdownMenuItem>

        {/* ── 6. Qurilmalarim ── */}
        <DropdownMenuItem
          onClick={() => handleTabClick("devices")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white"
        >
          <Laptop className="h-4 w-4 shrink-0 text-cyan-400" />
          <span className="text-[13.5px] font-medium">Qurilmalarim</span>
        </DropdownMenuItem>

        {/* ── Chiziq ── */}
        <DropdownMenuSeparator className="my-2 bg-white/[0.08]" />

        {/* ── 7. Shikoyat bo'limi ── */}
        <DropdownMenuItem
          onClick={() => handleTabClick("feedback")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white"
        >
          <Flag className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-[13.5px] font-medium">{t.account.complaints || "Shikoyat / Taklif"}</span>
        </DropdownMenuItem>

        {/* ── 8. Admin bilan bog'lanish ── */}
        <DropdownMenuItem
          onClick={() => handleTabClick("help")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white"
        >
          <Headset className="h-4 w-4 shrink-0 text-cyan-400" />
          <span className="text-[13.5px] font-medium">{t.account.contactAdmin || "Admin bilan bog'lanish"}</span>
        </DropdownMenuItem>

        {/* ── Chiziq ── */}
        <DropdownMenuSeparator className="my-2 bg-white/[0.08]" />

        {/* ── 9. Hisobdan chiqish ── */}
        <DropdownMenuItem
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="gap-3 py-2.5 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300 rounded-lg"
        >
          <LogOut className="h-4 w-4 shrink-0 text-red-400" />
          <span className="text-[13.5px] font-semibold">{t.account.logout || "Hisobdan chiqish"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
