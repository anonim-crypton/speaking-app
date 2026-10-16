import {
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { BRAND } from "@/i18n/translations";

const SOCIALS = [MessageCircle, Youtube, Instagram, Twitter, Linkedin];

export default function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="mt-8 border-t border-border/60 bg-night-950/40">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* ── Brand ── */}
          <div className="lg:col-span-3">
            <Logo />
            <p className="mt-4 max-w-[250px] text-[13px] leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Social link"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-white/5 text-muted-foreground transition-colors hover:border-brand-500/60 hover:bg-brand-500/10 hover:text-brand-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Link columns ── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-6">
            {t.footer.columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-[13px] font-bold tracking-tight">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-[12.5px] text-muted-foreground transition-colors hover:text-brand-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Newsletter ── */}
          <div className="lg:col-span-3">
            <h4 className="text-[13px] font-bold tracking-tight">
              {t.footer.newsletterTitle}
            </h4>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.footer.newsletterSub}
            </p>
            <form
              className="mt-4 flex items-center gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                placeholder={t.footer.newsletterPlaceholder}
                className="h-10"
                aria-label={t.footer.newsletterPlaceholder}
              />
              <Button type="submit" variant="glow" size="icon" aria-label="Subscribe">
                <Send />
              </Button>
            </form>
          </div>
        </div>

        <Separator className="my-9" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-3 text-[11.5px] text-muted-foreground sm:flex-row">
          <span>
            © {year} {BRAND}. {t.footer.copyright}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span>{t.footer.bottomTagline}</span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {t.footer.bottomRight}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
