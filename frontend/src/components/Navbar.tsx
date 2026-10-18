import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Mic, Users, LogIn, UserPlus, HelpCircle } from "lucide-react";

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
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
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
                    "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors cursor-pointer",
                    active === item.id && location.pathname === "/"
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.nav[item.key]}
                </button>
              ))}

              <Link
                to="/help"
                className={cn(
                  "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors cursor-pointer",
                  location.pathname === "/help"
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.account?.help || "Yordam"}
              </Link>
            </nav>

            {/* ── Right actions: Language Switcher and Desktop Auth ── */}
            <div className="flex items-center gap-2">
              {/* Mobile Help Button in front of LanguageSwitcher */}
              <Link
                to="/help"
                className={cn(
                  "flex lg:hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-xs font-bold text-zinc-200 transition-all cursor-pointer backdrop-blur-xl shadow-sm active:scale-95",
                  location.pathname === "/help"
                    ? "border-violet-500/50 bg-violet-500/25 text-white shadow-[0_0_12px_rgba(139,92,246,0.35)]"
                    : "text-zinc-300"
                )}
                aria-label="Yordam markazi"
              >
                <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
                <span>{t.account?.help || "Yordam"}</span>
              </Link>

              <LanguageSwitcher />
              <AuthToggle className="hidden lg:grid" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Landing Floating Bottom Navigation Bar (lg:hidden) ── */}
      <nav
        aria-label="Mobil pastki navigatsiya"
        className="fixed bottom-4 left-0 right-0 z-40 flex items-center justify-center gap-2.5 px-3 pointer-events-none lg:hidden"
      >
        {/* Connected capsule with border: Bosh sahifa, Amaliyot, Biz haqimizda */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-[#0e0924]/90 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-[180%]">
          {/* 1. Bosh sahifa */}
          <button
            type="button"
            onClick={() => goToSection("home")}
            title={t.nav.home}
            aria-label={t.nav.home}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-all cursor-pointer",
              active === "home" && location.pathname === "/"
                ? "bg-white/15 text-white shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Home className="h-5 w-5" />
          </button>

          {/* 2. Amaliyot */}
          <button
            type="button"
            onClick={() => goToSection("practice")}
            title={t.nav.practice}
            aria-label={t.nav.practice}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-all cursor-pointer",
              active === "practice" && location.pathname === "/"
                ? "bg-white/15 text-white shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Mic className="h-5 w-5" />
          </button>

          {/* 3. Biz haqimizda */}
          <button
            type="button"
            onClick={() => goToSection("about")}
            title={t.nav.about}
            aria-label={t.nav.about}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-all cursor-pointer",
              active === "about" && location.pathname === "/"
                ? "bg-white/15 text-white shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Users className="h-5 w-5" />
          </button>
        </div>

        {/* Oxirgi qism: Login va Register alohida dumaloq tugmalar */}
        <Link
          to="/login"
          title={t.nav.login}
          aria-label={t.nav.login}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#0e0924]/90 text-zinc-300 shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-[180%] transition-all hover:scale-105 hover:border-violet-500/50 hover:bg-violet-500/20 hover:text-white active:scale-95 cursor-pointer"
        >
          <LogIn className="h-5 w-5" />
        </Link>

        <Link
          to="/register"
          title={t.nav.register}
          aria-label={t.nav.register}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/50 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] backdrop-blur-xl transition-all hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
        >
          <UserPlus className="h-5 w-5" />
        </Link>
      </nav>
    </>
  );
}
