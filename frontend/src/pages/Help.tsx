import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  HelpCircle,
  MessageSquare,
  Send,
  ShieldCheck,
  BookOpen,
  Headphones,
  Search,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  FileText,
  Sparkles,
  Users,
  Gem,
} from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";

type HelpTab = "guide" | "contact" | "feedback" | "rules" | "faq" | "terms" | "privacy" | "safety";

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: "audio",
    q: "Mikrofonim ishlamayapti, nima qilishim kerak?",
    a: "Brauzeringiz manzili yonidagi qulf (ruxsat) belgisiga bosing va Mikrofonga 'Ruxsat berish' (Allow) ni tanlang. Shuningdek, tizim sozlamalarida mikrofon boshqa dasturlar tomonidan band qilinmaganligiga ishonch hosil qiling.",
  },
  {
    category: "account",
    q: "Olmoslarim tugab qolsa qanday qilib yangisini olishim mumkin?",
    a: "Har kuni platformaga kirib 'Kundalik mukofot'ni olishingiz, audio suhbat vazifalarini bajarishingiz, do'stlaringizni taklif qilishingiz yoki kitoblar mutolaa qilish orqali bepul olmoslarga ega bo'lishingiz mumkin.",
  },
  {
    category: "social",
    q: "Suhbatdoshim qoidalarni buzsa qayerga shikoyat qilaman?",
    a: "Suhbat vaqtida yoki tugagandan so'ng 'Shikoyat qilish' (Report) tugmasini bosing. Sababini tanlab yuborsangiz, adminlar va sun'iy intellekt filtrlari darhol qoidabuzarni tekshiradi va chora ko'radi.",
  },
  {
    category: "account",
    q: "Profil rasmim va ma'lumotlarimni qayerdan o'zgartiraman?",
    a: "O'z shaxsiy hisobingizga kirib, 'Profil' bo'limiga o'ting. U yerda 'Profilni tahrirlash' tugmasini bosib yangi rasm yuklashingiz, ism va foydalanuvchi nomini o'zgartirishingiz mumkin.",
  },
  {
    category: "audio",
    q: "Nega suhbatdosh topish 1 daqiqagacha vaqt olyapti?",
    a: "Lingo Speek sizning ingliz tili darajangiz va qiziqishlaringizga 100% mos keluvchi haqiqiy jonli suhbatdoshni tanlaydi. Agar o'sha soniyada mos keluvchi foydalanuvchi bo'lmasa, tizim avtomatik tarzda eng yaqin darajadagi faol foydalanuvchilar bilan bog'laydi.",
  },
  {
    category: "privacy",
    q: "Mening audio suhbatlarim yozib olinadimi?",
    a: "Yo'q, sizning ovozli suhbatlaringiz to'g'ridan-to'g'ri WebRTC protokoli orqali amalga oshiriladi va maxfiylik siyosatimizga muvofiq serverlarda doimiy yozib olinmaydi.",
  },
  {
    category: "account",
    q: "VIP / Premium akkaunt qanday afzalliklarga ega?",
    a: "VIP akkaunt egalari cheksiz audio suhbatlar, qidiruvda ustuvorlik, maxsus Verified nishon, barcha audio kitoblarga to'liq bepul kirish va VIP eksklyuziv suhbat xonalaridan foydalanish huquqiga ega bo'ladilar.",
  },
  {
    category: "social",
    q: "Do'stlarim bilan shaxsiy xona ochib suhbatlashsam bo'ladimi?",
    a: "Ha, 'Xona yaratish' (Create Room) bo'limida o'z xonangizni ochib, do'stingizga havolani yuborishingiz yoki to'g'ridan-to'g'ri 'Do'stlar' ro'yxatidan taklif qilishingiz mumkin.",
  },
];

