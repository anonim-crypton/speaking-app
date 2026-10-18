export interface DashboardTranslation {
  sidebar: {
    home: string;
    speaking?: string;
    club?: string;
    dailyTasks?: string;
    taskGame?: string;
    books?: string;
    platform?: string;
    exercises: string;
    history: string;
    friends: string;
    messages?: string;
    rating: string;
    achievements: string;
    settings: string;
    devices: string;
    help: string;
    feedback: string;
    profile: string;
    premium: string;
    premiumDesc: string;
    logout: string;
  };
  topbar: {
    online: string;
    usersOnline: string;
    notifications: string;
  };
  welcome: {
    greeting: string;
    question: string;
    description: string;
    quoteA: string;
    quoteB: string;
  };
  stats: {
    streak: string;
    days: string;
    talkTime: string;
    hours: string;
    rank: string;
    rankValue: string;
  };
  start: {
    chooseLanguage: string;
    selected: string;
    searching: string;
    waitingQueue: string;
    cancelSearch: string;
    startBtn: string;
    cancelBtn: string;
    ruleWarning: string;
  };
  reward: {
    dailyTitle: string;
    dailyDesc: string;
    claimBtn: string;
    claiming?: string;
    claimed: string;
    balance: string;
    topUp: string;
    buyPremium: string;
  };
  meeting: {
    you: string;
    partner: string;
    turnMicOn: string;
    turnMicOff: string;
    chatTitle: string;
    chatWith: string;
    typeMessage: string;
    send: string;
    endCall: string;
    confirmEndTitle: string;
    confirmEndDesc: string;
    yes: string;
    no: string;
    complaintTitle: string;
    complaintSubmit: string;
    skip?: string;
  };
  profile: {
    diamonds: string;
    streak: string;
    rank: string;
    sectionsTitle: string;
    ratingTitle: string;
    ratingDesc: string;
    achievementsTitle: string;
    achievementsDesc: string;
    settingsTitle: string;
    settingsDesc: string;
    helpTitle: string;
    helpDesc: string;
    feedbackTitle: string;
    feedbackDesc: string;
    appLanguage: string;
    appLanguageDesc: string;
    supportTitle: string;
    supportDesc: string;
    logoutTitle: string;
    logoutDesc: string;
  };
  exercises: {
    title: string;
    subtitle: string;
    startBtn: string;
    dailyTopics: string;
    dailyTopicsDesc: string;
    vocab: string;
    vocabDesc: string;
    pronounce: string;
    pronounceDesc: string;
    dialogue: string;
    dialogueDesc: string;
  };
  friends: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDesc: string;
    startMeeting: string;
  };
  rating: {
    title: string;
    subtitle: string;
    yourResult: string;
    talkedTime: string;
  };
  achievements: {
    title: string;
    subtitle: string;
    firstStep: string;
    firstStepDesc: string;
    streak7: string;
    streak7Desc: string;
    polyglot: string;
    polyglotDesc: string;
    diamondMaster: string;
    diamondMasterDesc: string;
  };
  settings: {
    title: string;
    subtitle: string;
    mic: string;
    micDesc: string;
    micStatus: string;
    notifications: string;
    notificationsDesc: string;
    notificationsStatus: string;
    language: string;
    languageDesc: string;
    security: string;
    securityDesc: string;
    securityStatus: string;
  };
  help: {
    title: string;
    subtitle: string;
    faqs: { q: string; a: string }[];
  };
  feedback: {
    title: string;
    subtitle: string;
    label: string;
    placeholder: string;
    submit: string;
    successTitle: string;
    successDesc: string;
    newFeedback: string;
  };
}

