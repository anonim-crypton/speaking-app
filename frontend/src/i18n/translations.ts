import extraLocales from "./locales";

export interface Translation {
  nav: {
    home: string;
    practice: string;
    community: string;
    about: string;
    login: string;
    register: string;
    dashboard: string;
    logout: string;
    language: string;
  };
  hero: {
    badge: string;
    welcome: string;
    heading: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    perks: { icon: "check" | "users" | "globe"; label: string }[];
  };
  mockup: {
    nav: {
      home: string;
      liveRooms: string;
      messages: string;
      community: string;
      courses: string;
      progress: string;
    };
    voiceChannels: string;
    channels: { name: string; count: number }[];
    letsSpeak: string;
    speaking: string;
    reactions: string[];
    friendsTitle: string;
    participants: { name: string }[];
  };
  features: {
    items: { icon: string; title: string; desc: string }[];
  };
  stats: {
    items: { icon: string; value: string; label: string; sub: string }[];
  };
  rooms: {
    title: string;
    subtitle: string;
    viewAll: string;
    live: string;
    items: { title: string; desc: string; tag: string; level: string; count: number }[];
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
    scriptA: string;
    scriptB: string;
    scriptC: string;
    scriptD: string;
  };
  footer: {
    tagline: string;
    columns: { title: string; links: string[] }[];
    newsletterTitle: string;
    newsletterSub: string;
    newsletterPlaceholder: string;
    copyright: string;
    bottomTagline: string;
    bottomRight: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    name: string;
    email: string;
    password: string;
    loginSubmit: string;
    registerSubmit: string;
    noAccount: string;
    haveAccount: string;
    back: string;
    errorGeneric: string;
  };
  dashboard: {
    welcome: string;
    subtitle: string;
    email: string;
    memberSince: string;
    start: string;
    logout: string;
    home: string;
    progress: string;
    lessons: string;
    minutes: string;
    streak: string;
  };
  common: {
    loading: string;
    required: string;
  };
  register: {
    nameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneHint: string;
    phoneOnlyNote: string;
    or: string;
    google: string;
    submit: string;
    haveAccount: string;
    loginLink: string;
  };
  login: {
    submit: string;
    noAccount: string;
    registerLink: string;
    or: string;
    google: string;
  };
  onboarding: {
    step: string;
    of: string;
    next: string;
    back: string;
    ageTitle: string;
    agePlaceholder: string;
    countryTitle: string;
    countryPlaceholder: string;
    purposeTitle: string;
    purposeFriends: string;
    purposeDating: string;
    purposeLanguage: string;
    genderTitle: string;
    genderMale: string;
    genderFemale: string;
    genderGay: string;
    genderUnspecified: string;
    saving: string;
    thanksTitle: string;
    thanksText: string;
    close: string;
    required: string;
  };
  account: {
    diamonds: string;
    profile: string;
    friends: string;
    history: string;
    help: string;
    settings: string;
    complaints: string;
    contactAdmin: string;
    logout: string;
  };
}

