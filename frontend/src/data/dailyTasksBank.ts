export type LanguageKey = "uz" | "en" | "ru" | "tr" | "ko";

export type DifficultyTier = "A1" | "A2" | "B1" | "B2" | "C1";

export interface DailyTaskQuestion {
  id: string;
  language: LanguageKey;
  tier: DifficultyTier;
  tierLabel: string;
  xpReward: number;
  category: string;
  prompt: string;
  hint?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const LANGUAGE_META: Record<
  LanguageKey,
  { label: string; flag: string; subtitle: string; gradient: string }
> = {
  en: {
    label: "Ingliz tili",
    flag: "🇬🇧",
    subtitle: "English • A1 dan C1 gacha",
    gradient: "from-blue-500/20 to-indigo-500/20 border-blue-500/35 text-blue-200",
  },
  ru: {
    label: "Rus tili",
    flag: "🇷🇺",
    subtitle: "Русский • Elementary → Advanced",
    gradient: "from-sky-500/20 to-cyan-500/20 border-sky-500/35 text-sky-200",
  },
  tr: {
    label: "Turk tili",
    flag: "🇹🇷",
    subtitle: "Türkçe • Bosqichma-bosqich",
    gradient: "from-rose-500/20 to-red-500/20 border-rose-500/35 text-rose-200",
  },
  ko: {
    label: "Koreys tili",
    flag: "🇰🇷",
    subtitle: "한국어 • TOPIK I → II",
    gradient: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/35 text-violet-200",
  },
  uz: {
    label: "O'zbek tili",
    flag: "🇺🇿",
    subtitle: "Ona tili va nutq madaniyati",
    gradient: "from-emerald-500/20 to-teal-500/20 border-emerald-500/35 text-emerald-200",
  },
};

export const TIER_META: Record<
  DifficultyTier,
  { label: string; badgeClass: string; xp: number; order: number }
> = {
  A1: {
    label: "A1 • Elementary (Boshlang'ich)",
    badgeClass: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
    xp: 20,
    order: 1,
  },
  A2: {
    label: "A2 • Pre-Intermediate (Quyi o'rta)",
    badgeClass: "border-cyan-500/35 bg-cyan-500/15 text-cyan-300",
    xp: 25,
    order: 2,
  },
  B1: {
    label: "B1 • Intermediate (O'rta daraja)",
    badgeClass: "border-blue-500/35 bg-blue-500/15 text-blue-300",
    xp: 35,
    order: 3,
  },
  B2: {
    label: "B2 • Upper-Intermediate (Yuqori o'rta)",
    badgeClass: "border-purple-500/35 bg-purple-500/15 text-purple-300",
    xp: 45,
    order: 4,
  },
  C1: {
    label: "C1 • Advanced (Mukammal daraja)",
    badgeClass: "border-amber-500/35 bg-amber-500/15 text-amber-300",
    xp: 60,
    order: 5,
  },
};

export const TASKS_BANK: Record<LanguageKey, DailyTaskQuestion[]> = {
  en: [
    // A1 Elementary
    {
      id: "en_a1_1",
      language: "en",
      tier: "A1",
      tierLabel: "A1 • Elementary",
      xpReward: 20,
      category: "Grammar • To Be",
      prompt: "Bo'sh joyni to'ldiring: 'She ___ my best friend from school.'",
      hint: "3-shaxs birlik (She/He/It) uchun to'g'ri fe'lni tanlang.",
      options: ["am", "is", "are", "be"],
      correctIndex: 1,
      explanation: "'She' olmoshidan keyin Present Simple zamonida 'is' ishlatiladi.",
    },
    {
      id: "en_a1_2",
      language: "en",
      tier: "A1",
      tierLabel: "A1 • Elementary",
      xpReward: 20,
      category: "Vocabulary • Daily Routine",
      prompt: "'Ertalab nonushta qilmoq' ingliz tilida qanday aytiladi?",
      options: ["Have dinner", "Have breakfast", "Make lunch", "Go to sleep"],
      correctIndex: 1,
      explanation: "'Have breakfast' — nonushta qilmoq degan ma'noni bildiradi.",
    },
    {
      id: "en_a1_3",
      language: "en",
      tier: "A1",
      tierLabel: "A1 • Elementary",
      xpReward: 20,
      category: "Speaking • Greetings",
      prompt: "'How is it going?' savoliga eng tabiiy javob qaysi?",
      options: [
        "I am 20 years old.",
        "Pretty good, thanks! How about you?",
        "Yes, I have a book.",
        "To the supermarket.",
      ],
      correctIndex: 1,
      explanation: "'How is it going?' — 'Ishlar qalay?' degani, shuning uchun 'Pretty good, thanks!' to'g'ri.",
    },
    {
      id: "en_a1_4",
      language: "en",
      tier: "A1",
      tierLabel: "A1 • Elementary",
      xpReward: 20,
      category: "Grammar • Articles",
      prompt: "To'g'ri artiklni tanlang: 'I bought ___ umbrella because it was raining.'",
      options: ["a", "an", "the", "no article"],
      correctIndex: 1,
      explanation: "'Umbrella' unli tovush [ʌ] bilan boshlangani uchun 'an' artikli qo'yiladi.",
    },
    // A2 Beginner
    {
      id: "en_a2_1",
      language: "en",
      tier: "A2",
      tierLabel: "A2 • Pre-Intermediate",
      xpReward: 25,
      category: "Grammar • Past Simple",
      prompt: "O'tgan zamon shaklini tanlang: 'Yesterday we ___ to the cinema together.'",
      options: ["go", "went", "gone", "going"],
      correctIndex: 1,
      explanation: "'Go' noto'g'ri fe'lining Past Simple (o'tgan zamon) shakli 'went' bo'ladi.",
    },
    {
      id: "en_a2_2",
      language: "en",
      tier: "A2",
      tierLabel: "A2 • Pre-Intermediate",
      xpReward: 25,
      category: "Vocabulary • Travel",
      prompt: "Aeroportda samolyotga chiqish taloni nima deb ataladi?",
      options: ["Boarding pass", "Receipt", "Driving license", "Prescription"],
      correctIndex: 0,
      explanation: "'Boarding pass' — samolyotga chiqish ruxsatnomasi (taloni).",
    },
    {
      id: "en_a2_3",
      language: "en",
      tier: "A2",
      tierLabel: "A2 • Pre-Intermediate",
      xpReward: 25,
      category: "Grammar • Comparatives",
      prompt: "Qiyosiy darajani tanlang: 'Learning with a partner is ___ than studying alone.'",
      options: ["more easy", "easier", "easiest", "most easy"],
      correctIndex: 1,
      explanation: "Ikki bo'g'inli '-y' bilan tugagan sifatlar '-ier' qo'shimchasini oladi: 'easier'.",
    },
    {
      id: "en_a2_4",
      language: "en",
      tier: "A2",
      tierLabel: "A2 • Pre-Intermediate",
      xpReward: 25,
      category: "Speaking • Polite Requests",
      prompt: "Suhbatdoshdan sekinroq gapirishni muloyimlik bilan qanday so'raysiz?",
      options: [
        "Speak slow now!",
        "Could you please speak a little slower?",
        "Why you talk fast?",
        "Stop talking fast.",
      ],
      correctIndex: 1,
      explanation: "'Could you please...' — ingliz tilida eng muloyim iltimos shaklidir.",
    },
    // B1 Intermediate
    {
      id: "en_b1_1",
      language: "en",
      tier: "B1",
      tierLabel: "B1 • Intermediate",
      xpReward: 35,
      category: "Grammar • Present Perfect",
      prompt: "Bo'sh joyni to'ldiring: 'I ___ English for three years, and I love speaking it.'",
      options: ["learn", "learned", "have been learning", "am learn"],
      correctIndex: 2,
      explanation: "O'tmishda boshlanib hozirgacha davom etayotgan ish-harakat uchun Present Perfect Continuous ('have been learning') ishlatiladi.",
    },
    {
      id: "en_b1_2",
      language: "en",
      tier: "B1",
      tierLabel: "B1 • Intermediate",
      xpReward: 35,
      category: "Phrasal Verbs",
      prompt: "'Never give up on your dreams!' gapidagi 'give up' iborasining ma'nosi nima?",
      options: ["Boshlamoq", "Taslim bo'lmoq / voz kechmoq", "Tezlashtirmoq", "Unutmoq"],
      correctIndex: 1,
      explanation: "'Give up' — taslim bo'lmoq yoki biror ishni to'xtatib qo'ymoq degan ma'noni anglatadi.",
    },
    {
      id: "en_b1_3",
      language: "en",
      tier: "B1",
      tierLabel: "B1 • Intermediate",
      xpReward: 35,
      category: "Grammar • Second Conditional",
      prompt: "'If I ___ more free time, I would practice speaking every evening.'",
      options: ["have", "had", "will have", "would have"],
      correctIndex: 1,
      explanation: "Second Conditional'ning 'If' qismida Past Simple ('had') ishlatiladi.",
    },
    // B2 Upper-Intermediate
    {
      id: "en_b2_1",
      language: "en",
      tier: "B2",
      tierLabel: "B2 • Upper-Intermediate",
      xpReward: 45,
      category: "Idioms • Speaking",
      prompt: "'Break the ice' iborasi suhbatda qanday ma'noni bildiradi?",
      options: [
        "Muzni sindirib suv ichmoq",
        "Ilk noqulaylikni yo'qotib samimiy suhbat boshlamoq",
        "Suhbatni to'satdan to'xtatmoq",
        "Janjal chiqarmoq",
      ],
      correctIndex: 1,
      explanation: "'Break the ice' — notanishlar o'rtasidagi tortinchoqlikni yo'qotib, muloqotni boshlash.",
    },
    {
      id: "en_b2_2",
      language: "en",
      tier: "B2",
      tierLabel: "B2 • Upper-Intermediate",
      xpReward: 45,
      category: "Grammar • Passive Voice",
      prompt: "'The new speaking club schedule ___ by the organizers tomorrow.'",
      options: ["announces", "will be announced", "has announced", "is announcing"],
      correctIndex: 1,
      explanation: "Kelasi zamon majhul nisbat (Future Simple Passive): 'will be + V3 (announced)'.",
    },
    // C1 Advanced
    {
      id: "en_c1_1",
      language: "en",
      tier: "C1",
      tierLabel: "C1 • Advanced",
      xpReward: 60,
      category: "Advanced Grammar • Inversion",
      prompt: "'Not only ___ fluent in English, but she also speaks Korean effortlessly.'",
      options: ["she is", "is she", "she was", "does she"],
      correctIndex: 1,
      explanation: "'Not only' gap boshida kelganda inversiya qoidasi bo'yicha yordamchi fe'l egadan oldinga chiqadi: 'is she'.",
    },
    {
      id: "en_c1_2",
      language: "en",
      tier: "C1",
      tierLabel: "C1 • Advanced",
      xpReward: 60,
      category: "Academic Vocabulary",
      prompt: "'Eloquent' sifatining eng yaqin ma'nodoshini toping:",
      options: ["Articulate and persuasive in speaking", "Silent and reserved", "Hesitant", "Ordinary"],
      correctIndex: 0,
      explanation: "'Eloquent' — notiqlik mahorati yuqori, ravon va ta'sirchan gapiradigan degan ma'noni beradi.",
    },
  ],

  ru: [
    // A1
    {
      id: "ru_a1_1",
      language: "ru",
      tier: "A1",
      tierLabel: "A1 • Элементарный",
      xpReward: 20,
      category: "Грамматика • Род существительных",
      prompt: "To'g'ri olmoshni tanlang: 'Это ___ новая книга.'",
      options: ["мой", "моя", "моё", "мои"],
      correctIndex: 1,
      explanation: "'Книга' — женский род (ayol jinsi), shuning uchun 'моя' ishlatiladi.",
    },
    {
      id: "ru_a1_2",
      language: "ru",
      tier: "A1",
      tierLabel: "A1 • Элементарный",
      xpReward: 20,
      category: "Лексика • Приветствие",
      prompt: "Kechqurun salomlashganda rus tilida nima deyiladi?",
      options: ["Доброе утро", "Добрый день", "Добрый вечер", "Спокойной ночи"],
      correctIndex: 2,
      explanation: "'Добрый вечер' — Xayrli kech (salomlashish).",
    },
    {
      id: "ru_a1_3",
      language: "ru",
      tier: "A1",
      tierLabel: "A1 • Элементарный",
      xpReward: 20,
      category: "Спряжение глаголов",
      prompt: "Bo'sh joyni to'ldiring: 'Мы хорошо ___ по-русски.'",
      options: ["говорю", "говоришь", "говорим", "говорят"],
      correctIndex: 2,
      explanation: "'Мы' (biz) olmoshiga fe'lning '-им' qo'shimchasi mos keladi: 'мы говорим'.",
    },
    // A2
    {
      id: "ru_a2_1",
      language: "ru",
      tier: "A2",
      tierLabel: "A2 • Базовый",
      xpReward: 25,
      category: "Падежи • Предложный падеж",
      prompt: "'Мой друг живёт в ___ (Ташкент).'",
      options: ["Ташкент", "Ташкенте", "Ташкента", "Ташкентом"],
      correctIndex: 1,
      explanation: "'Где? В ком/чём?' savoliga Предложный падеж '-е' qo'shimchasi bilan javob beradi: 'в Ташкенте'.",
    },
    {
      id: "ru_a2_2",
      language: "ru",
      tier: "A2",
      tierLabel: "A2 • Базовый",
      xpReward: 25,
      category: "Глаголы движения",
      prompt: "'Вчера я ___ в библиотеку пешком.'",
      options: ["иду", "ходил", "еду", "ездил"],
      correctIndex: 1,
      explanation: "Piyoda ('пешком') va o'tgan zamonda ('вчера') borib kelganlikni 'ходил' fe'li ifodalaydi.",
    },
    {
      id: "ru_a2_3",
      language: "ru",
      tier: "A2",
      tierLabel: "A2 • Базовый",
      xpReward: 25,
      category: "Разговорная речь",
      prompt: "'Мне нужно практиковать разговорную речь' gapining tarjimasi qaysi?",
      options: [
        "Men kitob o'qishni yaxshi ko'raman",
        "Men og'zaki nutqni mashq qilishim kerak",
        "Men rus tilini bilmayman",
        "Menga lug'at kerak emas",
      ],
      correctIndex: 1,
      explanation: "'Практиковать разговорную речь' — og'zaki nutqni mashq qilmoq.",
    },
    // B1
    {
      id: "ru_b1_1",
      language: "ru",
      tier: "B1",
      tierLabel: "B1 • Средний",
      xpReward: 35,
      category: "Виды глагола (НСВ / СВ)",
      prompt: "'Наконец-то я ___ эту сложную задачу!'",
      options: ["решал", "решил", "решаю", "буду решать"],
      correctIndex: 1,
      explanation: "'Наконец-то' natijani bildirgani uchun тугалланган феъл тури (СВ) — 'решил' tanlanadi.",
    },
    {
      id: "ru_b1_2",
      language: "ru",
      tier: "B1",
      tierLabel: "B1 • Средний",
      xpReward: 35,
      category: "Управление глаголов",
      prompt: "'Я очень интересуюсь ___ (иностранные языки).'",
      options: [
        "иностранные языки",
        "иностранными языками",
        "иностранных языков",
        "иностранным языкам",
      ],
      correctIndex: 1,
      explanation: "'Интересоваться (чем?)' fe'li Творительный падеж talab qiladi: 'иностранными языками'.",
    },
    // B2
    {
      id: "ru_b2_1",
      language: "ru",
      tier: "B2",
      tierLabel: "B2 • Выше среднего",
      xpReward: 45,
      category: "Фразеологизмы",
      prompt: "'Найти общий язык' iborasining ma'nosi nima?",
      options: [
        "Yangi til o'ylab topmoq",
        "O'zaro til topishmoq, bir-birini tushunmoq",
        "Tarjimon yollamoq",
        "Bahslashmoq",
      ],
      correctIndex: 1,
      explanation: "'Найти общий язык' — suhbatdosh bilan o'zaro til topishmoq va kelishmoq.",
    },
    // C1
    {
      id: "ru_c1_1",
      language: "ru",
      tier: "C1",
      tierLabel: "C1 • Продвинутый",
      xpReward: 60,
      category: "Причастные и деепричастные обороты",
      prompt: "'___ с носителями языка каждый день, вы быстро преодолеете языковой барьер.'",
      options: ["Общавшийся", "Общаясь", "Пообщавшись вчера", "Общаемый"],
      correctIndex: 1,
      explanation: "'Общаясь' — hozirgi zamon ravishdoshi ('muloqot qilib / gaplashib turib').",
    },
  ],

  tr: [
    // A1
    {
      id: "tr_a1_1",
      language: "tr",
      tier: "A1",
      tierLabel: "A1 • Başlangıç",
      xpReward: 20,
      category: "Tanışma • Salomlashish",
      prompt: "'Memnun oldum' iborasi o'zbek tilida nimani anglatadi?",
      options: ["Xayr, ko'rishguncha", "Tanishganimdan xursandman", "Kechirasiz", "Tushunmadim"],
      correctIndex: 1,
      explanation: "'Memnun oldum' — Tanishganimdan xursandman.",
    },
    {
      id: "tr_a1_2",
      language: "tr",
      tier: "A1",
      tierLabel: "A1 • Başlangıç",
      xpReward: 20,
      category: "Çoğul Eki • Ko'plik qo'shimchasi",
      prompt: "Unlilar uyg'unligiga ko'ra 'Kitap' so'zining ko'plik shakli qanday bo'ladi?",
      options: ["Kitapler", "Kitaplar", "Kitablar", "Kitapları"],
      correctIndex: 1,
      explanation: "Oxirgi unli 'a' (qalin unli) bo'lgani uchun '-lar' qo'shiladi: 'Kitaplar'.",
    },
    {
      id: "tr_a1_3",
      language: "tr",
      tier: "A1",
      tierLabel: "A1 • Başlangıç",
      xpReward: 20,
      category: "Şimdiki Zaman",
      prompt: "Bo'sh joyni to'ldiring: 'Ben Türkçe ___ (o'rganmoqdaman).'",
      options: ["öğreniyorum", "öğreniyorsun", "öğreniyor", "öğreniyoruz"],
      correctIndex: 0,
      explanation: "'Ben' (Men) uchun hozirgi zamon qo'shimchasi '-iyorum': 'Ben Türkçe öğreniyorum'.",
    },
    // A2
    {
      id: "tr_a2_1",
      language: "tr",
      tier: "A2",
      tierLabel: "A2 • Temel",
      xpReward: 25,
      category: "Bulunma Hali (-da/-de/-ta/-te)",
      prompt: "'Biz şu anda ___ (park) konuşuyoruz.'",
      options: ["parkda", "parkta", "parkde", "parkte"],
      correctIndex: 1,
      explanation: "'k' jarangsiz undoshidan keyin 'd' tovushi 't' ga aylanadi (Fıstıkçı Şahap qoidasi): 'parkta'.",
    },
    {
      id: "tr_a2_2",
      language: "tr",
      tier: "A2",
      tierLabel: "A2 • Temel",
      xpReward: 25,
      category: "Geçmiş Zaman",
      prompt: "'Dün akşam arkadaşımla telefonda ___.'",
      options: ["konuşacağım", "konuştum", "konuşuyorum", "konuş말"],
      correctIndex: 1,
      explanation: "'Dün akşam' (kecha oqshom) o'tgan zamonni bildiradi: 'konuştum'.",
    },
    // B1
    {
      id: "tr_b1_1",
      language: "tr",
      tier: "B1",
      tierLabel: "B1 • Orta",
      xpReward: 35,
      category: "Gereklilik Kipi (-meli / -malı)",
      prompt: "'Daha akıcı konuşmak için her gün pratik ___.'",
      options: ["yapmalıyız", "yaptık", "yapıyorduk", "yapmışız"],
      correctIndex: 0,
      explanation: "'-malı/-meli' keraklilik maylini bildiradi: 'pratik yapmalıyız' (mashq qilishimiz kerak).",
    },
    {
      id: "tr_b1_2",
      language: "tr",
      tier: "B1",
      tierLabel: "B1 • Orta",
      xpReward: 35,
      category: "Zarf-Fiiller",
      prompt: "'Müzik ___ ders çalışmayı seviyorum.' (Musiqa tinglab dars qilishni yoqtiraman)",
      options: ["dinleyerek", "dinlemeden", "dinledikçe", "dinlese"],
      correctIndex: 0,
      explanation: "'-erek/-arak' qo'shimchasi bir ishni bajarib turib ikkinchisini qilishni anglatadi: 'dinleyerek'.",
    },
    // B2
    {
      id: "tr_b2_1",
      language: "tr",
      tier: "B2",
      tierLabel: "B2 • İleri Orta",
      xpReward: 45,
      category: "Deyimler • Iboralar",
      prompt: "Turk tilidagi 'Kulak misafiri olmak' iborasining ma'nosi nima?",
      options: [
        "Mehmonga bormoq",
        "Yonidagi suhbatni beixtiyor eshitib qolmoq",
        "Qo'shiq tinglamoq",
        "Maslahat bermoq",
      ],
      correctIndex: 1,
      explanation: "'Kulak misafiri olmak' — yaqin atrofdagi gap-so'zni beixtiyor eshitib qolmoq.",
    },
    // C1
    {
      id: "tr_c1_1",
      language: "tr",
      tier: "C1",
      tierLabel: "C1 • İleri",
      xpReward: 60,
      category: "Dolaylı Anlatım",
      prompt: "'Öğretmen, öğrencilerin düzenli pratik ___ başarının artacağını belirtti.'",
      options: ["yaptığında", "yapması halinde", "yaparken", "yapsa bile"],
      correctIndex: 1,
      explanation: "Rasmiy va akademik uslubda '...yapması halinde' (...qilgan taqdirda/holatda) keng qo'llaniladi.",
    },
  ],

  ko: [
    // A1
    {
      id: "ko_a1_1",
      language: "ko",
      tier: "A1",
      tierLabel: "A1 • TOPIK 1 (초급)",
      xpReward: 20,
      category: "인사 • Salomlashish",
      prompt: "Koreys tilida 'Rahmat' (muloyim shaklda) qanday aytiladi?",
      options: ["미안합니다 (Mianhamnida)", "감사합니다 (Gamsahamnida)", "괜찮아요 (Gwaenchanayo)", "잠시만요 (Jamsimanyo)"],
      correctIndex: 1,
      explanation: "'감사합니다 (Gamsahamnida)' — rasmiy va muloyim 'Rahmat' degani.",
    },
    {
      id: "ko_a1_2",
      language: "ko",
      tier: "A1",
      tierLabel: "A1 • TOPIK 1 (초급)",
      xpReward: 20,
      category: "조사 • Qo'shimchalar",
      prompt: "To'g'ri ega qo'shimchasini tanlang: '저___ 학생입니다.' (Men talabaman)",
      options: ["는", "은", "를", "에"],
      correctIndex: 0,
      explanation: "'저' (Jeo) unli tovush bilan tugagani uchun '는' (neun) qo'shiladi: '저는'.",
    },
    {
      id: "ko_a1_3",
      language: "ko",
      tier: "A1",
      tierLabel: "A1 • TOPIK 1 (초급)",
      xpReward: 20,
      category: "어휘 • Kundalik so'zlar",
      prompt: "'한국어를 공부해요' gapining ma'nosi nima?",
      options: [
        "Men Koreyaga boryapman",
        "Men koreys tilini o'rganyapman",
        "Men koreys taomini yeyapman",
        "Men kino ko'ryapman",
      ],
      correctIndex: 1,
      explanation: "'한국어' — koreys tili, '공부해요' — o'rganmoq / dars qilmoq.",
    },
    // A2
    {
      id: "ko_a2_1",
      language: "ko",
      tier: "A2",
      tierLabel: "A2 • TOPIK 2",
      xpReward: 25,
      category: "문법 • -고 싶다 (Xohlamoq)",
      prompt: "'친구와 같이 이야기___.' (Do'stim bilan birga suhbatlashishni xohlayman)",
      options: ["하고 싶어요", "했어요", "할 거예요", "하지 마세요"],
      correctIndex: 0,
      explanation: "Fe'l o'zagiga '-고 싶어요' qo'shilsa, '...qilishni xohlayman' ma'nosi chiqadi.",
    },
    {
      id: "ko_a2_2",
      language: "ko",
      tier: "A2",
      tierLabel: "A2 • TOPIK 2",
      xpReward: 25,
      category: "장소 조사 • 에 vs 에서",
      prompt: "'도서관___ 책을 읽어요.' (Kutubxonada kitob o'qiyman)",
      options: ["에", "에서", "으로", "하고"],
      correctIndex: 1,
      explanation: "Biror joyda faol harakat (kitob o'qish) bajarilsa, joy otiga '에서' qo'shiladi.",
    },
    // B1
    {
      id: "ko_b1_1",
      language: "ko",
      tier: "B1",
      tierLabel: "B1 • TOPIK 3 (중급)",
      xpReward: 35,
      category: "문법 • -(으)니까",
      prompt: "'매일 연습하___ 말하기 실력이 빨리 늘었어요.'",
      options: ["니까", "지만", "거나", "려고"],
      correctIndex: 0,
      explanation: "'-(으)니까' sabab-natija bog'lovchisi bo'lib, 'har kuni mashq qilganim uchun' ma'nosini beradi.",
    },
    // B2
    {
      id: "ko_b2_1",
      language: "ko",
      tier: "B2",
      tierLabel: "B2 • TOPIK 4 (중고급)",
      xpReward: 45,
      category: "관용표현 • Ibora",
      prompt: "Koreys tilidagi '입이 무겁다' (so'zma-so'z: og'zi og'ir) iborasining ma'nosi nima?",
      options: [
        "Juda kam ovqat yemoq",
        "Sir saqlay bilmoq (og'ziga mahkam bo'lmoq)",
        "Kasal bo'lib qolmoq",
        "Ko'p gapirmoq",
      ],
      correctIndex: 1,
      explanation: "'입이 무겁다' — birovning sirini oshkor qilmaydigan, ishonchli inson haqida aytiladi.",
    },
    // C1
    {
      id: "ko_c1_1",
      language: "ko",
      tier: "C1",
      tierLabel: "C1 • TOPIK 5-6 (고급)",
      xpReward: 60,
      category: "고급 문법 • -기 마련이다",
      prompt: "'꾸준히 노력하면 좋은 결과가 ___.' (Tinimsiz harakat qilinsa, yaxshi natija bo'lishi tabiiy/muqarrar)",
      options: ["나오기 마련이다", "나올 리가 없다", "나오지 않을 뿐더러", "나오는 둥 마는 둥 한다"],
      correctIndex: 0,
      explanation: "'-기 마련이다' — tabiiy qonuniyat yoki muqarrar natijani ifodalovchi yuqori daraja grammatik shakli.",
    },
  ],

  uz: [
    // A1
    {
      id: "uz_a1_1",
      language: "uz",
      tier: "A1",
      tierLabel: "A1 • Boshlang'ich",
      xpReward: 20,
      category: "Imlo va leksika",
      prompt: "Qaysi qatordagi so'z imlo qoidalariga ko'ra to'g'ri yozilgan?",
      options: ["Mas'uliyat", "Masuliyat", "Ma'suliyat", "Masulyat"],
      correctIndex: 0,
      explanation: "Arabcha o'zlashma bo'lgan bu so'z 'mas'uliyat' shaklida tutuq belgisi 's' harfidan keyin yoziladi.",
    },
    {
      id: "uz_a1_2",
      language: "uz",
      tier: "A1",
      tierLabel: "A1 • Boshlang'ich",
      xpReward: 20,
      category: "Nutq odobi",
      prompt: "Suhbatdoshning fikriga qo'shilmaslikni eng madaniyatli ifodalagan jumlani toping:",
      options: [
        "Siz umuman noto'g'ri gapiryapsiz!",
        "Fikringizni hurmat qilaman, biroq bu masalada boshqacharoq qarashdaman.",
        "Bu gapda mantiq yo'q.",
        "Jim turing, men aytaman.",
      ],
      correctIndex: 1,
      explanation: "Bahs madaniyatida avval suhbatdoshga hurmat bildirilib, so'ng shaxsiy fikr muloyim bayon etiladi.",
    },
    // A2
    {
      id: "uz_a2_1",
      language: "uz",
      tier: "A2",
      tierLabel: "A2 • Quyi o'rta",
      xpReward: 25,
      category: "Sinonimlar",
      prompt: "'Dilکش (yoqimli, go'zal)' so'ziga ma'nodosh bo'lgan qatorni belgilang:",
      options: ["Maftunkor, jozibali", "Dag'al, qo'pol", "G'amgin, ma'yus", "Shoshqaloq, hovliqma"],
      correctIndex: 0,
      explanation: "'Maftunkor, jozibali' so'zlari yoqimli va go'zal ma'nolarini beradi.",
    },
    {
      id: "uz_a2_2",
      language: "uz",
      tier: "A2",
      tierLabel: "A2 • Quyi o'rta",
      xpReward: 25,
      category: "Imlo qoidalari",
      prompt: "Quyidagi so'zlardan qaysi biri chiziqcha bilan yoziladi?",
      options: ["Do'stlik", "Baxt-saodat", "Kitobxon", "Hamkorlik"],
      correctIndex: 1,
      explanation: "Juft otlar ('baxt-saodat', 'ota-ona') orasiga chiziqcha qo'yib yoziladi.",
    },
    // B1
    {
      id: "uz_b1_1",
      language: "uz",
      tier: "B1",
      tierLabel: "B1 • O'rta daraja",
      xpReward: 35,
      category: "Frazeologiya • Iboralar",
      prompt: "'Do'ppisini osmonga otmoq' iborasining ma'nosi nima?",
      options: ["Qattiq jahli chiqmoq", "Behad sevinmoq, quvonmoq", "Shoshilib qolmoq", "Xafa bo'lmoq"],
      correctIndex: 1,
      explanation: "'Do'ppisini osmonga otmoq' — nihoyatda xursand bo'lmoq, quvonmoq.",
    },
    // B2
    {
      id: "uz_b2_1",
      language: "uz",
      tier: "B2",
      tierLabel: "B2 • Yuqori o'rta",
      xpReward: 45,
      category: "Paronimlar",
      prompt: "'Abzal' va 'Afzal' paronimlarining farqi qaysi javobda to'g'ri ko'rsatilgan?",
      options: [
        "Abzal — ot-ulov анжоми; Afzal — a'lo, ustun, yaxshiroq",
        "Ikkalasi bir xil ma'noni bildiradi",
        "Abzal — a'lo; Afzal — ot egar-jabdug'i",
        "Afzal so'zi adabiy tilda ishlatilmaydi",
      ],
      correctIndex: 0,
      explanation: "'Abzal' — ot-ulov jabdug'i, 'Afzal' esa ustun va a'lo degan ma'noni anglatadi.",
    },
    // C1
    {
      id: "uz_c1_1",
      language: "uz",
      tier: "C1",
      tierLabel: "C1 • Mukammal daraja",
      xpReward: 60,
      category: "Notiqlik san'ati va uslubiyat",
      prompt: "'Badiiy va publitsistik nutqda fikr ta'sirchanligini oshirish uchun javobi o'z ichida bo'lgan so'roq gap' nima deb ataladi?",
      options: ["Ritorik so'roq gap", "Undov gap", "Buyruq gap", "Kirish gap"],
      correctIndex: 0,
      explanation: "Javob talab qilmaydigan, tasdiq yoki inkor ma'nosini kuchli his-hayajon bilan ifodalaydigan gap 'ritorik so'roq gap' deyiladi.",
    },
  ],
};

function hashDateSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Savollar variantlarini (options) tasodifiy aralashtiradi va
 * ketma-ket savollarda to'g'ri javob bir xil o'rinda (masalan, faqat A yoki faqat B)
 * qolib ketmasligini ta'minlaydi. Har bir savolda to'g'ri javob turli xil pozitsiyalarda
 * (1-qator / 2-qator, chap / o'ng) dinamik almashib turadi.
 */
export function shuffleQuestionsWithVariedAnswers(
  questions: DailyTaskQuestion[],
  baseSeed?: string
): DailyTaskQuestion[] {
  let prevCorrectIndex = -1;

  return questions.map((q, qIdx) => {
    const originalOptions = q.options;
    const originalCorrectIdx = q.correctIndex;

    const items = originalOptions.map((text, idx) => ({
      text,
      isCorrect: idx === originalCorrectIdx,
    }));

    const shuffled = [...items];

    // Agar baseSeed berilgan bo'lsa (Kunlik topshiriqlar uchun) — kun davomida bir xil saqlanuvchi yuqori sifatli psevdo-tasodifiy generator
    // Agar berilmagan bo'lsa (Topshiriqli o'yin uchun) — har o'yin boshlanganda yangi Math.random()
    const rand = baseSeed
      ? mulberry32(hashDateSeed(`${baseSeed}_${q.id}_${qIdx}`))
      : Math.random;

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let curCorrect = shuffled.findIndex((item) => item.isCorrect);

    // Agar ketma-ket bir xil o'rinda chiqib qolsa (masalan, oldingi savolda ham shu indeks bo'lsa),
    // uni boshqa qatorga yoki ustunga swap qilamiz, shunda javoblar ketma-ket bir xil joyda turmaydi.
    if (curCorrect === prevCorrectIndex && shuffled.length > 1) {
      const shift = qIdx % 2 === 0 ? 2 : 1;
      const swapTarget = (curCorrect + shift) % shuffled.length;
      [shuffled[curCorrect], shuffled[swapTarget]] = [
        shuffled[swapTarget],
        shuffled[curCorrect],
      ];
      curCorrect = swapTarget;
    }

    prevCorrectIndex = curCorrect;

    return {
      ...q,
      options: shuffled.map((item) => item.text),
      correctIndex: curCorrect >= 0 ? curCorrect : 0,
    };
  });
}

/**
 * Har kuni sanaga qarab avtomatik almashadigan va foydalanuvchining
 * bajargan topshiriqlari soniga (`totalTasksCompleted`) qarab A1 -> A2 -> B1 -> B2 -> C1
 * darajalariga sekin-asta o'sib boradigan kunlik topshiriqlar ro'yxatini qaytaradi.
 */
export function getDailyTasksForUser(
  language: LanguageKey,
  dateStr: string,
  totalTasksCompleted = 0
): {
  tasks: DailyTaskQuestion[];
  activeTier: DifficultyTier;
  progressionTitle: string;
  progressionDescription: string;
} {
  const allForLang = TASKS_BANK[language] || TASKS_BANK.en;

  // Foydalanuvchi qancha ko'p topshiriq ishlagan bo'lsa, darajasi shuncha ohista ko'tariladi
  let activeTier: DifficultyTier = "A1";
  let allowedOrders = [1, 2]; // 1-kunlarda eng oson A1 va ozgina A2
  let progressionTitle = "1-bosqich: Elementary (Eng oson darajadan boshlash)";
  let progressionDescription =
    "Siz hozir boshlang'ich (A1–A2) bosqichdasiz. Har kuni topshiriqlarni bajarganingiz sari savollar sekin-asta qiyinlashib boradi.";

  if (totalTasksCompleted >= 24) {
    activeTier = "C1";
    allowedOrders = [3, 4, 5];
    progressionTitle = "5-bosqich: Advanced (C1 Yuqori daraja)";
    progressionDescription =
      "Ajoyib natija! Siz eng yuqori C1 Advanced darajadagi murakkab grammatika va notiqlik topshiriqlarini bajaryapsiz.";
  } else if (totalTasksCompleted >= 16) {
    activeTier = "B2";
    allowedOrders = [2, 3, 4, 5];
    progressionTitle = "4-bosqich: Upper-Intermediate (B2 Yuqori o'rta)";
    progressionDescription =
      "Darajangiz o'sib bormoqda! Bugungi topshiriqlar B1, B2 va C1 bosqichlarini o'z ichiga oladi.";
  } else if (totalTasksCompleted >= 9) {
    activeTier = "B1";
    allowedOrders = [1, 2, 3, 4];
    progressionTitle = "3-bosqich: Intermediate (B1 O'rta daraja)";
    progressionDescription =
      "Siz boshlang'ich bosqichni muvaffaqiyatli o'tdingiz. Endi o'rta darajadagi suhbat va grammatika savollari qo'shildi.";
  } else if (totalTasksCompleted >= 4) {
    activeTier = "A2";
    allowedOrders = [1, 2, 3];
    progressionTitle = "2-bosqich: Pre-Intermediate (A2 Quyi o'rta)";
    progressionDescription =
      "Kundan-kunga o'sish! Bugungi savollar oddiydan o'rta darajaga ohista o'tishga yordam beradi.";
  }

  // Sanaga bog'liq deterministic rotatsiya
  const seed = hashDateSeed(`${dateStr}_${language}`);

  const candidates = allForLang.filter((q) =>
    allowedOrders.includes(TIER_META[q.tier].order)
  );
  const pool = candidates.length >= 5 ? candidates : allForLang;

  // Har bir daraja ichida sanaga qarab aylantiramiz va osondan qiyinga qarab tartiblaymiz
  const rotated = [...pool].sort((a, b) => {
    const orderDiff = TIER_META[a.tier].order - TIER_META[b.tier].order;
    if (orderDiff !== 0) return orderDiff;
    const ha = hashDateSeed(`${seed}_${a.id}`);
    const hb = hashDateSeed(`${seed}_${b.id}`);
    return ha - hb;
  });

  // Kunlik 5 ta topshiriq (eng osondan boshlab o'sib boruvchi tartibda)
  const selected = rotated.slice(0, 5);

  // Variantlarni kunlik deterministik tartibda aralashtiramiz,
  // to'g'ri javob turli xil o'rinlarda (A, B, C, D) chiqadi
  const randomizedTasks = shuffleQuestionsWithVariedAnswers(
    selected,
    `${dateStr}_${language}`
  );

  return {
    tasks: randomizedTasks,
    activeTier,
    progressionTitle,
    progressionDescription,
  };
}

/**
 * "Topshiriqli o'yin" (Task Game) uchun 5 ta tildan tanlangan til bo'yicha
 * osondan qiyinga qarab tuzilgan o'yin savollari.
 * Javoblar har bir yangi o'yinda tasodifiy o'rinlarda (A, B, C, D) tarqatiladi.
 */
export function getTaskGameQuestions(language: LanguageKey): DailyTaskQuestion[] {
  const list = TASKS_BANK[language] || TASKS_BANK.en;
  const sorted = [...list].sort(
    (a, b) => TIER_META[a.tier].order - TIER_META[b.tier].order
  );
  return shuffleQuestionsWithVariedAnswers(sorted);
}
