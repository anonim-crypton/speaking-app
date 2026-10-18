import { Link } from "react-router-dom";
import {
  Headphones,
  Gem,
  BookOpen,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const HIGHLIGHTS = [
  {
    icon: Headphones,
    iconGradient: "from-brand-500 to-violet-600 shadow-brand-500/30",
    badgeBorder: "border-brand-500/30 bg-brand-500/10 text-brand-300",
    hoverGlow: "hover:border-brand-500/60 hover:shadow-[0_0_30px_rgba(139,92,246,0.22)]",
    linkColor: "text-brand-400 hover:text-brand-300",
    titleHover: "group-hover:text-brand-300",
    badge: "Jonli Muloqot",
    title: "1-Bosishda Ovozli Suhbat",
    desc: "Ingliz tili darajangiz va qiziqishlaringizga mos jonli suhbatdosh bilan avtomatik ulaning. Xato qilishdan qo'rqmasdan, haqiqiy jonli amaliyot qiling.",
    link: "/login",
    linkText: "Suhbatni boshlash",
  },
  {
    icon: Gem,
    iconGradient: "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30",
    badgeBorder: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
    hoverGlow: "hover:border-fuchsia-500/60 hover:shadow-[0_0_30px_rgba(217,70,239,0.22)]",
    linkColor: "text-fuchsia-400 hover:text-fuchsia-300",
    titleHover: "group-hover:text-fuchsia-300",
    badge: "Rag'bat Tizimi",
    title: "Olmoslar va Daraja O'sishi",
    desc: "Har bir yangi hisobga 50 ta olmos taqdim etiladi. Har kuni kirib kunlik bonuslarni oling, suhbatlashib XP to'plang va VIP maqomga erishing.",
    link: "/help?tab=guide",
    linkText: "Olmoslar haqida",
  },
  {
    icon: BookOpen,
    iconGradient: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    badgeBorder: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    hoverGlow: "hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.22)]",
    linkColor: "text-emerald-400 hover:text-emerald-300",
    titleHover: "group-hover:text-emerald-300",
    badge: "O'quv Resurslari",
    title: "Bepul Audio Kutubxona",
    desc: "Ingliz tili grammatikasi, audio darsliklar va mashhur adabiyotlar to'plami. Materiallarni to'g'ridan-to'g'ri o'qing yoki audio tarzda tinglang.",
    link: "/help?tab=guide",
    linkText: "Kutubxonani ko'rish",
  },
  {
    icon: ShieldCheck,
    iconGradient: "from-amber-500 to-orange-600 shadow-amber-500/30",
    badgeBorder: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    hoverGlow: "hover:border-amber-500/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.22)]",
    linkColor: "text-amber-400 hover:text-amber-300",
    titleHover: "group-hover:text-amber-300",
    badge: "Xavfsiz Muhit",
    title: "Madaniyatli va Do'stona Jamiyat",
    desc: "Spam va qoidabuzarlardan holi, o'zaro hurmatga asoslangan maydon. Xavfsizlik qoidalari va 24/7 yordam markazi orqali doim himoyadasiz.",
    link: "/help?tab=rules",
    linkText: "Jamiyat qoidalari",
  },
];

export default function PlatformHighlights() {
  return (
    <section id="highlights" className="py-12 lg:py-16 relative z-10 overflow-hidden">
      {/* Sayt binafsharang mavzusiga mos ambient orqa fon nuri */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-full max-w-6xl rounded-full bg-brand-600/15 blur-[120px] -z-10"
        aria-hidden
      />

      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {HIGHLIGHTS.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={i * 80}>
                <div
                  className={`neon-panel group h-full rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${item.hoverGlow}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${item.iconGradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span
                        className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${item.badgeBorder}`}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <h3
                      className={`text-base font-bold text-foreground transition-colors ${item.titleHover}`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60">
                    <Link
                      to={item.link}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${item.linkColor}`}
                    >
                      <span>{item.linkText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