export const en: Translation = {
  nav: {
    home: "Home",
    practice: "Practice",
    community: "Community",
    about: "About",
    login: "Login",
    register: "Register",
    dashboard: "Dashboard",
    logout: "Log out",
    language: "Language",
  },
  hero: {
    badge: "Real people. Real conversations. A brighter you.",
    welcome: "Welcome to",
    heading: "Speak English with confidence in a real conversation community",
    description:
      "Practice speaking, join live rooms, improve your pronunciation, and connect with learners from around the world. Real people. Real conversations. Real progress.",
    ctaPrimary: "Start Speaking",
    ctaSecondary: "Join Community",
    perks: [
      { icon: "check", label: "Free to join" },
      { icon: "users", label: "Real conversations" },
      { icon: "globe", label: "Friendly global community" },
    ],
  },
  mockup: {
    nav: {
      home: "Home",
      liveRooms: "Live Rooms",
      messages: "Messages",
      community: "Community",
      courses: "Courses",
      progress: "My Progress",
    },
    voiceChannels: "Voice Channels",
    channels: [
      { name: "General", count: 128 },
      { name: "English Practice", count: 64 },
      { name: "IELTS Speaking", count: 32 },
      { name: "Casual Talk", count: 51 },
      { name: "Movie & Culture", count: 27 },
    ],
    letsSpeak: "Let's Speak!",
    speaking: "You are speaking...",
    reactions: ["Great pronunciation!", "That's a great point!", "I agree with you!"],
    friendsTitle: "Make new friends worldwide",
    participants: [{ name: "Alex" }, { name: "Yuna" }, { name: "Daniel" }, { name: "Sophie" }],
  },
  features: {
    items: [
      {
        icon: "mic",
        title: "Live Speaking Rooms",
        desc: "Join real-time voice rooms and practice with people around the world.",
      },
      {
        icon: "globe",
        title: "5 Language Servers",
        desc: "Connect instantly with speaking partners in Uzbek, English, Russian, Turkish, and Korean.",
      },
      {
        icon: "chart",
        title: "Daily Practice",
        desc: "Build a consistent habit with fun speaking challenges.",
      },
      {
        icon: "users",
        title: "Global Community",
        desc: "Meet friendly learners, make friends, and explore new cultures.",
      },
    ],
  },
  stats: {
    items: [
      { icon: "users", value: "10K+", label: "Active Learners", sub: "From 150+ countries" },
      { icon: "mic", value: "500+", label: "Speaking Rooms", sub: "New conversations every day" },
      {
        icon: "clock",
        value: "24/7",
        label: "Practice Available",
        sub: "Day or night, always someone to talk to",
      },
      {
        icon: "star",
        value: "4.9/5",
        label: "Community Rating",
        sub: "Loved by learners worldwide",
      },
    ],
  },
  rooms: {
    title: "Popular Speaking Rooms",
    subtitle: "Join a room and start a real conversation right now",
    viewAll: "View All Rooms",
    live: "LIVE",
    items: [
      {
        title: "Casual English Chat",
        desc: "Make friends & talk about anything",
        tag: "General",
        level: "All Levels",
        count: 128,
      },
      {
        title: "Travel & Culture",
        desc: "Talk about your country, trips and cultures",
        tag: "Travel",
        level: "Intermediate",
        count: 64,
      },
      {
        title: "Movie Talk",
        desc: "Discuss movies, series and pop culture",
        tag: "Entertainment",
        level: "All Levels",
        count: 52,
      },
      {
        title: "IELTS Speaking Practice",
        desc: "Get ready for your IELTS speaking test",
        tag: "IELTS",
        level: "Advanced",
        count: 38,
      },
    ],
  },
  cta: {
    title: "Be part of a global community",
    subtitle: "Improve your English. Meet amazing people. Open new opportunities.",
    button: "Create Your Account",
    scriptA: "Same",
    scriptB: "Language,",
    scriptC: "More Friends",
    scriptD: "A Brighter You",
  },
  footer: {
    tagline: "Real Conversations. A Brighter You.",
    columns: [
      {
        title: "Product",
        links: ["Courses", "Live Rooms", "Practice", "Progress"],
      },
      {
        title: "Community",
        links: ["Community Hub", "Events", "Leaderboard", "Become a Host"],
      },
      {
        title: "Support",
        links: ["Help Center", "Contact Us", "Feedback", "Community Guidelines"],
      },
      {
        title: "Legal",
        links: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Safety"],
      },
    ],
    newsletterTitle: "Get the latest updates",
    newsletterSub: "Join our newsletter for new features and events.",
    newsletterPlaceholder: "Enter your email",
    copyright: "All rights reserved.",
    bottomTagline: "Speak. Learn. Connect. Grow.",
    bottomRight: "A more open world through English.",
  },
  auth: {
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in and continue the conversation",
    registerTitle: "Create your account",
    registerSubtitle: "Free to join — ready in one minute",
    name: "Your name",
    email: "Email address",
    password: "Password",
    loginSubmit: "Login",
    registerSubmit: "Create account",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    back: "Back to home",
    errorGeneric: "Something went wrong",
  },
  dashboard: {
    welcome: "Welcome",
    subtitle: "Your personal speaking dashboard",
    email: "Email",
    memberSince: "Member since",
    start: "Start practicing",
    logout: "Log out",
    home: "Home",
    progress: "Your progress",
    lessons: "Lessons",
    minutes: "Minutes",
    streak: "Day streak",
  },
  common: {
    loading: "Loading...",
    required: "Please fill in all fields",
  },
  register: {
    nameLabel: "Your name",
    emailLabel: "Email address",
    passwordLabel: "Password",
    phoneLabel: "Phone number",
    phonePlaceholder: "90 123 45 67",
    phoneHint: "We will send a confirmation code to this number.",
    phoneOnlyNote:
      "In Uzbekistan and Kazakhstan you sign up with just your phone number.",
    or: "or",
    google: "Continue with Google",
    submit: "Create account",
    haveAccount: "Already have an account?",
    loginLink: "Login",
  },
  login: {
    submit: "Login",
    noAccount: "Don't have an account?",
    registerLink: "Register",
    or: "or",
    google: "Continue with Google",
  },
  onboarding: {
    step: "Step",
    of: "of",
    next: "Next",
    back: "Back",
    ageTitle: "How old are you?",
    agePlaceholder: "Your age",
    countryTitle: "Which country are you from?",
    countryPlaceholder: "Search for a country",
    purposeTitle: "Why did you join?",
    purposeFriends: "Make friends",
    purposeDating: "Meet people",
    purposeLanguage: "Learn a language",
    genderTitle: "What is your gender?",
    genderMale: "Male",
    genderFemale: "Female",
    genderGay: "Gay",
    genderUnspecified: "Prefer not to say",
    saving: "Saving your answers...",
    thanksTitle: "Thank you!",
    thanksText: "Thank you for answering our questions. Enjoy Lingo Speek!",
    close: "Close",
    required: "Please choose an option to continue",
  },
  account: {
    diamonds: "Diamonds collected",
    profile: "Profile",
    friends: "Friends",
    history: "Speaking history",
    help: "Help",
    settings: "Settings",
    complaints: "Complaints",
    contactAdmin: "Contact admin",
    logout: "Log out",
  },
};

