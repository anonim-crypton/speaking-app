import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Sparkles, Info, LogIn, UserPlus } from "lucide-react";

import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AuthToggle from "@/components/AuthToggle";
import AccountMenu from "@/components/AccountMenu";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/**
 * Order MUST match the vertical order of the sections on the home page,
 * otherwise the scroll-spy highlight jumps between buttons.
 */
const NAV_ITEMS = [
  { id: "home", key: "home" },
  { id: "practice", key: "practice" },
  { id: "about", key: "about" },
] as const;

export default function Navbar() {
  const { t } = useLanguage();
  const { isAuthed } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Scroll-spy: last section whose top edge passed the probe line. */
  useEffect(() => {
    if (location.pathname !== "/") {
      setActive("");
      return;
    }

    const onScroll = () => {
      const probe = window.innerHeight * 0.32;
      let current = NAV_ITEMS[0].id as string;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= probe) current = item.id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  function goToSection(id: string) {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isAuthed) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-colors duration-200",
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="shrink-0 flex items-center" aria-label="Lingo Speek home">
              <Logo />
            </Link>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-colors duration-200",
          scrolled
            ? "border-b border-border/60 bg-background/75 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="container">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="shrink-0 flex items-center" aria-label="Lingo Speek home">
              <Logo />
            </Link>

            {/* ── Desktop pill navigation ── */}
            <nav className="ml-2 hidden items-center gap-0.5 rounded-full border border-border/70 bg-white/[0.04] p-1 backdrop-blur-xl lg:flex">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
                    active === item.id
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.nav[item.key]}
                </button>
              ))}
            </nav>

            {/* ── Right actions: Language Switcher and Desktop Auth ── */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <AuthToggle className="hidden lg:grid" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Landing Bottom Navigation Bar (lg:hidden) ── */}
      <nav
        aria-label="Mobil pastki navigatsiya"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/[0.1] bg-[#090518]/95 px-2 backdrop-blur-2xl backdrop-saturate-[180%] lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
      >
        {/* 1. Bosh sahifa */}
        <button
          type="button"
          onClick={() => goToSection("home")}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer",
            active === "home" ? "text-violet-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-xl transition-all",
              active === "home" ? "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.4)]" : ""
            )}
          >
            <Home className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight truncate max-w-[64px]">
            {t.nav.home}
          </span>
        </button>

        {/* 2. Amaliyot */}
        <button
          type="button"
          onClick={() => goToSection("practice")}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer",
            active === "practice" ? "text-violet-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-xl transition-all",
              active === "practice" ? "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.4)]" : ""
            )}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight truncate max-w-[64px]">
            {t.nav.practice}
          </span>
        </button>

        {/* 3. Biz haqimizda */}
        <button
          type="button"
          onClick={() => goToSection("about")}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer",
            active === "about" ? "text-violet-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-xl transition-all",
              active === "about" ? "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.4)]" : ""
            )}
          >
            <Info className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight truncate max-w-[64px]">
            {t.nav.about}
          </span>
        </button>

        {/* 4. Login */}
        <Link
          to="/login"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl">
            <LogIn className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight truncate max-w-[64px]">
            {t.nav.login}
          </span>
        </Link>

        {/* 5. Register */}
        <Link
          to="/register"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-violet-300 hover:text-white transition-all cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]">
            <UserPlus className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-bold tracking-tight truncate max-w-[64px]">
            {t.nav.register}
          </span>
        </Link>
      </nav>
    </>
  );
}
