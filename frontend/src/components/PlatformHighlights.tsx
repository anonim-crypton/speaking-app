import { Link } from "react-router-dom";
import {
  Headphones,
  Gem,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";

const HIGHLIGHTS = [
  {
    icon: Headphones,
    color: "from-cyan-500 to-teal-500 shadow-cyan-500/30 text-cyan-300",
    borderGlow: "hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]",
    badge: "Jonli Muloqot",
    title: "1-Bosishda Ovozli Suhbat",
    desc: "Ingliz tili darajangiz va qiziqishlaringizga mos jonli suhbatdosh bilan avtomatik ulaning. Xato qilishdan qo'rqmasdan, haqiqiy jonli amaliyot qiling.",
    link: "/login",
    linkText: "Suhbatni boshlash",
  },
  {
    icon: Gem,
    color: "from-violet-500 to-purple-500 shadow-violet-500/30 text-violet-300",
    borderGlow: "hover:border-violet-400/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]",
    badge: "Rag'bat Tizimi",
    title: "Olmoslar va Daraja O'sishi",
    desc: "Har bir yangi hisobga 50 ta olmos taqdim etiladi. Har kuni kirib kunlik bonuslarni oling, suhbatlashib XP to'plang va VIP maqomga erishing.",
    link: "/help?tab=guide",
    linkText: "Olmoslar haqida",
  },
  {
    icon: BookOpen,
    color: "from-emerald-500 to-green-500 shadow-emerald-500/30 text-emerald-300",
    borderGlow: "hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    badge: "O'quv Resurslari",
    title: "Bepul Audio Kutubxona",
    desc: "Ingliz tili grammatikasi, audio darsliklar va mashhur adabiyotlar to'plami. Materiallarni to'g'ridan-to'g'ri o'qing yoki audio tarzda tinglang.",
    link: "/help?tab=guide",
    linkText: "Kutubxonani ko'rish",
  },
  {
    icon: ShieldCheck,
    color: "from-amber-500 to-orange-500 shadow-amber-500/30 text-amber-300",
    borderGlow: "hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]",
    badge: "Xavfsiz Muhit",
    title: "Madaniyatli va Do'stona Jamiyat",
    desc: "Spam va qoidabuzarlardan holi, o'zaro hurmatga asoslangan maydon. Xavfsizlik qoidalari va 24/7 yordam markazi orqali doim himoyadasiz.",
    link: "/help?tab=rules",
    linkText: "Jamiyat qoidalari",
  },
];

export default function PlatformHighlights() {
  return (
    <section id="highlights" className="py-12 lg:py-16 relative z-10">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <Reveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>Nima Uchun Aynan Lingo Speek?</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Ingliz Tilida Erkin Gapirishning Eng Samarali Yo'li
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
              Faqat nazariya emas — real insonlar bilan jonli suhbat, qiziqarli vazifalar va doimiy o'sish muhiti.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {HIGHLIGHTS.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={i * 80}>
                <div
                  className={`group h-full rounded-3xl border border-white/10 bg-[#0d1527]/80 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${item.borderGlow}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-zinc-400">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <Link
                      to={item.link}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
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