export const uz: Translation = {
  nav: {
    home: "Bosh sahifa",
    practice: "Amaliyot",
    community: "Jamiyat",
    about: "Biz haqimizda",
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    dashboard: "Kabinet",
    logout: "Chiqish",
    language: "Til",
  },
  hero: {
    badge: "Haqiqiy odamlar. Haqiqiy suhbatlar. Yorqinroq siz.",
    welcome: "Xush kelibsiz",
    heading: "Haqiqiy suhbat jamiyatida ingliz tilida ishonch bilan gaplashing",
    description:
      "Gapirishni mashq qiling, jonli xonalarga qo'shiling, talaffuzingizni yaxshilang va dunyoning turli burchaklaridagi o'quvchilar bilan bog'laning. Haqiqiy odamlar. Haqiqiy suhbatlar. Haqiqiy natija.",
    ctaPrimary: "Gaplashishni boshlash",
    ctaSecondary: "Jamiyatga qo'shilish",
    perks: [
      { icon: "check", label: "Bepul qo'shilish" },
      { icon: "users", label: "Haqiqiy suhbatlar" },
      { icon: "globe", label: "Do'stona global jamiyat" },
    ],
  },
  mockup: {
    nav: {
      home: "Bosh sahifa",
      liveRooms: "Jonli xonalar",
      messages: "Xabarlar",
      community: "Jamiyat",
      courses: "Kurslar",
      progress: "Natijalarim",
    },
    voiceChannels: "Ovozli kanallar",
    channels: [
      { name: "Umumiy", count: 128 },
      { name: "Ingliz tili amaliyoti", count: 64 },
      { name: "IELTS Speaking", count: 32 },
      { name: "Erkin suhbat", count: 51 },
      { name: "Kino va madaniyat", count: 27 },
    ],
    letsSpeak: "Gaplashamiz!",
    speaking: "Siz gapiryapsiz...",
    reactions: ["Ajoyib talaffuz!", "Bu juda yaxshi fikr!", "Sizga qo'shilaman!"],
    friendsTitle: "Dunyo bo'ylab yangi do'stlar toping",
    participants: [{ name: "Alex" }, { name: "Yuna" }, { name: "Daniel" }, { name: "Sophie" }],
  },
  features: {
    items: [
      {
        icon: "mic",
        title: "Jonli suhbat xonalari",
        desc: "Real vaqtda ovozli xonalarga qo'shiling va dunyo bo'ylab odamlar bilan mashq qiling.",
      },
      {
        icon: "globe",
        title: "5 xil tilda muloqot",
        desc: "O'zbek, Ingliz, Rus, Turk va Koreys tillaridagi maxsus xonalarda suhbatdosh toping.",
      },
      {
        icon: "chart",
        title: "Kundalik amaliyot",
        desc: "Qiziqarli gaplashish mashqlari bilan barqaror odat shakllantiring.",
      },
      {
        icon: "users",
        title: "Global jamiyat",
        desc: "Do'stona o'quvchilar bilan tanishing, do'stlar orttiring va yangi madaniyatlarni kashf eting.",
      },
    ],
  },
  stats: {
    items: [
      { icon: "users", value: "10K+", label: "Faol o'quvchilar", sub: "150+ davlatdan" },
      { icon: "mic", value: "500+", label: "Suhbat xonalari", sub: "Har kuni yangi suhbatlar" },
      {
        icon: "clock",
        value: "24/7",
        label: "Amaliyot mavjud",
        sub: "Kunduzi ham, kechasi ham suhbatdosh bor",
      },
      {
        icon: "star",
        value: "4.9/5",
        label: "Jamiyat reytingi",
        sub: "Dunyo bo'ylab o'quvchilar sevgan",
      },
    ],
  },
  rooms: {
    title: "Mashhur suhbat xonalari",
    subtitle: "Xonaga qo'shiling va hoziroq haqiqiy suhbatni boshlang",
    viewAll: "Barcha xonalar",
    live: "JONLI",
    items: [
      {
        title: "Erkin inglizcha suhbat",
        desc: "Do'stlar orttiring va hamma narsa haqida gaplashing",
        tag: "Umumiy",
        level: "Barcha darajalar",
        count: 128,
      },
      {
        title: "Sayohat va madaniyat",
        desc: "Yurtingiz, sayohatlaringiz va madaniyatlar haqida gaplashing",
        tag: "Sayohat",
        level: "O'rta",
        count: 64,
      },
      {
        title: "Kino suhbati",
        desc: "Filmlar, seriallar va pop madaniyat haqida suhbatlashing",
        tag: "Ko'ngilochar",
        level: "Barcha darajalar",
        count: 52,
      },
      {
        title: "IELTS Speaking amaliyoti",
        desc: "IELTS speaking imtihoniga tayyorlaning",
        tag: "IELTS",
        level: "Ilg'or",
        count: 38,
      },
    ],
  },
  cta: {
    title: "Global jamiyatning bir qismi bo'ling",
    subtitle: "Ingliz tilini yaxshilang. Ajoyib odamlar bilan tanishing. Yangi imkoniyatlar oching.",
    button: "Hisob yaratish",
    scriptA: "Bir",
    scriptB: "Til,",
    scriptC: "Ko'proq Do'stlar",
    scriptD: "Yorqinroq Siz",
  },
  footer: {
    tagline: "Haqiqiy suhbatlar. Yorqinroq siz.",
    columns: [
      {
        title: "Mahsulot",
        links: ["Kurslar", "Jonli xonalar", "Amaliyot", "Natijalar"],
      },
      {
        title: "Jamiyat",
        links: ["Jamiyat markazi", "Tadbirlar", "Reyting", "Boshlovchi bo'lish"],
      },
      {
        title: "Yordam",
        links: ["Yordam markazi", "Bog'lanish", "Fikr-mulohaza", "Jamiyat qoidalari"],
      },
      {
        title: "Huquqiy",
        links: ["Foydalanish shartlari", "Maxfiylik siyosati", "Cookie siyosati", "Xavfsizlik"],
      },
    ],
    newsletterTitle: "So'nggi yangiliklardan xabardor bo'ling",
    newsletterSub: "Yangi funksiyalar va tadbirlar uchun yangiliklarimizga obuna bo'ling.",
    newsletterPlaceholder: "Email manzilingiz",
    copyright: "Barcha huquqlar himoyalangan.",
    bottomTagline: "Gapiring. O'rganing. Bog'laning. O'sing.",
    bottomRight: "Ingliz tili orqali yanada ochiq dunyo.",
  },
  auth: {
    loginTitle: "Xush kelibsiz",
    loginSubtitle: "Hisobingizga kiring va suhbatni davom ettiring",
    registerTitle: "Hisob yarating",
    registerSubtitle: "Bepul qo'shiling — bir daqiqada tayyor",
    name: "Ismingiz",
    email: "Email manzil",
    password: "Parol",
    loginSubmit: "Kirish",
    registerSubmit: "Hisob yaratish",
    noAccount: "Hisobingiz yo'qmi?",
    haveAccount: "Hisobingiz bormi?",
    back: "Bosh sahifaga qaytish",
    errorGeneric: "Xatolik yuz berdi",
  },
  dashboard: {
    welcome: "Xush kelibsiz",
    subtitle: "Shaxsiy gaplashish kabinetingiz",
    email: "Email",
    memberSince: "A'zo bo'lgan sana",
    start: "Amaliyotni boshlash",
    logout: "Chiqish",
    home: "Bosh sahifa",
    progress: "Sizning taraqqiyotingiz",
    lessons: "Darslar",
    minutes: "Daqiqa",
    streak: "Kunlik seriya",
  },
  common: {
    loading: "Yuklanmoqda...",
    required: "Iltimos, barcha maydonlarni to'ldiring",
  },
  register: {
    nameLabel: "Ismingiz",
    emailLabel: "Email manzil",
    passwordLabel: "Parol",
    phoneLabel: "Telefon raqam",
    phonePlaceholder: "90 123 45 67",
    phoneHint: "Bu raqamga tasdiqlash kodi yuboriladi.",
    phoneOnlyNote: "O'zbekiston va Qozog'istonda faqat telefon raqam bilan ro'yxatdan o'tiladi.",
    or: "yoki",
    google: "Google orqali kirish",
    submit: "Hisob yaratish",
    haveAccount: "Hisobingiz bormi?",
    loginLink: "Kirish",
  },
  login: {
    submit: "Kirish",
    noAccount: "Hisobingiz yo'qmi?",
    registerLink: "Ro'yxatdan o'tish",
    or: "yoki",
    google: "Google orqali kirish",
  },
  onboarding: {
    step: "Savol",
    of: "/",
    next: "Keyingisi",
    back: "Orqaga",
    ageTitle: "Yoshingiz nechida?",
    agePlaceholder: "Yoshingizni kiriting",
    countryTitle: "Davlatingizni tanlang",
    countryPlaceholder: "Davlat nomini qidiring...",
    purposeTitle: "Bu saytga nima uchun kirdingiz?",
    purposeFriends: "Do'stlar orttirish",
    purposeDating: "Tanishish",
    purposeLanguage: "Til o'rganish",
    genderTitle: "Gender (jinsi)",
    genderMale: "Erkak",
    genderFemale: "Ayol",
    genderGay: "Gey",
    genderUnspecified: "Taqdim etmayman",
    saving: "Javoblaringiz saqlanmoqda...",
    thanksTitle: "Rahmat!",
    thanksText: "Savolimizga javob berganingiz uchun rahmat",
    close: "Yopish",
    required: "Davom etish uchun bitta variantni tanlang",
  },
  account: {
    diamonds: "Yig'ilgan olmoslar",
    profile: "Profil",
    friends: "Do'stlar",
    history: "Gaplashish tarixi",
    help: "Yordam",
    settings: "Sozlamalar",
    complaints: "Shikoyat bo'limi",
    contactAdmin: "Admin bilan bog'lanish",
    logout: "Hisobdan chiqish",
  },
};

