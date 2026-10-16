import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AuthToggle from "@/components/AuthToggle";
import AccountMenu from "@/components/AccountMenu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
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
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" aria-label="Lingo Speek home">
              <Logo />
            </Link>

            <div className="flex items-center">
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/75 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container">
        <div className="flex h-16 items-center gap-4">
          <Link to="/" aria-label="Lingo Speek home">
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

          {/* ── Right actions ── */}
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <AuthToggle className="hidden sm:grid" />

            {/* ── Mobile menu ── */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px]">
                <SheetHeader>
                  <SheetTitle>
                    <Logo size="sm" />
                  </SheetTitle>
                </SheetHeader>

                <nav className="mt-8 flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => goToSection(item.id)}
                      className={cn(
                        "rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                        active === item.id
                          ? "bg-brand-500/15 text-brand-200"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {t.nav[item.key]}
                    </button>
                  ))}
                </nav>

                <div className="mt-8">
                  <AuthToggle block onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
