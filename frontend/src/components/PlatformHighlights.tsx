import { Link } from "react-router-dom";
import {
  Headphones,
  Gem,
  BookOpen,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/context/LanguageContext";

interface HighlightText {
  badge: string;
  title: string;
  desc: string;
  linkText: string;
}

const HIGHLIGHTS_I18N: Record<string, HighlightText[]> = {
  uz: [
    {
      badge: "Jonli Muloqot",
      title: "1-Bosishda Ovozli Suhbat",
      desc: "Ingliz tili darajangiz va qiziqishlaringizga mos jonli suhbatdosh bilan avtomatik ulaning. Xato qilishdan qo'rqmasdan, haqiqiy jonli amaliyot qiling.",
      linkText: "Suhbatni boshlash",
    },
    {
      badge: "Rag'bat Tizimi",
      title: "Olmoslar va Daraja O'sishi",
      desc: "Har bir yangi hisobga 50 ta olmos taqdim etiladi. Har kuni kirib kunlik bonuslarni oling, suhbatlashib XP to'plang va VIP maqomga erishing.",
      linkText: "Olmoslar haqida",
    },
    {
      badge: "O'quv Resurslari",
      title: "Bepul Audio Kutubxona",
      desc: "Ingliz tili grammatikasi, audio darsliklar va mashhur adabiyotlar to'plami. Materiallarni to'g'ridan-to'g'ri o'qing yoki audio tarzda tinglang.",
      linkText: "Kutubxonani ko'rish",
    },
    {
      badge: "Xavfsiz Muhit",
      title: "Madaniyatli va Do'stona Jamiyat",
      desc: "Spam va qoidabuzarlardan holi, o'zaro hurmatga asoslangan maydon. Xavfsizlik qoidalari va 24/7 yordam markazi orqali doim himoyadasiz.",
      linkText: "Jamiyat qoidalari",
    },
  ],
  ru: [
    {
      badge: "Живое Общение",
      title: "Голосовой Чат в 1 Клик",
      desc: "Мгновенно подключайтесь к живому собеседнику под ваш уровень и интересы. Преодолевайте языковой барьер без страха ошибок в реальной практике.",
      linkText: "Начать разговор",
    },
    {
      badge: "Система Наград",
      title: "Алмазы и Рост Уровня",
      desc: "Каждому новому аккаунту начисляется 50 алмазов. Получайте ежедневные бонусы, копите XP за разговоры и повышайте свой VIP-статус.",
      linkText: "Об алмазах",
    },
    {
      badge: "Учебные Ресурсы",
      title: "Бесплатная Аудиобиблиотека",
      desc: "Грамматика английского, аудиоуроки и коллекция популярной литературы. Читайте материалы онлайн или слушайте в удобном аудиоформате.",
      linkText: "Смотреть библиотеку",
    },
    {
      badge: "Безопасная Среда",
      title: "Культурное и Дружелюбное Сообщество",
      desc: "Пространство без спама и грубости, основанное на взаимном уважении. С правилами безопасности и поддержкой 24/7 вы всегда под защитой.",
      linkText: "Правила сообщества",
    },
  ],
  en: [
    {
      badge: "Live Practice",
      title: "1-Click Voice Chat",
      desc: "Instantly connect with a live partner matched to your English level and interests. Speak freely, conquer hesitation, and practice naturally.",
      linkText: "Start conversation",
    },
    {
      badge: "Reward System",
      title: "Diamonds & Level Progress",
      desc: "Get 50 bonus diamonds upon registration. Claim daily rewards, earn XP by talking, and unlock exclusive VIP achievements.",
      linkText: "About diamonds",
    },
    {
      badge: "Learning Resources",
      title: "Free Audio Library",
      desc: "English grammar guides, audio lessons, and classic literature. Read insightful articles directly or listen on the go in high quality.",
      linkText: "Explore library",
    },
    {
      badge: "Safe Environment",
      title: "Friendly & Respectful Community",
      desc: "A positive environment free from spam and harassment. With strict safety standards and 24/7 support, you're always protected.",
      linkText: "Community guidelines",
    },
  ],
  tr: [
    {
      badge: "Canlı İletişim",
      title: "Tek Tıkla Sesli Sohbet",
      desc: "İngilizce seviyenize ve ilgi alanlarınıza uygun canlı bir partnerle anında eşleşin. Hata yapmaktan korkmadan, doğal pratik yapın.",
      linkText: "Sohbete başla",
    },
    {
      badge: "Ödül Sistemi",
      title: "Elmaslar ve Seviye İlerlemesi",
      desc: "Her yeni hesaba 50 hediye elmas. Her gün giriş yaparak günlük bonusları toplayın, konuştukça XP kazanın ve VIP statüsüne yükselin.",
      linkText: "Elmaslar hakkında",
    },
    {
      badge: "Eğitim Kaynakları",
      title: "Ücretsiz Sesli Kütüphane",
      desc: "İngilizce dilbilgisi, sesli dersler ve popüler edebiyat koleksiyonu. Materyalleri doğrudan okuyun veya sesli olarak dinleyin.",
      linkText: "Kütüphaneyi gör",
    },
    {
      badge: "Güvenli Ortam",
      title: "Nezaketli ve Dost Canlısı Topluluk",
      desc: "Spam ve kural ihlallerinden uzak, karşılıklı saygıya dayalı bir alan. Güvenlik kuralları ve 24/7 destek ile daima güvendesiniz.",
      linkText: "Topluluk kuralları",
    },
  ],
  ko: [
    {
      badge: "라이브 소통",
      title: "원클릭 음성 대화",
      desc: "영어 실력과 관심사에 맞는 대화 상대와 즉시 연결됩니다. 실수에 대한 두려움 없이 실제 대화를 통해 자연스럽게 연습하세요.",
      linkText: "대화 시작하기",
    },
    {
      badge: "보상 시스템",
      title: "다이아몬드와 레벨 성장",
      desc: "신규 가입 시 50 다이아몬드가 지급됩니다. 매일 출석 보너스를 받고, 대화하며 XP를 쌓아 VIP 등급을 달성하세요.",
      linkText: "다이아몬드 안내",
    },
    {
      badge: "학습 리소스",
      title: "무료 오디오 라이브러리",
      desc: "영어 문법, 오디오 강의, 인기 도서 컬렉션이 제공됩니다. 자료를 직접 읽거나 고품질 오디오로 편리하게 들어보세요.",
      linkText: "라이브러리 보기",
    },
    {
      badge: "안전한 환경",
      title: "매너 있고 친절한 커뮤니티",
      desc: "스팸이나 무례함 없는 상호 존중 커뮤니티입니다. 엄격한 안전 수칙과 24/7 고객 지원으로 언제나 안전하게 이용할 수 있습니다.",
      linkText: "커뮤니티 이용 수칙",
    },
  ],
};

const ICONS_CONFIG = [
  {
    icon: Headphones,
    iconGradient: "from-brand-500 to-violet-600 shadow-brand-500/30",
    badgeBorder: "border-brand-500/30 bg-brand-500/10 text-brand-300",
    hoverGlow: "hover:border-brand-500/60 hover:shadow-[0_0_30px_rgba(139,92,246,0.22)]",
    linkColor: "text-brand-400 hover:text-brand-300",
    titleHover: "group-hover:text-brand-300",
    link: "/login",
  },
  {
    icon: Gem,
    iconGradient: "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30",
    badgeBorder: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
    hoverGlow: "hover:border-fuchsia-500/60 hover:shadow-[0_0_30px_rgba(217,70,239,0.22)]",
    linkColor: "text-fuchsia-400 hover:text-fuchsia-300",
    titleHover: "group-hover:text-fuchsia-300",
    link: "/help?tab=guide",
  },
  {
    icon: BookOpen,
    iconGradient: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    badgeBorder: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    hoverGlow: "hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.22)]",
    linkColor: "text-emerald-400 hover:text-emerald-300",
    titleHover: "group-hover:text-emerald-300",
    link: "/help?tab=guide",
  },
  {
    icon: ShieldCheck,
    iconGradient: "from-amber-500 to-orange-600 shadow-amber-500/30",
    badgeBorder: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    hoverGlow: "hover:border-amber-500/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.22)]",
    linkColor: "text-amber-400 hover:text-amber-300",
    titleHover: "group-hover:text-amber-300",
    link: "/help?tab=rules",
  },
];

export default function PlatformHighlights() {
  const { lang } = useLanguage();
  const currentLang = HIGHLIGHTS_I18N[lang] ? lang : "uz";
  const items = HIGHLIGHTS_I18N[currentLang] || HIGHLIGHTS_I18N.uz;

  return (
    <section id="highlights" className="py-12 lg:py-16 relative z-10 overflow-hidden">
      {/* Sayt binafsharang mavzusiga mos ambient orqa fon nuri */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-full max-w-6xl rounded-full bg-brand-600/15 blur-[120px] -z-10"
        aria-hidden
      />

      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => {
            const cfg = ICONS_CONFIG[i] || ICONS_CONFIG[0];
            const Icon = cfg.icon;
            return (
              <Reveal key={item.title + i} delay={i * 80}>
                <div
                  className={`neon-panel group h-full rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${cfg.hoverGlow}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${cfg.iconGradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span
                        className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${cfg.badgeBorder}`}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <h3
                      className={`text-base font-bold text-foreground transition-colors ${cfg.titleHover}`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60">
                    <Link
                      to={cfg.link}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${cfg.linkColor}`}
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