export const ru: Translation = {
  nav: {
    home: "Главная",
    practice: "Практика",
    community: "Сообщество",
    about: "О нас",
    login: "Вход",
    register: "Регистрация",
    dashboard: "Кабинет",
    logout: "Выйти",
    language: "Язык",
  },
  hero: {
    badge: "Реальные люди. Реальные разговоры. Лучшая версия вас.",
    welcome: "Добро пожаловать в",
    heading: "Говорите по-английски уверенно в сообществе живого общения",
    description:
      "Практикуйте речь, заходите в живые комнаты, улучшайте произношение и общайтесь с учениками со всего мира. Реальные люди. Реальные разговоры. Реальный прогресс.",
    ctaPrimary: "Начать говорить",
    ctaSecondary: "В сообщество",
    perks: [
      { icon: "check", label: "Бесплатное участие" },
      { icon: "users", label: "Живые разговоры" },
      { icon: "globe", label: "Дружное мировое сообщество" },
    ],
  },
  mockup: {
    nav: {
      home: "Главная",
      liveRooms: "Живые комнаты",
      messages: "Сообщения",
      community: "Сообщество",
      courses: "Курсы",
      progress: "Мой прогресс",
    },
    voiceChannels: "Голосовые каналы",
    channels: [
      { name: "Общий", count: 128 },
      { name: "Практика английского", count: 64 },
      { name: "IELTS Speaking", count: 32 },
      { name: "Свободный разговор", count: 51 },
      { name: "Кино и культура", count: 27 },
    ],
    letsSpeak: "Давайте говорить!",
    speaking: "Вы говорите...",
    reactions: ["Отличное произношение!", "Отличная мысль!", "Я согласен с вами!"],
    friendsTitle: "Найдите новых друзей по всему миру",
    participants: [{ name: "Alex" }, { name: "Yuna" }, { name: "Daniel" }, { name: "Sophie" }],
  },
  features: {
    items: [
      {
        icon: "mic",
        title: "Живые разговорные комнаты",
        desc: "Заходите в голосовые комнаты и практикуйтесь с людьми со всего мира.",
      },
      {
        icon: "globe",
        title: "Общение на 5 языках",
        desc: "Находите собеседников в отдельных комнатах на узбекском, английском, русском, турецком и корейском.",
      },
      {
        icon: "chart",
        title: "Ежедневная практика",
        desc: "Формируйте привычку с интересными разговорными заданиями.",
      },
      {
        icon: "users",
        title: "Мировое сообщество",
        desc: "Знакомьтесь с учениками, заводите друзей и открывайте новые культуры.",
      },
    ],
  },
  stats: {
    items: [
      { icon: "users", value: "10K+", label: "Активных учеников", sub: "Из 150+ стран" },
      { icon: "mic", value: "500+", label: "Разговорных комнат", sub: "Новые беседы каждый день" },
      {
        icon: "clock",
        value: "24/7",
        label: "Практика доступна",
        sub: "Днём и ночью всегда есть собеседник",
      },
      {
        icon: "star",
        value: "4.9/5",
        label: "Рейтинг сообщества",
        sub: "Любимо учениками по всему миру",
      },
    ],
  },
  rooms: {
    title: "Популярные разговорные комнаты",
    subtitle: "Заходите в комнату и начинайте настоящий разговор прямо сейчас",
    viewAll: "Все комнаты",
    live: "В ЭФИРЕ",
    items: [
      {
        title: "Свободное общение на английском",
        desc: "Заводите друзей и говорите о чём угодно",
        tag: "Общее",
        level: "Все уровни",
        count: 128,
      },
      {
        title: "Путешествия и культура",
        desc: "Расскажите о своей стране, поездках и культурах",
        tag: "Путешествия",
        level: "Средний",
        count: 64,
      },
      {
        title: "Разговоры о кино",
        desc: "Обсуждайте фильмы, сериалы и поп-культуру",
        tag: "Развлечения",
        level: "Все уровни",
        count: 52,
      },
      {
        title: "Практика IELTS Speaking",
        desc: "Подготовьтесь к устной части IELTS",
        tag: "IELTS",
        level: "Продвинутый",
        count: 38,
      },
    ],
  },
  cta: {
    title: "Станьте частью мирового сообщества",
    subtitle: "Улучшайте английский. Знакомьтесь с классными людьми. Открывайте новые возможности.",
    button: "Создать аккаунт",
    scriptA: "Один",
    scriptB: "Язык,",
    scriptC: "Больше Друзей",
    scriptD: "Лучшая Версия Вас",
  },
  footer: {
    tagline: "Живые разговоры. Лучшая версия вас.",
    columns: [
      {
        title: "Продукт",
        links: ["Курсы", "Живые комнаты", "Практика", "Прогресс"],
      },
      {
        title: "Сообщество",
        links: ["Центр сообщества", "События", "Рейтинг", "Стать хостом"],
      },
      {
        title: "Поддержка",
        links: ["Центр помощи", "Связаться с нами", "Обратная связь", "Правила сообщества"],
      },
      {
        title: "Правовое",
        links: ["Условия использования", "Политика конфиденциальности", "Cookie", "Безопасность"],
      },
    ],
    newsletterTitle: "Получайте последние новости",
    newsletterSub: "Подпишитесь на новости о новых функциях и событиях.",
    newsletterPlaceholder: "Введите ваш email",
    copyright: "Все права защищены.",
    bottomTagline: "Говори. Учись. Общайся. Расти.",
    bottomRight: "Более открытый мир через английский.",
  },
  auth: {
    loginTitle: "С возвращением",
    loginSubtitle: "Войдите и продолжите общение",
    registerTitle: "Создайте аккаунт",
    registerSubtitle: "Бесплатно — готово за минуту",
    name: "Ваше имя",
    email: "Email адрес",
    password: "Пароль",
    loginSubmit: "Войти",
    registerSubmit: "Создать аккаунт",
    noAccount: "Нет аккаунта?",
    haveAccount: "Уже есть аккаунт?",
    back: "На главную",
    errorGeneric: "Что-то пошло не так",
  },
  dashboard: {
    welcome: "Добро пожаловать",
    subtitle: "Ваш личный кабинет практики",
    email: "Email",
    memberSince: "Дата регистрации",
    start: "Начать практику",
    logout: "Выйти",
    home: "На главную",
    progress: "Ваш прогресс",
    lessons: "Уроки",
    minutes: "Минуты",
    streak: "Дней подряд",
  },
  common: {
    loading: "Загрузка...",
    required: "Пожалуйста, заполните все поля",
  },
  register: {
    nameLabel: "Ваше имя",
    emailLabel: "Email адрес",
    passwordLabel: "Пароль",
    phoneLabel: "Номер телефона",
    phonePlaceholder: "90 123 45 67",
    phoneHint: "Мы отправим код подтверждения на этот номер.",
    phoneOnlyNote:
      "В Узбекистане и Казахстане регистрация проходит только по номеру телефона.",
    or: "или",
    google: "Продолжить с Google",
    submit: "Создать аккаунт",
    haveAccount: "Уже есть аккаунт?",
    loginLink: "Войти",
  },
  login: {
    submit: "Войти",
    noAccount: "Нет аккаунта?",
    registerLink: "Регистрация",
    or: "или",
    google: "Продолжить с Google",
  },
  onboarding: {
    step: "Шаг",
    of: "из",
    next: "Далее",
    back: "Назад",
    ageTitle: "Сколько вам лет?",
    agePlaceholder: "Ваш возраст",
    countryTitle: "Из какой вы страны?",
    countryPlaceholder: "Поиск страны",
    purposeTitle: "Зачем вы здесь?",
    purposeFriends: "Найти друзей",
    purposeDating: "Познакомиться",
    purposeLanguage: "Учить язык",
    genderTitle: "Ваш пол?",
    genderMale: "Мужчина",
    genderFemale: "Женщина",
    genderGay: "Гей",
    genderUnspecified: "Не указывать",
    saving: "Сохраняем ваши ответы...",
    thanksTitle: "Спасибо!",
    thanksText: "Спасибо за ответы на наши вопросы. Приятного общения в Lingo Speek!",
    close: "Закрыть",
    required: "Выберите вариант, чтобы продолжить",
  },
  account: {
    diamonds: "Собранные алмазы",
    profile: "Профиль",
    friends: "Друзья",
    history: "История разговоров",
    help: "Помощь",
    settings: "Настройки",
    complaints: "Жалобы",
    contactAdmin: "Связаться с админом",
    logout: "Выйти из аккаунта",
  },
};

