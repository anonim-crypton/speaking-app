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
    <footer id="contact" className="mt-14 border-t border-white/10 bg-gradient-to-b from-[#080415]/90 via-[#0a051d] to-[#04020c] relative z-10">
      <div className="w-full px-6 sm:px-10 lg:px-16 pt-16 sm:pt-20 pb-28 lg:pb-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* ── Brand ── */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="scale-105 origin-left">
                <Logo />
              </div>
              <p className="mt-5 max-w-[340px] text-sm sm:text-[14.5px] leading-relaxed text-zinc-300">
                {t.footer.tagline}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map(({ icon: Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-400 transition-all hover:scale-110 hover:border-violet-500/60 hover:bg-violet-500/15 hover:text-violet-200 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] cursor-pointer"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Link columns (Yordam & Huquqiy) ── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:col-span-4">
            {t.footer.columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                  {col.title}
                </h4>
                <ul className="mt-5 space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        to={getLinkTarget(link)}
                        className="text-sm sm:text-[14.5px] text-zinc-400 transition-colors hover:text-violet-300 hover:underline block py-0.5"
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
            <h4 className="text-sm sm:text-base font-extrabold tracking-wide text-white">
              {t.footer.newsletterTitle}
            </h4>
            <p className="mt-4 text-sm sm:text-[14.5px] leading-relaxed text-zinc-400 max-w-sm">
              {t.footer.newsletterSub}
            </p>
            {subscribed ? (
              <div className="mt-5 flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-sm font-semibold animate-in fade-in shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <span>Rahmat! Yangiliklarimizga muvaffaqiyatli obuna bo'ldingiz.</span>
              </div>
            ) : (
              <form
                className="mt-5 flex items-center gap-2.5"
                onSubmit={handleNewsletterSubmit}
              >
                <Input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t.footer.newsletterPlaceholder}
                  className="h-12 text-sm bg-white/[0.06] border-white/15 placeholder:text-zinc-500 rounded-xl px-4"
                  aria-label={t.footer.newsletterPlaceholder}
                />
                <Button
                  type="submit"
                  variant="glow"
                  size="icon"
                  aria-label="Subscribe"
                  className="h-12 w-12 rounded-xl shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            )}
          </div>
        </div>

        <Separator className="my-12 bg-white/10" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-4 text-xs sm:text-sm text-zinc-400 sm:flex-row">
          <span>
            © {year} {BRAND}. {t.footer.copyright}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span>{t.footer.bottomTagline}</span>
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-violet-400" />
              {t.footer.bottomRight}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
