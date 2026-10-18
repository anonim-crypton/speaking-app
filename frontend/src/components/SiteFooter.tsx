import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
  Twitter,
  Youtube,
  CheckCircle2,
} from "lucide-react";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { BRAND } from "@/i18n/translations";

const SOCIALS = [
  { icon: MessageCircle, href: "https://t.me/lingospeek", label: "Telegram" },
  { icon: Youtube, href: "https://youtube.com/@lingospeek", label: "YouTube" },
  { icon: Instagram, href: "https://instagram.com/lingospeek", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com/lingospeek", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/lingospeek", label: "LinkedIn" },
];

export default function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const getLinkTarget = (link: string) => {
    const l = link.toLowerCase();
    if (l.includes("yordam markazi") || l.includes("help center") || l.includes("центр помощи")) {
      return "/help?tab=guide";
    }
    if (l.includes("bog'lanish") || l.includes("contact") || l.includes("связаться")) {
      return "/help?tab=contact";
    }
    if (l.includes("fikr") || l.includes("feedback") || l.includes("обратная")) {
      return "/help?tab=feedback";
    }
    if (l.includes("qoidalar") || l.includes("guidelines") || l.includes("правила")) {
      return "/help?tab=rules";
    }
    if (l.includes("savollar") || l.includes("faq") || l.includes("вопросы")) {
      return "/help?tab=faq";
    }
    if (l.includes("shart") || l.includes("terms") || l.includes("условия")) {
      return "/help?tab=terms";
    }
    if (l.includes("maxfiylik") || l.includes("privacy") || l.includes("конфиденциаль")) {
      return "/help?tab=privacy";
    }
    if (l.includes("xavfsizlik") || l.includes("safety") || l.includes("безопасн")) {
      return "/help?tab=safety";
    }
    return "/help";
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setNewsletterEmail("");
    }, 4000);
  };

  return (
    <footer id="contact" className="mt-8 border-t border-border/60 bg-night-950/40">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* ── Brand ── */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ icon: Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-white/5 text-muted-foreground transition-all hover:scale-105 hover:border-brand-500/60 hover:bg-brand-500/10 hover:text-brand-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Link columns (Yordam & Huquqiy) ── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:col-span-4">
            {t.footer.columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-[13px] font-bold tracking-tight text-white">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        to={getLinkTarget(link)}
                        className="text-[12.5px] text-muted-foreground transition-colors hover:text-brand-300 hover:underline block py-0.5"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Newsletter ── */}
          <div className="lg:col-span-4">
            <h4 className="text-[13px] font-bold tracking-tight text-white">
              {t.footer.newsletterTitle}
            </h4>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.footer.newsletterSub}
            </p>
            {subscribed ? (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Rahmat! Yangiliklarimizga muvaffaqiyatli obuna bo'ldingiz.</span>
              </div>
            ) : (
              <form
                className="mt-4 flex items-center gap-2"
                onSubmit={handleNewsletterSubmit}
              >
                <Input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t.footer.newsletterPlaceholder}
                  className="h-10 text-xs bg-white/5 border-white/10 placeholder:text-zinc-500"
                  aria-label={t.footer.newsletterPlaceholder}
                />
                <Button type="submit" variant="glow" size="icon" aria-label="Subscribe" className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        <Separator className="my-9 bg-white/10" />

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