export const translations: Record<string, Translation> = {
  en,
  uz,
  ru,
  ...extraLocales,
};

/** Any BCP-47-ish code; only en/uz/ru have full UI translations. */
export type LangCode = string;

export interface LangOption {
  code: string;
  /** Native language name. */
  label: string;
  /** Short code shown in the trigger button. */
  short: string;
  /** ISO 3166-1 alpha-2 code used to draw the SVG flag. */
  country: string;
  /** Whether this language has a full UI translation. */
  translated: boolean;
}

/** 24 languages, each rendered with its own inline SVG flag. */
export const LANGS: LangOption[] = [
  { code: "uz", label: "O'zbekcha", short: "UZ", country: "UZ", translated: true },
  { code: "en", label: "English", short: "EN", country: "GB", translated: true },
  { code: "ru", label: "Русский", short: "RU", country: "RU", translated: true },
  { code: "tr", label: "Türkçe", short: "TR", country: "TR", translated: true },
  { code: "de", label: "Deutsch", short: "DE", country: "DE", translated: true },
  { code: "fr", label: "Français", short: "FR", country: "FR", translated: true },
  { code: "es", label: "Español", short: "ES", country: "ES", translated: true },
  { code: "it", label: "Italiano", short: "IT", country: "IT", translated: true },
  { code: "pt", label: "Português", short: "PT", country: "PT", translated: true },
  { code: "ar", label: "العربية", short: "AR", country: "SA", translated: true },
  { code: "fa", label: "فارسی", short: "FA", country: "IR", translated: true },
  { code: "zh", label: "中文", short: "ZH", country: "CN", translated: true },
  { code: "ja", label: "日本語", short: "JA", country: "JP", translated: true },
  { code: "ko", label: "한국어", short: "KO", country: "KR", translated: true },
  { code: "hi", label: "हिन्दी", short: "HI", country: "IN", translated: true },
  { code: "kk", label: "Қазақша", short: "KK", country: "KZ", translated: true },
  { code: "ky", label: "Кыргызча", short: "KY", country: "KG", translated: true },
  { code: "tg", label: "Тоҷикӣ", short: "TG", country: "TJ", translated: true },
  { code: "tk", label: "Türkmençe", short: "TK", country: "TM", translated: true },
  { code: "az", label: "Azərbaycan", short: "AZ", country: "AZ", translated: true },
  { code: "nl", label: "Nederlands", short: "NL", country: "NL", translated: true },
  { code: "pl", label: "Polski", short: "PL", country: "PL", translated: true },
  { code: "uk", label: "Українська", short: "UK", country: "UA", translated: true },
  { code: "id", label: "Bahasa Indonesia", short: "ID", country: "ID", translated: true },
];

export const BRAND = "Lingo Speek";