export const DASHBOARD_TRANSLATIONS: Record<string, DashboardTranslation> = {
  uz: {
    sidebar: {
      home: "Speaking",
      speaking: "Speaking",
      club: "Klub",
      dailyTasks: "Kunlik topshiriqlar",
      taskGame: "Topshiriqli o'yin",
      books: "Foydali kitoblar",
      platform: "Platforma",
      exercises: "Mening tarixim",
      history: "Mening tarixim",
      friends: "Do'stlar",
      messages: "Xabarlar",
      rating: "Reyting",
      achievements: "Yutuqlar",
      settings: "Sozlamalar",
      devices: "Qurilmalarim",
      help: "Yordam",
      feedback: "Shikoyat / Taklif",
      profile: "Profil",
      premium: "Premium xarid qilish",
      premiumDesc: "Cheksiz muloqot va barcha tillar",
      logout: "Hisobdan chiqish",
    },
    topbar: {
      online: "onlayn",
      usersOnline: "ta foydalanuvchi onlayn",
      notifications: "Bildirishnomalar",
    },
    welcome: {
      greeting: "Assalomu alaykum",
      question: "Qaysi tilda gaplashishni xohlaysiz?",
      description: "O'zingizga mos tildagi suhbatdoshni tanlang va darhol jonli muloqotni boshlang.",
      quoteA: "Yangi odamlar bilan tanishing,",
      quoteB: "yangi tillar o'rganing!",
    },
    stats: {
      streak: "Ketma-ket kunlar",
      days: "kun",
      talkTime: "So'zlashilgan vaqt",
      hours: "soat",
      rank: "O'rningiz",
      rankValue: "1-o'rin",
    },
    start: {
      chooseLanguage: "Gaplashmoqchi bo'lgan tilingizni tanlang",
      selected: "Tanlangan til",
      searching: "Suhbatdosh qidirilmoqda...",
      waitingQueue: "Jonli ovozli suhbat uchun sherik izlanmoqda",
      cancelSearch: "Qidiruvni bekor qilish",
      startBtn: "START",
      cancelBtn: "BEKOR QILISH",
      ruleWarning: "Hurmatsizlik va haqoratli so'zlar qat'iyan man etiladi.",
    },
    reward: {
      dailyTitle: "Kunlik olmos mukofoti",
      dailyDesc: "Har kuni kirib, 5 ta bepul olmos oling!",
      claimBtn: "5 ta olmosni olish",
      claiming: "Olinmoqda...",
      claimed: "Bugungi olindi",
      balance: "Balans",
      topUp: "Hisobni to'ldirish",
      buyPremium: "Premium xarid qilish",
    },
    meeting: {
      you: "Siz",
      partner: "Sherik",
      turnMicOn: "Mikrofonni yoqish",
      turnMicOff: "Mikrofonni o'chirish",
      chatTitle: "Jonli yozishma",
      chatWith: "Jonli yozishma",
      typeMessage: "Xabaringizni yozing...",
      send: "Yuborish",
      endCall: "Suhbatni tugatish",
      confirmEndTitle: "Rostdan ham suhbatni tugatmoqchimisiz?",
      confirmEndDesc: "Suhbat tugatilsa, joriy xona yopiladi va barcha yozishmalar tozalanadi.",
      yes: "Ha",
      no: "Yo'q",
      complaintTitle: "Shikoyat bildirish",
      complaintSubmit: "Shikoyat yuborish",
      skip: "O'tkazib yuborish",
    },
    profile: {
      diamonds: "Olmoslar",
      streak: "Streak",
      rank: "O'rningiz",
      sectionsTitle: "Ilova bo'limlari va sozlamalar",
      ratingTitle: "Reyting jadvali",
      ratingDesc: "Eng faol foydalanuvchilar bilan bellashing",
      achievementsTitle: "Yutuqlar va medallar",
      achievementsDesc: "Erishilgan marralar va nishonlar",
      settingsTitle: "Sozlamalar",
      settingsDesc: "Mikrofon, bildirishnomalar va xavfsizlik",
      helpTitle: "Yordam markazi (FAQ)",
      helpDesc: "Savollar, ko'rsatmalar va qo'llab-quvvatlash",
      feedbackTitle: "Shikoyat va Taklif",
      feedbackDesc: "Takliflaringiz yoki muammolarni yuboring",
      appLanguage: "Ilova tili",
      appLanguageDesc: "Interfeys tilini tanlang",
      supportTitle: "Admin bilan bog'lanish",
      supportDesc: "Telegram orqali tezkor yordam",
      logoutTitle: "Hisobdan chiqish",
      logoutDesc: "Tizimdan xavfsiz chiqish",
    },
    exercises: {
      title: "Mening mashqlarim",
      subtitle: "So'zlashuv va nutq ko'nikmalarini oshirish mashqlari",
      startBtn: "Mashqni boshlash",
      dailyTopics: "Kundalik mavzular",
      dailyTopicsDesc: "Sayohat, IT, Ish, Do'stlik va Madaniyat mavzularida so'zlashuvlar",
      vocab: "Lug'at boyligi",
      vocabDesc: "Eng ko'p qo'llaniladigan 500 ta ibora va so'zlar to'plami",
      pronounce: "Talaffuz testi",
      pronounceDesc: "Mikrofon orqali talaffuz aniqligini tekshirish va baholash",
      dialogue: "Jonli dialog mashqi",
      dialogueDesc: "Sherik bilan birgalikda rolli o'yinlar va amaliy muloqot",
    },
    friends: {
      title: "Do'stlar va Sheriklar",
      subtitle: "Siz bilan muloqot qilgan va birga til o'rganayotgan do'stlaringiz",
      emptyTitle: "Hozircha do'stlaringiz ro'yxati bo'sh",
      emptyDesc: "Jonli suhbatlar o'tkazing va muloqot davomida suhbatdoshlarni do'stlar safiga qo'shing.",
      startMeeting: "Yangi suhbat boshlash",
    },
    rating: {
      title: "Haftalik Reyting",
      subtitle: "Eng ko'p vaqt suhbatlashgan faol foydalanuvchilar",
      yourResult: "Sizning natijangiz",
      talkedTime: "gaplashildi",
    },
    achievements: {
      title: "Yutuqlar va Medallar",
      subtitle: "Muloqotlar davomida erishgan barcha natijalaringiz",
      firstStep: "Ilk Qadam",
      firstStepDesc: "Dasturda birinchi suhbatni to'liq yakunlang",
      streak7: "7 Kunlik Olov",
      streak7Desc: "Ketma-ket 7 kun davomida speaking mashg'ulotida bo'ling",
      polyglot: "Poliglot",
      polyglotDesc: "Kamida 3 xil tildagi suhbat xonalarida ishtirok eting",
      diamondMaster: "Olmos Ustasi",
      diamondMasterDesc: "Balansda 500 ta olmos to'plang",
    },
    settings: {
      title: "Sozlamalar",
      subtitle: "Ovoz, bildirishnomalar va shaxsiy parametrlarni sozlang",
      mic: "Mikrofon sezgirligi",
      micDesc: "Nutqni aniq qabul qilish rejimi",
      micStatus: "Avtomatik",
      notifications: "Bildirishnomalar",
      notificationsDesc: "Yangi suhbatlar va xabarnomalar",
      notificationsStatus: "Yoqilgan",
      language: "Ilova tili",
      languageDesc: "Interfeys tili",
      security: "Xavfsizlik va maxfiylik",
      securityDesc: "WebRTC orqali shifrlangan ovozli aloqa",
      securityStatus: "Himoyalangan",
    },
    help: {
      title: "Yordam Markazi (FAQ)",
      subtitle: "Tez-tez beriladigan savollar va yechimlar",
      faqs: [
        {
          q: "Suhbatdosh qanday tanlanadi?",
          a: "Kerakli tilni tanlab 'START' tugmasini bosganingizda, tizim shu tilda suhbatlashmoqchi bo'lgan foydalanuvchini avtomatik bog'laydi.",
        },
        {
          q: "Ovoz eshitilmasa nima qilish kerak?",
          a: "Brauzerda mikrofonga ruxsat berilganiga ishonch hosil qiling va ekrandagi mikrofon tugmasi yoqilganini tekshiring.",
        },
        {
          q: "Olmoslar nima uchun kerak?",
          a: "Olmoslar orqali kunlik suhbatlar chegarasini oshirish, sovg'alar yuborish va premium imkoniyatlardan foydalanish mumkin.",
        },
        {
          q: "Qoidabuzarlik holatida nima qilish kerak?",
          a: "Suhbat xonasida 'Shikoyat bildirish' bo'limi mavjud. Sababni tanlab darhol moderatorlarga xabar yuborishingiz mumkin.",
        },
      ],
    },
    feedback: {
      title: "Shikoyat va Takliflar",
      subtitle: "Ilovani yaxshilash bo'yicha fikringiz biz uchun muhim",
      label: "Fikr yoki shikoyatingizni yozing:",
      placeholder: "Ilovani yaxshilash bo'yicha fikr yoki duch kelgan xatolikni batafsil yozing...",
      submit: "Yuborish",
      successTitle: "Taklifingiz qabul qilindi!",
      successDesc: "Fikringiz uchun tashakkur. Biz har bir taklifni ko'rib chiqamiz.",
      newFeedback: "Yangi taklif yozish",
    },
  },

  ru: {
    sidebar: {
      home: "Speaking",
      speaking: "Speaking",
      club: "Клубы",
      dailyTasks: "Ежедневные задания",
      taskGame: "Игра с заданиями",
      books: "Полезные книги",
      platform: "Платформа",
      exercises: "Моя история",
      history: "Моя история",
      friends: "Друзья",
      messages: "Сообщения",
      rating: "Рейтинг",
      achievements: "Достижения",
      settings: "Настройки",
      devices: "Мои устройства",
      help: "Помощь",
      feedback: "Отзывы и жалобы",
      profile: "Профиль",
      premium: "Купить Premium",
      premiumDesc: "Безлимитное общение и все языки",
      logout: "Выйти",
    },
    topbar: {
      online: "онлайн",
      usersOnline: "пользователей онлайн",
      notifications: "Уведомления",
    },
    welcome: {
      greeting: "Здравствуйте",
      question: "На каком языке вы хотите поговорить?",
      description: "Выберите собеседника на подходящем языке и начните живое общение прямо сейчас.",
      quoteA: "Знакомьтесь с новыми людьми,",
      quoteB: "учите новые языки!",
    },
    stats: {
      streak: "Дни подряд",
      days: "дн.",
      talkTime: "Время разговоров",
      hours: "ч.",
      rank: "Ваше место",
      rankValue: "1-е место",
    },
    start: {
      chooseLanguage: "Выберите язык для общения",
      selected: "Выбранный язык",
      searching: "Поиск собеседника...",
      waitingQueue: "Ищем собеседника для живого голосового общения",
      cancelSearch: "Отменить поиск",
      startBtn: "СТАРТ",
      cancelBtn: "ОТМЕНА",
      ruleWarning: "Оскорбления и нецензурная лексика строго запрещены.",
    },
    reward: {
      dailyTitle: "Ежедневная награда",
      dailyDesc: "Заходите каждый день и получайте 5 бесплатных алмазов!",
      claimBtn: "Получить 5 алмазов",
      claiming: "Получение...",
      claimed: "Сегодня получено",
      balance: "Баланс",
      topUp: "Пополнить счет",
      buyPremium: "Купить Premium",
    },
    meeting: {
      you: "Вы",
      partner: "Собеседник",
      turnMicOn: "Включить микрофон",
      turnMicOff: "Выключить микрофон",
      chatTitle: "Живой чат",
      chatWith: "Чат с собеседником",
      typeMessage: "Введите сообщение...",
      send: "Отправить",
      endCall: "Завершить разговор",
      confirmEndTitle: "Вы действительно хотите завершить разговор?",
      confirmEndDesc: "При завершении комната закроется, а временные сообщения будут удалены.",
      yes: "Да",
      no: "Нет",
      complaintTitle: "Подать жалобу",
      complaintSubmit: "Отправить жалобу",
      skip: "Пропустить",
    },
    profile: {
      diamonds: "Алмазы",
      streak: "Серия",
      rank: "Место",
      sectionsTitle: "Разделы и настройки",
      ratingTitle: "Таблица лидеров",
      ratingDesc: "Соревнуйтесь с самыми активными пользователями",
      achievementsTitle: "Достижения и награды",
      achievementsDesc: "Ваши рекорды и значки",
      settingsTitle: "Настройки",
      settingsDesc: "Микрофон, уведомления и безопасность",
      helpTitle: "Центр помощи (FAQ)",
      helpDesc: "Ответы на вопросы и техподдержка",
      feedbackTitle: "Отзывы и предложения",
      feedbackDesc: "Отправьте ваши пожелания разработчикам",
      appLanguage: "Язык приложения",
      appLanguageDesc: "Выберите язык интерфейса",
      supportTitle: "Связаться с админом",
      supportDesc: "Быстрая поддержка в Telegram",
      logoutTitle: "Выйти из аккаунта",
      logoutDesc: "Безопасный выход из системы",
    },
    exercises: {
      title: "Мои упражнения",
      subtitle: "Упражнения для развития беглости и словарного запаса",
      startBtn: "Начать упражнение",
      dailyTopics: "Повседневные темы",
      dailyTopicsDesc: "Диалоги на темы: путешествия, IT, работа, дружба и культура",
      vocab: "Словарный запас",
      vocabDesc: "Коллекция из 500 самых частотных выражений и слов",
      pronounce: "Тренировка произношения",
      pronounceDesc: "Проверка и оценка четкости речи через микрофон",
      dialogue: "Живой ролевой диалог",
      dialogueDesc: "Практика реального общения вместе с собеседником",
    },
    friends: {
      title: "Друзья и партнёры",
      subtitle: "Люди, с которыми вы общались и практикуете языки",
      emptyTitle: "Список друзей пока пуст",
      emptyDesc: "Общайтесь в голосовых комнатах и добавляйте интересных собеседников в друзья.",
      startMeeting: "Начать разговор",
    },
    rating: {
      title: "Недельный рейтинг",
      subtitle: "Самые активные спикеры за эту неделю",
      yourResult: "Ваш результат",
      talkedTime: "время общения",
    },
    achievements: {
      title: "Достижения и медали",
      subtitle: "Все ваши успехи в разговорной практике",
      firstStep: "Первый шаг",
      firstStepDesc: "Успешно завершите свой первый разговор",
      streak7: "7 дней огня",
      streak7Desc: "Практикуйтесь в приложении 7 дней подряд",
      polyglot: "Полиглот",
      polyglotDesc: "Пообщайтесь минимум на 3 разных языках",
      diamondMaster: "Мастер алмазов",
      diamondMasterDesc: "Соберите 500 алмазов на балансе",
    },
    settings: {
      title: "Настройки",
      subtitle: "Настройте звук, уведомления и параметры профиля",
      mic: "Чувствительность микрофона",
      micDesc: "Режим четкого захвата голоса",
      micStatus: "Авто",
      notifications: "Уведомления",
      notificationsDesc: "Новые звонки и важные события",
      notificationsStatus: "Включено",
      language: "Язык интерфейса",
      languageDesc: "Язык меню и приложения",
      security: "Безопасность и приватность",
      securityDesc: "Зашифрованное голосовое соединение WebRTC",
      securityStatus: "Защищено",
    },
    help: {
      title: "Центр помощи (FAQ)",
      subtitle: "Частые вопросы и ответы",
      faqs: [
        {
          q: "Как подбирается собеседник?",
          a: "При нажатии 'СТАРТ' система автоматически находит пользователя, который хочет общаться на выбранном вами языке.",
        },
        {
          q: "Что делать, если не слышно звук?",
          a: "Убедитесь, что вы разрешили доступ к микрофону в браузере и кнопка микрофона на экране включена.",
        },
        {
          q: "Для чего нужны алмазы?",
          a: "Алмазы позволяют продлевать время звонков, отправлять подарки и пользоваться премиум-функциями.",
        },
        {
          q: "Что делать при нарушении правил?",
          a: "В комнате разговора есть кнопка 'Подать жалобу'. Выберите причину и отправьте её модераторам.",
        },
      ],
    },
    feedback: {
      title: "Отзывы и жалобы",
      subtitle: "Ваше мнение помогает нам стать лучше",
      label: "Напишите ваш отзыв или предложение:",
      placeholder: "Опишите вашу идею или проблему максимально подробно...",
      submit: "Отправить",
      successTitle: "Спасибо за обратную связь!",
      successDesc: "Мы внимательно изучаем каждое обращение пользователей.",
      newFeedback: "Написать ещё",
    },
  },

  en: {
    sidebar: {
      home: "Speaking",
      speaking: "Speaking",
      club: "Clubs",
      dailyTasks: "Daily Tasks",
      taskGame: "Challenge Game",
      books: "Useful Books",
      platform: "Platform",
      exercises: "My History",
      history: "My History",
      friends: "Friends",
      messages: "Messages",
      rating: "Leaderboard",
      achievements: "Achievements",
      settings: "Settings",
      devices: "My Devices",
      help: "Help",
      feedback: "Feedback",
      profile: "Profile",
      premium: "Get Premium",
      premiumDesc: "Unlimited calls and all languages",
      logout: "Log out",
    },
    topbar: {
      online: "online",
      usersOnline: "users online",
      notifications: "Notifications",
    },
    welcome: {
      greeting: "Welcome",
      question: "Which language do you want to speak?",
      description: "Pick a partner in your preferred language and start a real-time conversation immediately.",
      quoteA: "Meet new people,",
      quoteB: "learn new languages!",
    },
    stats: {
      streak: "Day streak",
      days: "days",
      talkTime: "Speaking time",
      hours: "hrs",
      rank: "Your rank",
      rankValue: "#1",
    },
    start: {
      chooseLanguage: "Select language to practice",
      selected: "Selected language",
      searching: "Looking for a partner...",
      waitingQueue: "Matching with another speaker for voice practice",
      cancelSearch: "Cancel search",
      startBtn: "START",
      cancelBtn: "CANCEL",
      ruleWarning: "Inappropriate behavior and harassment are strictly prohibited.",
    },
    reward: {
      dailyTitle: "Daily Diamond Reward",
      dailyDesc: "Log in every day to claim 5 free diamonds!",
      claimBtn: "Claim 5 diamonds",
      claiming: "Claiming...",
      claimed: "Claimed today",
      balance: "Balance",
      topUp: "Top up",
      buyPremium: "Get Premium",
    },
    meeting: {
      you: "You",
      partner: "Partner",
      turnMicOn: "Turn microphone on",
      turnMicOff: "Mute microphone",
      chatTitle: "Live Chat",
      chatWith: "Live chat with partner",
      typeMessage: "Type a message...",
      send: "Send",
      endCall: "End conversation",
      confirmEndTitle: "Are you sure you want to end the call?",
      confirmEndDesc: "Ending the call closes this room and clears the temporary conversation.",
      yes: "Yes",
      no: "No",
      complaintTitle: "Report issue",
      complaintSubmit: "Submit report",
      skip: "Skip",
    },
    profile: {
      diamonds: "Diamonds",
      streak: "Streak",
      rank: "Rank",
      sectionsTitle: "Menu sections and settings",
      ratingTitle: "Leaderboard",
      ratingDesc: "Compete with the most active speakers",
      achievementsTitle: "Badges & Achievements",
      achievementsDesc: "Your milestones and awards",
      settingsTitle: "Settings",
      settingsDesc: "Audio, notifications and security",
      helpTitle: "Help Center (FAQ)",
      helpDesc: "Guides, tutorials and support",
      feedbackTitle: "Suggestions & Feedback",
      feedbackDesc: "Share your thoughts with developers",
      appLanguage: "App Language",
      appLanguageDesc: "Select interface language",
      supportTitle: "Contact Admin",
      supportDesc: "Instant Telegram support",
      logoutTitle: "Sign out",
      logoutDesc: "Securely exit your account",
    },
    exercises: {
      title: "My Exercises",
      subtitle: "Speaking and vocabulary mastery challenges",
      startBtn: "Start exercise",
      dailyTopics: "Daily conversation topics",
      dailyTopicsDesc: "Travel, tech, career, lifestyle and culture dialogues",
      vocab: "Essential Vocabulary",
      vocabDesc: "Collection of top 500 spoken expressions and words",
      pronounce: "Pronunciation check",
      pronounceDesc: "Test speech clarity with interactive microphone analysis",
      dialogue: "Live Roleplay",
      dialogueDesc: "Interactive situational practice with a live partner",
    },
    friends: {
      title: "Friends & Partners",
      subtitle: "Speakers you have connected with and practice together",
      emptyTitle: "Your friends list is currently empty",
      emptyDesc: "Start speaking sessions and add partners to your friends list.",
      startMeeting: "Start conversation",
    },
    rating: {
      title: "Weekly Leaderboard",
      subtitle: "Top speakers with the highest talk time this week",
      yourResult: "Your standing",
      talkedTime: "spoken",
    },
    achievements: {
      title: "Achievements & Medals",
      subtitle: "All your speaking journey milestones",
      firstStep: "First Step",
      firstStepDesc: "Complete your first live speaking session",
      streak7: "7-Day Streak",
      streak7Desc: "Practice for 7 consecutive days",
      polyglot: "Polyglot",
      polyglotDesc: "Practice in at least 3 different languages",
      diamondMaster: "Diamond Master",
      diamondMasterDesc: "Accumulate 500 diamonds in your wallet",
    },
    settings: {
      title: "Settings",
      subtitle: "Adjust voice, notifications, and profile preferences",
      mic: "Microphone sensitivity",
      micDesc: "Clear voice pickup mode",
      micStatus: "Auto",
      notifications: "Notifications",
      notificationsDesc: "Incoming calls and updates",
      notificationsStatus: "Enabled",
      language: "Interface language",
      languageDesc: "App language",
      security: "Privacy & Encryption",
      securityDesc: "End-to-end encrypted WebRTC audio stream",
      securityStatus: "Secured",
    },
    help: {
      title: "Help Center (FAQ)",
      subtitle: "Common questions and solutions",
      faqs: [
        {
          q: "How does matching work?",
          a: "Click 'START' on your chosen language, and our system will instantly pair you with someone ready to practice that language.",
        },
        {
          q: "What if I cannot hear audio?",
          a: "Make sure microphone permissions are allowed in your browser and check that your microphone is unmuted.",
        },
        {
          q: "What are diamonds used for?",
          a: "Diamonds unlock extra conversation time, gifts, and premium language learning perks.",
        },
        {
          q: "How do I report someone breaking rules?",
          a: "Inside the meeting room, click 'Report issue', select a reason, and our moderation team will review it immediately.",
        },
      ],
    },
    feedback: {
      title: "Feedback & Suggestions",
      subtitle: "Your feedback helps us build a better experience",
      label: "Write your message or report an issue:",
      placeholder: "Describe your ideas, suggestions, or bugs encountered...",
      submit: "Submit",
      successTitle: "Thank you for your feedback!",
      successDesc: "We review every user submission carefully.",
      newFeedback: "Submit another message",
    },
  },

  tr: {
    sidebar: {
      home: "Speaking",
      speaking: "Speaking",
      club: "Kulüpler",
      dailyTasks: "Günlük Görevler",
      taskGame: "Görevli Oyun",
      books: "Faydalı Kitaplar",
      platform: "Platform",
      exercises: "Geçmişim",
      history: "Geçmişim",
      friends: "Arkadaşlar",
      messages: "Mesajlar",
      rating: "Sıralama",
      achievements: "Başarılar",
      settings: "Ayarlar",
      devices: "Cihazlarım",
      help: "Yardım",
      feedback: "Geri Bildirim",
      profile: "Profil",
      premium: "Premium Satın Al",
      premiumDesc: "Sınırsız konuşma ve tüm diller",
      logout: "Çıkış Yap",
    },
    topbar: {
      online: "çevrimiçi",
      usersOnline: "kullanıcı çevrimiçi",
      notifications: "Bildirimler",
    },
    welcome: {
      greeting: "Hoş geldiniz",
      question: "Hangi dilde konuşmak istersiniz?",
      description: "İstediğiniz dilde bir konuşma arkadaşı seçin ve hemen canlı sohbete başlayın.",
      quoteA: "Yeni insanlarla tanışın,",
      quoteB: "yeni diller öğrenin!",
    },
    stats: {
      streak: "Gün serisi",
      days: "gün",
      talkTime: "Konuşma süresi",
      hours: "saat",
      rank: "Sıranız",
      rankValue: "1. sıra",
    },
    start: {
      chooseLanguage: "Konuşmak istediğiniz dili seçin",
      selected: "Seçilen dil",
      searching: "Konuşmacı aranıyor...",
      waitingQueue: "Canlı sesli sohbet için partner aranıyor",
      cancelSearch: "Aramayı iptal et",
      startBtn: "BAŞLAT",
      cancelBtn: "İPTAL",
      ruleWarning: "Saygısızlık ve küfürlü konuşma kesinlikle yasaktır.",
    },
    reward: {
      dailyTitle: "Günlük Elmas Ödülü",
      dailyDesc: "Her gün giriş yapın ve 5 ücretsiz elmas kazanın!",
      claimBtn: "5 elmas al",
      claiming: "Alınıyor...",
      claimed: "Bugün alındı",
      balance: "Bakiye",
      topUp: "Bakiye Yükle",
      buyPremium: "Premium Satın Al",
    },
    meeting: {
      you: "Siz",
      partner: "Partner",
      turnMicOn: "Mikrofonu aç",
      turnMicOff: "Mikrofonu kapat",
      chatTitle: "Canlı Sohbet",
      chatWith: "Partnerle sohbet",
      typeMessage: "Mesajınızı yazın...",
      send: "Gönder",
      endCall: "Konuşmayı bitir",
      confirmEndTitle: "Görüşmeyi sonlandırmak istediğinizden emin misiniz?",
      confirmEndDesc: "Görüşme sonlandırıldığında oda kapatılır ve mesajlar silinir.",
      yes: "Evet",
      no: "Hayır",
      complaintTitle: "Şikayet bildir",
      complaintSubmit: "Şikayeti gönder",
      skip: "Atla",
    },
    profile: {
      diamonds: "Elmaslar",
      streak: "Seri",
      rank: "Sıranız",
      sectionsTitle: "Uygulama menüsü ve ayarlar",
      ratingTitle: "Liderlik Tablosu",
      ratingDesc: "En aktif kullanıcılarla yarışın",
      achievementsTitle: "Başarılar ve madalyalar",
      achievementsDesc: "Kazanılan rozetler ve hedefler",
      settingsTitle: "Ayarlar",
      settingsDesc: "Mikrofon, bildirimler ve güvenlik",
      helpTitle: "Yardım Merkezi (SSS)",
      helpDesc: "Sorular, rehberler ve destek",
      feedbackTitle: "Şikayet ve Öneriler",
      feedbackDesc: "Fikirlerinizi bizimle paylaşın",
      appLanguage: "Uygulama Dili",
      appLanguageDesc: "Arayüz dilini seçin",
      supportTitle: "Yönetici ile İletişim",
      supportDesc: "Telegram üzerinden hızlı destek",
      logoutTitle: "Çıkış Yap",
      logoutDesc: "Hesaptan güvenli çıkış",
    },
    exercises: {
      title: "Egzersizlerim",
      subtitle: "Konuşma ve telaffuz geliştirme pratikleri",
      startBtn: "Egzersize başla",
      dailyTopics: "Günlük konular",
      dailyTopicsDesc: "Seyahat, teknoloji, iş ve kültür sohbetleri",
      vocab: "Kelime Hazinesi",
      vocabDesc: "En sık kullanılan 500 kalıp ve ifade",
      pronounce: "Telaffuz Testi",
      pronounceDesc: "Mikrofon ile konuşma doğruluğunu test edin",
      dialogue: "Canlı Rol Diyaloğu",
      dialogueDesc: "Partnerle birlikte gerçek hayat diyalogları",
    },
    friends: {
      title: "Arkadaşlar & Partnerler",
      subtitle: "Birlikte pratik yaptığınız arkadaşlarınız",
      emptyTitle: "Arkadaş listeniz henüz boş",
      emptyDesc: "Canlı konuşmalara katılın ve yeni insanları arkadaş olarak ekleyin.",
      startMeeting: "Yeni konuşma başlat",
    },
    rating: {
      title: "Haftalık Sıralama",
      subtitle: "Bu hafta en çok konuşan aktif kullanıcılar",
      yourResult: "Sizin durumunuz",
      talkedTime: "konuşuldu",
    },
    achievements: {
      title: "Başarılar & Rozetler",
      subtitle: "Dil yolculuğunuzdaki tüm kilometre taşları",
      firstStep: "İlk Adım",
      firstStepDesc: "İlk canlı konuşmanızı tamamlayın",
      streak7: "7 Günlük Seri",
      streak7Desc: "Üst üste 7 gün boyunca pratik yapın",
      polyglot: "Poliglot",
      polyglotDesc: "En az 3 farklı dilde pratik yapın",
      diamondMaster: "Elmas Ustası",
      diamondMasterDesc: "Hesabınızda 500 elmas toplayın",
    },
    settings: {
      title: "Ayarlar",
      subtitle: "Ses, bildirim ve güvenlik tercihlerinizi belirleyin",
      mic: "Mikrofon hassasiyeti",
      micDesc: "Net ses alma modu",
      micStatus: "Otomatik",
      notifications: "Bildirimler",
      notificationsDesc: "Gelen aramalar ve güncellemeler",
      notificationsStatus: "Açık",
      language: "Uygulama dili",
      languageDesc: "Arayüz dili",
      security: "Gizlilik ve Güvenlik",
      securityDesc: "Şifrelenmiş WebRTC ses bağlantısı",
      securityStatus: "Korumalı",
    },
    help: {
      title: "Yardım Merkezi (SSS)",
      subtitle: "Sıkça sorulan sorular ve yanıtları",
      faqs: [
        {
          q: "Konuşma partneri nasıl bulunur?",
          a: "'BAŞLAT' butonuna bastığınızda sistem seçtiğiniz dili konuşmak isteyen biriyle sizi anında eşleştirir.",
        },
        {
          q: "Ses gelmiyorsa ne yapılmalı?",
          a: "Tarayıcınızda mikrofon izninin verildiğinden ve ekrandaki mikrofonun açık olduğundan emin olun.",
        },
        {
          q: "Elmaslar ne işe yarar?",
          a: "Elmaslar konuşma süresini uzatmaya, hediye göndermeye ve premium özelliklere erişmeye yarar.",
        },
        {
          q: "Kural ihlali durumunda ne yapmalıyım?",
          a: "Görüşme ekranındaki 'Şikayet bildir' butonuna tıklayarak sebebi seçip iletebilirsiniz.",
        },
      ],
    },
    feedback: {
      title: "Geri Bildirim & Şikayet",
      subtitle: "Fikirleriniz uygulamayı geliştirmemize yardımcı olur",
      label: "Fikrinizi veya şikayetinizi yazın:",
      placeholder: "Fikirlerinizi ya da karşılaştığınız hataları yazın...",
      submit: "Gönder",
      successTitle: "Geri bildiriminiz alındı!",
      successDesc: "Mesajınız için teşekkürler. Her öneriyi dikkatle inceliyoruz.",
      newFeedback: "Yeni mesaj yaz",
    },
  },

  ko: {
    sidebar: {
      home: "스피킹",
      speaking: "스피킹",
      club: "클럽",
      dailyTasks: "일일 과제",
      taskGame: "과제 게임",
      books: "유용한 도서",
      platform: "플랫폼",
      exercises: "내 기록",
      history: "내 기록",
      friends: "친구",
      messages: "메시지",
      rating: "랭킹",
      achievements: "업적",
      settings: "설정",
      devices: "내 기기",
      help: "도움말",
      feedback: "피드백",
      profile: "프로필",
      premium: "프리미엄 구매",
      premiumDesc: "무제한 대화 및 모든 언어 지원",
      logout: "로그아웃",
    },
    topbar: {
      online: "온라인",
      usersOnline: "명 온라인",
      notifications: "알림",
    },
    welcome: {
      greeting: "환영합니다",
      question: "어떤 언어로 대화하고 싶으신가요?",
      description: "원하는 언어의 상대를 선택하고 지금 바로 실시간 대화를 시작하세요.",
      quoteA: "새로운 사람들을 만나고,",
      quoteB: "새로운 언어를 배우세요!",
    },
    stats: {
      streak: "연속 일수",
      days: "일",
      talkTime: "대화 시간",
      hours: "시간",
      rank: "내 순위",
      rankValue: "1위",
    },
    start: {
      chooseLanguage: "대화할 언어를 선택하세요",
      selected: "선택된 언어",
      searching: "대화 상대 검색 중...",
      waitingQueue: "실시간 음성 대화를 위해 상대를 찾는 중입니다",
      cancelSearch: "검색 취소",
      startBtn: "시작",
      cancelBtn: "취소",
      ruleWarning: "욕설 및 부적절한 언어 사용은 엄격히 금지됩니다.",
    },
    reward: {
      dailyTitle: "일일 다이아몬드 보상",
      dailyDesc: "매일 접속하여 무료 다이아몬드 5개를 받으세요!",
      claimBtn: "다이아몬드 5개 받기",
      claiming: "받는 중...",
      claimed: "오늘 수령 완료",
      balance: "잔액",
      topUp: "충전",
      buyPremium: "프리미엄 구매",
    },
    meeting: {
      you: "나",
      partner: "상대방",
      turnMicOn: "마이크 켜기",
      turnMicOff: "마이크 끄기",
      chatTitle: "실시간 채팅",
      chatWith: "상대방과 실시간 채팅",
      typeMessage: "메시지를 입력하세요...",
      send: "전송",
      endCall: "통화 종료",
      confirmEndTitle: "정말 통화를 종료하시겠습니까?",
      confirmEndDesc: "통화를 종료하면 방이 닫히고 임시 채팅 내용이 모두 삭제됩니다.",
      yes: "예",
      no: "아니오",
      complaintTitle: "신고하기",
      complaintSubmit: "신고 접수",
      skip: "건너뛰기",
    },
    profile: {
      diamonds: "다이아몬드",
      streak: "연속일",
      rank: "순위",
      sectionsTitle: "메뉴 및 설정",
      ratingTitle: "리더보드 랭킹",
      ratingDesc: "가장 활동적인 스피커들과 경쟁하세요",
      achievementsTitle: "업적 및 배지",
      achievementsDesc: "달성한 목표와 획득한 배지",
      settingsTitle: "설정",
      settingsDesc: "마이크, 알림 및 보안 설정",
      helpTitle: "고객센터 (FAQ)",
      helpDesc: "자주 묻는 질문과 가이드",
      feedbackTitle: "의견 및 피드백",
      feedbackDesc: "개선 사항을 개발자에게 전달하세요",
      appLanguage: "앱 언어",
      appLanguageDesc: "인터페이스 언어 선택",
      supportTitle: "관리자 문의",
      supportDesc: "텔레그램 빠른 지원",
      logoutTitle: "로그아웃",
      logoutDesc: "계정에서 안전하게 나가기",
    },
    exercises: {
      title: "내 연습",
      subtitle: "스피킹 및 어휘 향상을 위한 연습",
      startBtn: "연습 시작",
      dailyTopics: "일상 대화 주제",
      dailyTopicsDesc: "여행, IT, 직장, 라이프스타일 대화",
      vocab: "핵심 어휘",
      vocabDesc: "자주 쓰이는 회화 표현 500선",
      pronounce: "발음 테스트",
      pronounceDesc: "마이크를 통한 발음 정확도 검사",
      dialogue: "실시간 역할극",
      dialogueDesc: "상대방과 함께하는 상황별 회화 연습",
    },
    friends: {
      title: "친구 및 파트너",
      subtitle: "함께 대화하고 연습했던 파트너 목록",
      emptyTitle: "친구 목록이 비어 있습니다",
      emptyDesc: "실시간 대화를 시작하고 마음에 드는 상대를 친구로 추가해보세요.",
      startMeeting: "새 대화 시작",
    },
    rating: {
      title: "주간 랭킹",
      subtitle: "이번 주 가장 많은 시간 대화한 사용자",
      yourResult: "내 기록",
      talkedTime: "대화 완료",
    },
    achievements: {
      title: "업적 및 메달",
      subtitle: "대화 여정에서 달성한 모든 기록",
      firstStep: "첫 걸음",
      firstStepDesc: "첫 실시간 음성 대화를 완료하세요",
      streak7: "7일 연속 연습",
      streak7Desc: "7일 연속으로 앱에서 대화를 나누세요",
      polyglot: "폴리글랏",
      polyglotDesc: "최소 3개 언어로 대화에 참여하세요",
      diamondMaster: "다이아몬드 마스터",
      diamondMasterDesc: "지갑에 다이아몬드 500개를 모으세요",
    },
    settings: {
      title: "설정",
      subtitle: "오디오, 알림 및 개인 설정을 관리하세요",
      mic: "마이크 감도",
      micDesc: "선명한 음성 인식 모드",
      micStatus: "자동",
      notifications: "알림 설정",
      notificationsDesc: "새 대화 및 업데이트 알림",
      notificationsStatus: "활성화",
      language: "언어 설정",
      languageDesc: "앱 인터페이스 언어",
      security: "보안 및 개인정보",
      securityDesc: "암호화된 WebRTC 음성 스트림",
      securityStatus: "보호됨",
    },
    help: {
      title: "고객센터 (FAQ)",
      subtitle: "자주 묻는 질문과 답변",
      faqs: [
        {
          q: "대화 상대는 어떻게 매칭되나요?",
          a: "'시작' 버튼을 누르면 선택한 언어로 대화하고 싶어하는 사용자와 즉시 자동 연결됩니다.",
        },
        {
          q: "소리가 들리지 않으면 어떻게 해야 하나요?",
          a: "브라우저에서 마이크 권한이 허용되어 있는지 확인하고 화면의 마이크 버튼이 켜져 있는지 확인하세요.",
        },
        {
          q: "다이아몬드는 어디에 사용되나요?",
          a: "추가 대화 시간 확보, 선물 보내기, 프리미엄 기능 이용 등에 사용됩니다.",
        },
        {
          q: "규칙을 위반한 사용자는 어떻게 신고하나요?",
          a: "대화 방 안의 '신고하기' 버튼을 눌러 사유를 선택하면 운영팀이 즉시 검토합니다.",
        },
      ],
    },
    feedback: {
      title: "의견 및 건의사항",
      subtitle: "여러분의 소중한 의견으로 더 좋은 서비스를 만듭니다",
      label: "의견이나 건의사항을 적어주세요:",
      placeholder: "아이디어나 겪으신 불편사항을 자세히 적어주세요...",
      submit: "보내기",
      successTitle: "의견이 접수되었습니다!",
      successDesc: "소중한 피드백 감사드립니다. 꼼꼼히 검토하겠습니다.",
      newFeedback: "추가 의견 보내기",
    },
  },
};