export default function Help() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as HelpTab) || "guide";
  const [activeTab, setActiveTab] = useState<HelpTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  // Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState("feature");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as HelpTab;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const selectTab = (tab: HelpTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQS;
    return FAQS.filter(
      (item) =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/matchmaking/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerUsername: "SUPPORT_CONTACT",
          reasons: ["Bog'lanish / Yordam so'rovi"],
          details: `Ism: ${contactName} | Aloqa: ${contactEmail} | Xabar: ${contactMessage}`,
        }),
      });
    } catch {
      /* ignore */
    }
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    }, 4500);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/matchmaking/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerUsername: "FEEDBACK",
          reasons: [`Kategoriya: ${feedbackCategory}`, `Baho: ${feedbackRating} yulduz`],
          details: feedbackText,
        }),
      });
    } catch {
      /* ignore */
    }
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackText("");
    }, 4500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent text-foreground font-sans selection:bg-brand-500 selection:text-white relative overflow-x-hidden">
      {/* ── Ambient Background Glows ── */}
      <div
        className="pointer-events-none fixed -top-40 left-1/4 w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-[160px] -z-10"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -bottom-40 right-1/4 w-[600px] h-[600px] bg-fuchsia-600/12 rounded-full blur-[160px] -z-10"
        aria-hidden
      />

      {/* ── Full Width Hero Header ── */}
      <div className="w-full border-b border-border/80 bg-card/40 backdrop-blur-2xl relative z-10 px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Sparkles className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
              <span>Qo'llab-quvvatlash va Qo'llanma</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Sizga qanday <span className="text-gradient">yordam bera olamiz?</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Lingo Speek platformasining barcha imkoniyatlari, audio matchmaking yo'riqnomasi,
              jamiyat qoidalari va aloqa xizmati bilan bir joyda tanishing.
            </p>
          </div>

          {/* Live Search Bar */}
          <div className="w-full md:w-96 relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "faq" && e.target.value.trim()) {
                  setActiveTab("faq");
                }
              }}
              placeholder="Savol yoki kalit so'zni qidiring..."
              className="w-full rounded-2xl border border-border/80 bg-card/70 py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 shadow-xl transition-all"
            />
          </div>
        </div>

        {/* ── Top Tabs Bar (5 Asosiy Tugma) ── */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border/70 pt-6">
          <button
            onClick={() => selectTab("guide")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "guide"
                ? "bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] border border-brand-400/30"
                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/70"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Yordam markazi</span>
          </button>

          <button
            onClick={() => selectTab("contact")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "contact"
                ? "bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] border border-brand-400/30"
                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/70"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bog'lanish</span>
          </button>

          <button
            onClick={() => selectTab("feedback")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "feedback"
                ? "bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] border border-brand-400/30"
                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/70"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Fikr-mulohaza</span>
          </button>

          <button
            onClick={() => selectTab("rules")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "rules"
                ? "bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] border border-brand-400/30"
                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/70"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Jamiyat qoidalari</span>
          </button>

          <button
            onClick={() => selectTab("faq")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "faq"
                ? "bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] border border-brand-400/30"
                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/70"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ko'p so'raladigan savollar</span>
          </button>
        </div>
      </div>

      {/* ── Main Full-Width Content Container ── */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-8 relative z-10 space-y-10">

        {/* ═══════════ 1. YORDAM MARKAZI (GUIDE) ═══════════ */}
        {activeTab === "guide" && (
          <div className="w-full space-y-8 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-brand-400" />
                <span>Lingo Speek Qo'llanmasi</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Platformaning asosiy bo'limlari va vositalaridan maksimal darajada unumli foydalaning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 w-full">
              {/* Card 1: Audio Matchmaking */}
              <div className="neon-panel rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.18)]">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Audio Matchmaking</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Bosh sahifadagi "Suhbatni boshlash" tugmasini bosing. Tizim sizning til darajangiz va qiziqishlaringizga mos sherik topadi va avtomatik ovozli xonaga ulaydi.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-border/60 text-xs font-semibold text-brand-400 flex items-center gap-1">
                  <span>100% Jonli muloqot</span>
                </div>
              </div>

              {/* Card 2: Olmoslar va Vazifalar */}
              <div className="neon-panel rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-500/50 hover:shadow-[0_0_30px_rgba(217,70,239,0.18)]">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/20">
                    <Gem className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Olmoslar va Rag'bat</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Har bir yangi ro'yxatdan o'tgan foydalanuvchiga 50 ta olmos taqdim etiladi. Har kuni kirganingizda bonuslar oling va vazifalarni bajarib darajangizni ko'taring.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-border/60 text-xs font-semibold text-fuchsia-300 flex items-center gap-1">
                  <span>Kunlik bonuslar</span>
                </div>
              </div>

              {/* Card 3: Kutubxona va Materiallar */}
              <div className="neon-panel rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Kitoblar va Lug'at</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Kutubxona bo'limida eng sara ingliz tili darsliklari, grammatika qo'llanmalari va audio materiallar joylashtirilgan bo'lib, ularni bepul o'qishingiz mumkin.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-border/60 text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <span>PDF va Audio materiallar</span>
                </div>
              </div>

              {/* Card 4: Do'stlar va Xonalar */}
              <div className="neon-panel rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.18)]">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Do'stlar va Guruhlar</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Suhbatdoshlaringizga do'stlik taklifini yuboring, shaxsiy suhbat xonalari yarating va istalgan vaqtda birga gaplashib tajribangizni oshiring.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-border/60 text-xs font-semibold text-amber-300 flex items-center gap-1">
                  <span>Shaxsiy xonalar</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step walkthrough */}
            <div className="neon-panel rounded-3xl p-6 sm:p-8 w-full border border-border/80 shadow-2xl">
              <h3 className="text-lg font-bold text-foreground mb-6">Muvaffaqiyatli Muloqot Qilish Uchun 3 Qadam</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/20 border border-brand-500/40 text-brand-300 font-extrabold text-base shadow-md">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Mikrofonni sozlang</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Eshitish vositasidan (quloqchin) foydalaning. Bu aks-sado bo'lmasligi va suhbatdoshingiz sizni tiniq eshitishini ta'minlaydi.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-300 font-extrabold text-base shadow-md">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Mavzu bo'yicha gapiring</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Xonada berilgan kun mavzulari yoki qiziqishlaringiz bo'yicha erkin suhbat boshlang. Xato qilishdan mutlaqo qo'rqmang!
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 font-extrabold text-base shadow-md">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Aloqani saqlang</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Suhbat yakunida suhbatdoshni do'stlaringiz safiga qo'shing va keyingi amaliyotlar uchun belgilab qo'ying.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ 2. BOG'LANISH (CONTACT) ═══════════ */}
        {activeTab === "contact" && (
          <div className="w-full space-y-8 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-brand-400" />
                <span>Qo'llab-quvvatlash Xizmati Bilan Bog'lanish</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Savollaringiz yoki muammolaringiz bormi? Bizga to'g'ridan-to'g'ri xabar yuboring yoki aloqa kanallarimizdan foydalaning.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
              {/* Left: Contact Info */}
              <div className="lg:col-span-5 space-y-4">
                <div className="neon-panel rounded-3xl p-6 space-y-4 border border-border/80 shadow-xl">
                  <h3 className="text-base font-bold text-foreground">To'g'ridan-to'g'ri Aloqa</h3>
                  
                  <a
                    href="https://t.me/lingospeek"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 hover:border-brand-500/60 transition-all text-foreground group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-300 group-hover:scale-105 transition-transform">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Telegram Yordam</div>
                      <div className="text-[11px] text-muted-foreground">@lingospeek (24/7 onlayn)</div>
                    </div>
                  </a>

                  <a
                    href="mailto:support@lingospeek.com"
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 hover:border-fuchsia-500/60 transition-all text-foreground group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-300 group-hover:scale-105 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Elektron Pochta</div>
                      <div className="text-[11px] text-muted-foreground">support@lingospeek.com</div>
                    </div>
                  </a>

                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 space-y-1 text-xs">
                    <span className="font-semibold text-foreground">Javob berish vaqti:</span>
                    <p className="text-muted-foreground">
                      Telegram orqali 5-15 daqiqa ichida, email orqali esa 24 soat ichida mutaxassislarimiz javob berishadi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Contact Form */}
              <div className="lg:col-span-7">
                <div className="neon-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-border/80">
                  <h3 className="text-base font-bold text-foreground mb-2">Xabar Yozish</h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Quyidagi shaklni to'ldiring, xabaringiz to'g'ridan-to'g'ri ma'murlarga yetib boradi.
                  </p>

                  {contactSent ? (
                    <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2 animate-in zoom-in duration-200">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                      <h4 className="text-base font-bold text-foreground">Xabaringiz Qabul Qilindi!</h4>
                      <p className="text-xs text-muted-foreground">
                        Tez orada mutaxassislarimiz siz bilan ko'rsatilgan aloqa vositasi orqali bog'lanishadi.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1.5">
                            Ismingiz
                          </label>
                          <Input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Masalan: Sardor"
                            className="bg-card/70 border-border/80 text-foreground text-xs h-11 focus:border-brand-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1.5">
                            Email yoki Telefon raqamingiz
                          </label>
                          <Input
                            type="text"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="email@example.com yoki +998..."
                            className="bg-card/70 border-border/80 text-foreground text-xs h-11 focus:border-brand-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">
                          Xabaringiz matni
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Qanday masalada yordam kerakligini batafsil yozing..."
                          className="w-full rounded-2xl border border-border/80 bg-card/70 p-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 text-white font-bold py-3.5 text-sm shadow-lg shadow-brand-500/30 hover:opacity-95"
                      >
                        Xabarni Yuborish
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ 3. FIKR-MULOHAZA (FEEDBACK) ═══════════ */}
        {activeTab === "feedback" && (
          <div className="w-full space-y-8 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                <Star className="w-6 h-6 text-amber-400" />
                <span>Fikr-mulohaza va Takliflar</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Lingo Speek-ni yanada mukammal qilishda sizning fikringiz biz uchun bebahodir!
              </p>
            </div>

            <div className="neon-panel rounded-3xl p-6 sm:p-8 shadow-2xl w-full border border-border/80">
              {feedbackSent ? (
                <div className="p-8 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-3 animate-in zoom-in duration-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-lg font-bold text-foreground">Taklifingiz uchun katta rahmat!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Sizning fikringiz dasturchilarimiz tomonidan ko'rib chiqiladi va kelgusi yangilanishlarda inobatga olinadi.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-2">
                      Platformadagi tajribangizni baholang:
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            star <= feedbackRating
                              ? "text-amber-400 bg-amber-500/15 scale-110"
                              : "text-muted-foreground hover:text-foreground bg-card/50"
                          }`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                      <span className="text-xs font-semibold text-amber-400 ml-2">
                        {feedbackRating} / 5 yulduz
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-2">
                      Murojaat turi:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: "feature", label: "Yangi imkoniyat taklifi" },
                        { key: "bug", label: "Xatolik / Muammo" },
                        { key: "audio", label: "Ovoz va aloqa sifati" },
                        { key: "other", label: "Boshqa fikrlar" },
                      ].map(({ key, label }) => (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setFeedbackCategory(key)}
                          className={`p-3 rounded-2xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                            feedbackCategory === key
                              ? "border-brand-500 bg-brand-500/20 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                              : "border-border/70 bg-card/60 text-muted-foreground hover:bg-card/90"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Fikr yoki taklifingizni yozing:
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Saytda qanday yangiliklar yoki qulayliklar bo'lishini xohlardingiz?..."
                      className="w-full rounded-2xl border border-border/80 bg-card/70 p-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 text-white font-bold px-8 py-3.5 text-sm shadow-lg shadow-brand-500/30 hover:opacity-95"
                  >
                    Fikr-mulohazani Yuborish
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ 4. JAMIYAT QOIDALARI (RULES) ═══════════ */}
        {activeTab === "rules" && (
          <div className="w-full space-y-8 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-brand-400" />
                <span>Jamiyat va Xavfsizlik Qoidalari</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Lingo Speek barcha uchun xavfsiz, do'stona va samarali ta'lim maydonidir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              <div className="neon-panel rounded-3xl p-6 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.18)]">
                <div className="h-10 w-10 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/40 flex items-center justify-center font-bold shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold text-foreground">O'zaro Hurmat va Odob</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Har qanday shakldagi haqorat, kamsitish, tahdid yoki noo'rin so'zlar qat'iyan taqiqlanadi. Suhbatdoshingizning til o'rganish darajasini hurmat qiling.
                </p>
              </div>

              <div className="neon-panel rounded-3xl p-6 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.18)]">
                <div className="h-10 w-10 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center justify-center font-bold shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold text-foreground">Shaxsiy Maxfiylikni Saqlash</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Begona suhbatdoshlarga shaxsiy parollaringiz, bank karta raqamlari yoki moliyaviy ma'lumotlaringizni aslo bermang. Lingo Speek xodimlari sizdan hech qachon parol so'ramaydi.
                </p>
              </div>

              <div className="neon-panel rounded-3xl p-6 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-500/50 hover:shadow-[0_0_25px_rgba(217,70,239,0.18)]">
                <div className="h-10 w-10 rounded-2xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 flex items-center justify-center font-bold shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold text-foreground">Audio Muloqot Odobi</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Suhbat vaqtida fon shovqinlarini kamaytiring, so'z navbatiga rioya qiling. Suhbatdosh gapirayotganda uning gapini bo'lmaslikka harakat qiling.
                </p>
              </div>

              <div className="neon-panel rounded-3xl p-6 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.18)]">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold shadow-md">
                  4
                </div>
                <h3 className="text-base font-bold text-foreground">Spam va Reklama Taqiqlangan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ruxsatsiz tijoriy reklama tarqatish, begona havolalar yuborish, botlar yoki avtomatlashtirilgan dasturlardan foydalanish zudlik bilan bloklanishga olib keladi.
                </p>
              </div>

              <div className="neon-panel rounded-3xl p-6 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.18)]">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center font-bold shadow-md">
                  5
                </div>
                <h3 className="text-base font-bold text-foreground">Avtomatik Ban Tizimi</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Qoidabuzarlik holati aniqlanganda yoki ko'p shikoyat tushganda, tizim foydalanuvchining akkaunti va unga tegishli qurilmasini avtomatik bloklaydi.
                </p>
              </div>

              <div className="neon-panel rounded-3xl p-6 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold shadow-md">
                  6
                </div>
                <h3 className="text-base font-bold text-foreground">Tezkor Shikoyat Qilish</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Agar kimdir qoidalarni buzayotgan bo'lsa, xonadagi "Shikoyat" tugmasini bosing. Bizning xavfsizlik jamoamiz xabarni zudlik bilan ko'rib chiqadi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ 5. FAQ (SAVOL-JAVOBLAR) ═══════════ */}
        {activeTab === "faq" && (
          <div className="w-full space-y-8 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-brand-400" />
                <span>Ko'p So'raladigan Savollar</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Foydalanuvchilarimiz eng ko'p beradigan savollarga aniq va tushunarli javoblar.
              </p>
            </div>

            <div className="space-y-3 w-full">
              {filteredFaqs.length === 0 ? (
                <div className="neon-panel rounded-3xl p-10 text-center text-muted-foreground">
                  Qidiruv bo'yicha hech qanday ma'lumot topilmadi. Boshqa so'z bilan izlab ko'ring.
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="neon-panel rounded-2xl transition-all overflow-hidden border border-border/70 hover:border-brand-500/40"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 outline-none hover:bg-card/70 transition-colors cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-bold text-foreground">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-brand-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-border/50 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══════════ LEGAL: TERMS / PRIVACY / SAFETY ═══════════ */}
        {(activeTab === "terms" || activeTab === "privacy" || activeTab === "safety") && (
          <div className="w-full space-y-6 animate-in fade-in duration-200">
            <div className="neon-panel rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 border border-border/80">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                <FileText className="w-6 h-6 text-brand-400" />
                <span>
                  {activeTab === "terms"
                    ? "Foydalanish Shartlari"
                    : activeTab === "privacy"
                    ? "Maxfiylik Siyosati"
                    : "Xavfsizlik va Ma'lumotlarni Himoyalash"}
                </span>
              </h2>

              <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-6">
                <p>
                  <strong className="text-foreground">1. Umumiy qoidalar:</strong> Lingo Speek platformasidan foydalanish orqali siz ushbu shartlarga to'liq rozilik bildirasiz. Platforma xalqaro ta'lim va til o'rganish standartlariga muvofiq ishlaydi.
                </p>
                <p>
                  <strong className="text-foreground">2. Shaxsiy ma'lumotlar:</strong> Biz foydalanuvchilarning shaxsiy ma'lumotlarini (ism, email, telefon raqami) xavfsiz shifrlangan holatda saqlaymiz va uchinchi tomonlarga bermaymiz.
                </p>
                <p>
                  <strong className="text-foreground">3. Audio xavfsizlik:</strong> Suhbatlar davomida boshqa foydalanuvchilarga tajovuz qilish, nojo'ya xatti-harakatlar qilish akkauntning darhol to'xtatilishiga sabab bo'ladi.
                </p>
                <p>
                  <strong className="text-foreground">4. Bog'lanish:</strong> Savol va takliflar uchun <Link to="/help?tab=contact" className="text-brand-400 underline font-semibold hover:text-brand-300">Bog'lanish</Link> bo'limidan murojaat qilishingiz mumkin.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <SiteFooter />
    </div>
  );
}
