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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import SpeakerAvatar from "@/components/SpeakerAvatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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

/** 
 * Navbar account qismi:
 * Spiker avatar + kiritilgan ism.
 * Bosilganda ochiladigan dropdown:
 * Olmoslar soni, Profil, Do'stlar, Gaplashish tarixi, Yordam, Sozlamalar,
 * chiziq, Shikoyat bo'limi, Admin bilan bog'lanish, chiziq, Hisobdan chiqish.
 */
export default function AccountMenu() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    user?.phone ||
    "Foydalanuvchi";

  const diamonds = user?.diamonds ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/[0.06] py-1 pl-1.5 pr-3",
            "transition-all duration-200 hover:border-brand-400/70 hover:bg-brand-500/15 shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          )}
          aria-label="Foydalanuvchi hisobi"
        >
          <SpeakerAvatar size={32} />
          <span className="max-w-[120px] truncate text-[13.5px] font-bold text-foreground">
            {displayName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[260px] p-2 bg-night-950/95 border-border/80 backdrop-blur-xl shadow-glow-sm">
        {/* ── Foydalanuvchi ismi va avatari ── */}
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5">
          <SpeakerAvatar size={38} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
            {user?.username ? (
              <p className="truncate text-[11.5px] font-medium text-brand-300">@{user.username}</p>
            ) : user?.email || user?.phone ? (
              <p className="truncate text-[11.5px] text-muted-foreground">{user?.email || user?.phone}</p>
            ) : null}
          </div>
        </div>

        {/* ── 1. Yig'gan olmoslar soni ── */}
        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-brand-500/30 bg-gradient-to-r from-violet-600/20 to-fuchsia-500/15 px-3 py-2.5">
          <Gem className="h-4 w-4 shrink-0 text-brand-300 animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground">
            {t.account.diamonds || "Olmoslar"}
          </span>
          <span className="ml-auto text-base font-extrabold tabular-nums text-brand-200">
            {diamonds}
          </span>
        </div>

        <DropdownMenuSeparator className="my-2 bg-border/60" />

        {/* ── 2. Profil ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <User className="h-4 w-4 shrink-0 text-brand-300" />
          <span className="text-[13.5px] font-medium">{t.account.profile || "Profil"}</span>
        </DropdownMenuItem>

        {/* ── 3. Do'stlar ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <Users className="h-4 w-4 shrink-0 text-brand-300" />
          <span className="text-[13.5px] font-medium">{t.account.friends || "Do'stlar"}</span>
        </DropdownMenuItem>

        {/* ── 4. Gaplashish tarixi ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <History className="h-4 w-4 shrink-0 text-brand-300" />
          <span className="text-[13.5px] font-medium">{t.account.history || "Gaplashish tarixi"}</span>
        </DropdownMenuItem>

        {/* ── 5. Yordam ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-brand-300" />
          <span className="text-[13.5px] font-medium">{t.account.help || "Yordam"}</span>
        </DropdownMenuItem>

        {/* ── 6. Sozlamalar ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <Settings className="h-4 w-4 shrink-0 text-brand-300" />
          <span className="text-[13.5px] font-medium">{t.account.settings || "Sozlamalar"}</span>
        </DropdownMenuItem>

        {/* ── 6.1. Qurilmalarim ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard?tab=devices")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <Laptop className="h-4 w-4 shrink-0 text-cyan-400" />
          <span className="text-[13.5px] font-medium">Qurilmalarim</span>
        </DropdownMenuItem>

        {/* ── Tilni almashtirish ── */}
        <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] my-1.5">
          <span className="text-xs font-semibold text-zinc-300">Til:</span>
          <LanguageSwitcher />
        </div>

        {/* ── Chiziq ── */}
        <DropdownMenuSeparator className="my-2 bg-border/60" />

        {/* ── 7. Shikoyat bo'limi ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <Flag className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-[13.5px] font-medium">{t.account.complaints || "Shikoyat bo'limi"}</span>
        </DropdownMenuItem>

        {/* ── 8. Admin bilan bog'lanish ── */}
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-3 py-2.5 cursor-pointer rounded-lg hover:bg-white/5"
        >
          <Headset className="h-4 w-4 shrink-0 text-cyan-400" />
          <span className="text-[13.5px] font-medium">{t.account.contactAdmin || "Admin bilan bog'lanish"}</span>
        </DropdownMenuItem>

        {/* ── Chiziq ── */}
        <DropdownMenuSeparator className="my-2 bg-border/60" />

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
