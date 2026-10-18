import { useEffect, useRef, useState, useCallback, useMemo, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  Play,
  Radio,
  Check,
  ChevronDown,
  Users,
  X,
  Flame,
  Mic,
  MicOff,
  Gem,
  Plus,
  Crown,
  CreditCard,
  Clock,
  Info,
  Sparkles,
  PanelLeft,
  Headphones,
  ShieldCheck,
  AudioWaveform,
  Globe2,
  AlertCircle,
  MessageSquare,
  PhoneOff,
  Send,
  Flag,
  UserCheck,
  Home,
  FileText,
  Trophy,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Phone,
  Mail,
  Shield,
  Star,
  BookOpen,
  History,
  Laptop,
  Smartphone,
  Trash2,
  Ban,
  ShieldAlert,
  Headset,
  Search,
  UserPlus,
  UserMinus,
  MessageCircle,
  CheckCheck,
  Medal,
  Loader2,
  ClipboardCheck,
  Gamepad2,
  Zap,
  Lock,
  Download,
  RotateCcw,
  SkipForward,
  UserX,
  Edit3,
  Camera,
  Upload,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { DASHBOARD_TRANSLATIONS } from "@/i18n/dashboardTranslations";
import UserSidebar, { type UserNavTab } from "@/components/UserSidebar";
import AccountMenu from "@/components/AccountMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CountryFlag from "@/components/CountryFlag";
import SpeakerAvatar, { resolveAvatarUrl } from "@/components/SpeakerAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import VipUserCard from "@/components/VipUserCard";
import AiLoader from "@/components/ui/ai-loader";
import CalendarCapacityPicker from "@/components/CalendarCapacityPicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import {
  getDailyTasksForUser,
  getTaskGameQuestions,
  LANGUAGE_META,
  TIER_META,
  type LanguageKey,
  type DailyTaskQuestion,
} from "@/data/dailyTasksBank";

const MAX_SEARCH_SECONDS = 60; // 1 daqiqa (60s) kutish limiti, keyin random tildan speaker ulanadi

interface LanguageItem {
  id: LanguageKey;
  name: string;
  country: string;
  flagCode: string;
}

interface ClubLanguageItem {
  id: "uz" | "en" | "ru" | "ar" | "tr";
  name: string;
  country: string;
  flagCode: string;
}

interface MatchedPartner {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  language: string;
  isPremium?: boolean;
  isVerified?: boolean;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderUsername: string;
  text: string;
  createdAt: string;
  isMe?: boolean;
}

interface ClubMember {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  isPremium?: boolean;
  isVerified?: boolean;
  role?: "owner" | "member";
  muted?: boolean;
  mutedByAdmin?: boolean;
  speaking?: boolean;
  joinedAt?: string;
  requestedAt?: string;
}

interface ClubRoom {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  memberCount: number;
  language: string;
  status: "active" | "closed";
  owner: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    isPremium?: boolean;
    isVerified?: boolean;
  };
  members: ClubMember[];
  pendingRequests: ClubMember[];
  kickedUserIds?: string[];
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderUsername: string;
    senderAvatar?: string | null;
    isPremium?: boolean;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

const LANGUAGES: LanguageItem[] = [
  { id: "uz", name: "O'zbek tili", country: "O'zbekiston", flagCode: "UZ" },
  { id: "en", name: "Ingliz tili", country: "AQSH / Buyuk Britaniya", flagCode: "GB" },
  { id: "ru", name: "Rus tili", country: "Rossiya", flagCode: "RU" },
  { id: "tr", name: "Turk tili", country: "Turkiya", flagCode: "TR" },
  { id: "ko", name: "Koreys tili", country: "Janubiy Koreya", flagCode: "KR" },
];

const CLUB_LANGUAGES: ClubLanguageItem[] = [
  { id: "uz", name: "O'zbek tili", country: "O'zbekiston", flagCode: "UZ" },
  { id: "en", name: "Ingliz tili", country: "AQSH / Buyuk Britaniya", flagCode: "GB" },
  { id: "ru", name: "Rus tili", country: "Rossiya", flagCode: "RU" },
  { id: "ar", name: "Arab tili", country: "Saudiya Arabistoni", flagCode: "SA" },
  { id: "tr", name: "Turk tili", country: "Turkiya", flagCode: "TR" },
];

const LOCALIZED_LANG_NAMES: Record<string, Record<string, string>> = {
  uz: {
    uz: "O'zbek tili",
    en: "Ingliz tili",
    ru: "Rus tili",
    tr: "Turk tili",
    ko: "Koreys tili",
    ar: "Arab tili",
  },
  ru: {
    uz: "Узбекский язык",
    en: "Английский язык",
    ru: "Русский язык",
    tr: "Турецкий язык",
    ko: "Корейский язык",
    ar: "Арабский язык",
  },
  en: {
    uz: "Uzbek language",
    en: "English language",
    ru: "Russian language",
    tr: "Turkish language",
    ko: "Korean language",
    ar: "Arabic language",
  },
  tr: {
    uz: "Özbek dili",
    en: "İngiliz dili",
    ru: "Rus dili",
    tr: "Türk dili",
    ko: "Kore dili",
    ar: "Arap dili",
  },
  ko: {
    uz: "우즈베크어",
    en: "영어",
    ru: "러시아어",
    tr: "튀르키예어",
    ko: "한국어",
    ar: "아랍어",
  },
};

function getLocalizedLangName(langId: string, currentLang: string, fallback: string): string {
  return LOCALIZED_LANG_NAMES[currentLang]?.[langId] || fallback;
}

function formatLevel(lvl: number, currentLang: string): string {
  switch (currentLang) {
    case "ru": return `${lvl}-й уровень`;
    case "en": return `Level ${lvl}`;
    case "tr": return `${lvl}. Seviye`;
    case "ko": return `${lvl}레벨`;
    default: return `${lvl}-daraja`;
  }
}

function formatLevelTitle(lvl: number, currentLang: string): string {
  switch (currentLang) {
    case "ru": return `${lvl}-й уровень (Level ${lvl})`;
    case "en": return `Level ${lvl}`;
    case "tr": return `${lvl}. Seviye (Level ${lvl})`;
    case "ko": return `${lvl}레벨 (Level ${lvl})`;
    default: return `${lvl}-Daraja (Level ${lvl})`;
  }
}

const COMPLAINT_OPTIONS = [
  "Haqoratli so'zlar yoki nojo'ya xatti-harakat",
  "Mavzudan tashqari gaplashish / spam",
  "Mikrofon shovqini / tushunarsiz ovoz",
  "Madaniyatsizlik yoki hurmatsizlik",
  "Boshqa sabab",
];

function getOrCreateClientId(): string {
  try {
    const key = "ls_presence_cid";
    let cid = localStorage.getItem(key);
    if (!cid) {
      cid = "cid_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
      localStorage.setItem(key, cid);
    }
    return cid;
  } catch {
    return "cid_fallback";
  }
}

export default function UserHome() {
  const { slug, clubRoomId: routeClubRoomId } = useParams<{ slug?: string; clubRoomId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout, refreshUser, uploadAvatar, updateProfile } = useAuth();
  const { lang } = useLanguage();
  const dt = DASHBOARD_TRANSLATIONS[lang] ?? DASHBOARD_TRANSLATIONS.uz;

  const [activeTab, setActiveTab] = useState<UserNavTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Language selection (5 isolated language servers)
  const [speakerOption, setSpeakerOption] = useState<LanguageItem>(LANGUAGES[1]); // Ingliz tili
  const [speakerDropdownOpen, setSpeakerDropdownOpen] = useState(false);

  // Searching, Matchmaking & Microphone state
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingInRoom, setIsSearchingInRoom] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [timeoutNotice, setTimeoutNotice] = useState<string | null>(null);

  // Meeting Room State
  const [matchedPartner, setMatchedPartner] = useState<MatchedPartner | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [inMeetingRoom, setInMeetingRoom] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);

  // Club ("Klub") State
  const [clubRooms, setClubRooms] = useState<ClubRoom[]>([]);
  const [activeClubRoom, setActiveClubRoom] = useState<ClubRoom | null>(null);
  const [clubFormName, setClubFormName] = useState("");
  const [clubFormDesc, setClubFormDesc] = useState("");
  const [clubFormMaxMembers, setClubFormMaxMembers] = useState<number>(2);
  const [clubFormLang, setClubFormLang] = useState<ClubLanguageItem>(CLUB_LANGUAGES[1]);
  const [clubLangDropdownOpen, setClubLangDropdownOpen] = useState(false);
  const [clubCreating, setClubCreating] = useState(false);
  const [clubError, setClubError] = useState<string | null>(null);
  const [clubChatOpen, setClubChatOpen] = useState(false);
  const [clubChatInput, setClubChatInput] = useState("");
  const [clubUnreadChat, setClubUnreadChat] = useState(0);
  const [clubMicMuted, setClubMicMuted] = useState(false);
  const [clubSpeakingNow, setClubSpeakingNow] = useState(false);
  const clubChatEndRef = useRef<HTMLDivElement | null>(null);
  const prevClubMsgCountRef = useRef<number>(0);

  // Microphone audio state inside meeting room
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isMySpeaking, setIsMySpeaking] = useState(false);
  const [isPartnerSpeaking, setIsPartnerSpeaking] = useState(false);

  // Real-time Ephemeral Chat inside meeting
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // End meeting confirmation modal
  const [endMeetingModalOpen, setEndMeetingModalOpen] = useState(false);

  // Left complaints panel state
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [complaintDetails, setComplaintDetails] = useState("");
  const [complaintSent, setComplaintSent] = useState(false);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);

  // Messages & Notifications modal state
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // Announcements (Admin E'lonlari) State
  const [announcements, setAnnouncements] = useState<
    Array<{ id: string; title: string; body: string; priority?: string; createdAt: string; active?: boolean }>
  >([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lingo_read_announcements") || "[]");
    } catch {
      return [];
    }
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/announcements`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch (e) {
      console.warn("Failed to fetch announcements:", e);
    }
  }, []);

  const unreadAnnouncementsCount = useMemo(() => {
    return announcements.filter((a) => !readAnnouncementIds.includes(a.id)).length;
  }, [announcements, readAnnouncementIds]);

  const handleOpenNotificationsModal = () => {
    setNotificationsModalOpen(true);
    if (announcements.length > 0) {
      const allIds = announcements.map((a) => a.id);
      setReadAnnouncementIds(allIds);
      try {
        localStorage.setItem("lingo_read_announcements", JSON.stringify(allIds));
      } catch {}
    }
  };

  // Admin <-> User Messages State
  const [adminMessages, setAdminMessages] = useState<
    Array<{ id: string; text: string; sender: string; isAdmin: boolean; createdAt: string; read?: boolean }>
  >([]);
  const [adminMessageInput, setAdminMessageInput] = useState("");
  const [adminMessageSending, setAdminMessageSending] = useState(false);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const adminMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchAdminMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setAdminMessages(data.messages);
        setUnreadAdminCount(data.unreadCount ?? 0);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchAdminMessages();
    fetchAnnouncements();
    const interval = setInterval(() => {
      fetchAdminMessages();
      fetchAnnouncements();
    }, 4000);
    return () => clearInterval(interval);
  }, [token, fetchAnnouncements]);

  const handleOpenMessagesModal = () => {
    setMessagesModalOpen(true);
    if (token) {
      fetch(`${API_BASE}/api/auth/messages/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      setUnreadAdminCount(0);
    }
    setTimeout(() => {
      adminMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleSendAdminReply = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!adminMessageInput.trim() || !token || adminMessageSending) return;
    const textToSend = adminMessageInput.trim();
    setAdminMessageSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: textToSend }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminMessageInput("");
        await fetchAdminMessages();
        setTimeout(() => {
          adminMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch {
      /* ignore */
    } finally {
      setAdminMessageSending(false);
    }
  };

  // Devices & Sessions state
  const [devices, setDevices] = useState<
    Array<{
      id: string;
      deviceName: string;
      ip: string;
      current: boolean;
      createdAt: string;
      lastActiveAt: string;
      isBlocked: boolean;
    }>
  >([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceActionLoading, setDeviceActionLoading] = useState<string | null>(null);
  const [deviceMessage, setDeviceMessage] = useState<string | null>(null);

  // Real-time online users count
  const [onlineCount, setOnlineCount] = useState<number>(1);

  // Diamonds & Daily reward state (5 diamonds once per 24h)
  const dailyClaimStorageKey = `ls_daily_claim_${user?.id || "guest"}`;
  const dailyDiamondsStorageKey = `ls_local_diamonds_${user?.id || "guest"}`;

  const [diamonds, setDiamonds] = useState<number>(() => {
    const serverDiamonds = user?.diamonds ?? 0;
    try {
      const saved = Number(localStorage.getItem(`ls_local_diamonds_${user?.id || "guest"}`) || 0);
      return Math.max(serverDiamonds, isNaN(saved) ? 0 : saved);
    } catch {
      return serverDiamonds;
    }
  });
  const [lastDailyClaimAt, setLastDailyClaimAt] = useState<string | null>(() => {
    if (user?.lastDailyClaimAt) return user.lastDailyClaimAt;
    try {
      const saved = localStorage.getItem(`ls_daily_claim_${user?.id || "guest"}`);
      if (saved) {
        const ms = new Date(saved).getTime();
        if (!isNaN(ms) && Date.now() - ms < 24 * 60 * 60 * 1000) {
          return saved;
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  });
  const [dailyRemainingSec, setDailyRemainingSec] = useState<number>(() => {
    const initialClaim =
      user?.lastDailyClaimAt ||
      (() => {
        try {
          return localStorage.getItem(`ls_daily_claim_${user?.id || "guest"}`);
        } catch {
          return null;
        }
      })();
    if (!initialClaim) return 0;
    const ms = new Date(initialClaim).getTime();
    if (isNaN(ms)) return 0;
    return Math.max(0, Math.ceil((ms + 24 * 60 * 60 * 1000 - Date.now()) / 1000));
  });
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [streakDays, setStreakDays] = useState<number>(user?.streakDays ?? 1);
  const [talkSeconds, setTalkSeconds] = useState<number>(user?.talkSeconds ?? 0);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);

  // Social State: History, Friends, Leaderboard, Direct Messages
  const [talkHistory, setTalkHistory] = useState<
    Array<{
      partnerId: string;
      name: string;
      username: string;
      avatarUrl: string | null;
      isPremium?: boolean;
      isVerified?: boolean;
      language?: string;
      durationSeconds?: number;
      talkedAt: string;
    }>
  >([]);
  const [friendsList, setFriendsList] = useState<
    Array<{
      id: string;
      name: string;
      username: string;
      avatarUrl: string | null;
      isPremium?: boolean;
      isVerified?: boolean;
    }>
  >([]);
  const [incomingRequests, setIncomingRequests] = useState<
    Array<{
      id: string;
      fromUserId: string;
      name: string;
      username: string;
      avatarUrl: string | null;
      isPremium?: boolean;
      isVerified?: boolean;
      createdAt: string;
    }>
  >([]);
  const [outgoingRequests, setOutgoingRequests] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState<
    Array<{
      id: string;
      name: string;
      username: string;
      avatarUrl: string | null;
      isPremium?: boolean;
      isVerified?: boolean;
      relation: "none" | "friends" | "outgoing" | "incoming";
    }>
  >([]);
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  const [friendActionMsg, setFriendActionMsg] = useState<string | null>(null);

  // Rating / Leaderboard state
  const [leaderboard, setLeaderboard] = useState<
    Array<{
      id: string;
      rank: number;
      name: string;
      username: string;
      avatarUrl: string | null;
      isPremium?: boolean;
      isVerified?: boolean;
      diamonds: number;
      streakDays: number;
      talkSeconds: number;
      xp?: number;
      level?: number;
      score: number;
    }>
  >([]);
  const [ratingSort, setRatingSort] = useState<"all" | "diamonds" | "streak" | "talk" | "xp">("all");

  // XP, Level, Daily Tasks, Task Game & Books state
  const todayIsoKey = new Date().toISOString().slice(0, 10);
  const taskAnswersStorageKey = `ls_daily_task_answers_${user?.id || "guest"}_${todayIsoKey}`;
  const taskResultsStorageKey = `ls_daily_task_results_${user?.id || "guest"}_${todayIsoKey}`;

  const normalizeCompletedDailyTasks = (raw: unknown): Record<string, string[]> => {
    if (!raw) return {};
    if (Array.isArray(raw)) {
      const map: Record<string, string[]> = {};
      for (const item of raw) {
        if (typeof item !== "string") continue;
        const parts = item.split(":");
        if (parts.length >= 3) {
          const dKey = parts[0];
          const tId = parts[2];
          if (!map[dKey]) map[dKey] = [];
          if (!map[dKey].includes(tId)) map[dKey].push(tId);
        }
      }
      return map;
    }
    if (typeof raw === "object") {
      return raw as Record<string, string[]>;
    }
    return {};
  };

  const [userXp, setUserXp] = useState<number>(user?.xp ?? 0);
  const [userLevel, setUserLevel] = useState<number>(user?.level ?? 1);
  const [completedDailyTasks, setCompletedDailyTasks] = useState<Record<string, string[]>>(() =>
    normalizeCompletedDailyTasks(user?.completedDailyTasks)
  );
  const [totalTasksCompleted, setTotalTasksCompleted] = useState<number>(
    user?.totalTasksCompleted ?? 0
  );
  const [taskLang, setTaskLang] = useState<LanguageKey>("en");
  const [taskSelectedAnswers, setTaskSelectedAnswers] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(
        `ls_daily_task_answers_${user?.id || "guest"}_${new Date().toISOString().slice(0, 10)}`
      );
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [taskSubmittedResult, setTaskSubmittedResult] = useState<
    Record<string, "correct" | "wrong">
  >(() => {
    try {
      const saved = localStorage.getItem(
        `ls_daily_task_results_${user?.id || "guest"}_${new Date().toISOString().slice(0, 10)}`
      );
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [taskToastMsg, setTaskToastMsg] = useState<string | null>(null);

  // Task Game ("Topshiriqli o'yin") state
  const [gameLang, setGameLang] = useState<LanguageKey>("en");
  const [gameQuestions, setGameQuestions] = useState<DailyTaskQuestion[]>([]);
  const [gameIndex, setGameIndex] = useState<number>(0);
  const [gameSelectedOption, setGameSelectedOption] = useState<number | null>(null);
  const [gameResultState, setGameResultState] = useState<"idle" | "correct" | "wrong">("idle");
  const [gameLives, setGameLives] = useState<number>(3);
  const [gameCorrectCount, setGameCorrectCount] = useState<number>(0);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [gameClaimedReward, setGameClaimedReward] = useState<{
    xpEarned: number;
    diamondReward: number;
  } | null>(null);
  const [gameClaiming, setGameClaiming] = useState<boolean>(false);

  // Books ("Foydali kitoblar") state
  const [booksList, setBooksList] = useState<
    Array<{
      id: string;
      title: string;
      bio: string;
      coverUrl: string | null;
      fileUrl: string;
      fileName: string;
      fileSize?: number;
      createdAt: string;
    }>
  >([]);
  const [booksPremiumRequired, setBooksPremiumRequired] = useState<boolean>(true);

  // Direct Message (User-to-User) Modal state
  const [dmPartner, setDmPartner] = useState<{
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    isPremium?: boolean;
    isVerified?: boolean;
  } | null>(null);
  const [dmMessages, setDmMessages] = useState<
    Array<{
      id: string;
      fromUserId: string;
      toUserId: string;
      senderName: string;
      senderUsername: string;
      text: string;
      createdAt: string;
    }>
  >([]);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const dmEndRef = useRef<HTMLDivElement | null>(null);

  // Dedicated Messages & Conversations State
  const [conversations, setConversations] = useState<
    Array<{
      id: string;
      name: string;
      username: string;
      avatarUrl?: string | null;
      isPremium?: boolean;
      isVerified?: boolean;
      unreadCount: number;
      lastMessage?: {
        id: string;
        text: string;
        createdAt: string;
        isMe: boolean;
        read: boolean;
      } | null;
    }>
  >([]);
  const [messagesSearchQuery, setMessagesSearchQuery] = useState("");
  const [activeChatPartner, setActiveChatPartner] = useState<{
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    isPremium?: boolean;
    isVerified?: boolean;
    unreadCount: number;
    lastMessage?: {
      id: string;
      text: string;
      createdAt: string;
      isMe: boolean;
      read: boolean;
    } | null;
  } | null>(null);
  const [dmThreadMessages, setDmThreadMessages] = useState<
    Array<{
      id: string;
      fromUserId: string;
      toUserId: string;
      senderName?: string;
      senderUsername?: string;
      text: string;
      createdAt: string;
      read?: boolean;
    }>
  >([]);
  const [dmThreadInput, setDmThreadInput] = useState("");
  const [dmThreadSending, setDmThreadSending] = useState(false);
  const dmThreadEndRef = useRef<HTMLDivElement | null>(null);

  const totalUnreadMessages = conversations.reduce(
    (acc, curr) => acc + (Number(curr.unreadCount) || 0),
    0
  );

  const displayName =
    user?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Anonim";

  const displayUsername =
    user?.username ||
    (user?.email ? user.email.split("@")[0].toLowerCase() : null) ||
    "speaker";

  // Edit Profile Modal State & Handlers
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editDeleteAvatar, setEditDeleteAvatar] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  const handleOpenEditProfile = () => {
    setEditName(user?.name || (displayName !== "Anonim" ? displayName : ""));
    const cleanU = (user?.username || displayUsername).replace(/^@+/, "");
    setEditUsername(cleanU);
    setEditAvatarPreview(user?.avatarUrl || null);
    setEditDeleteAvatar(false);
    setEditError(null);
    setEditSuccessMsg(null);
    setEditProfileModalOpen(true);
  };

  const handleSelectNewAvatar = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEditError("Faqat rasm fayllari (JPG, PNG, WEBP, GIF) qabul qilinadi");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawDataUrl = ev.target?.result as string;
      if (!rawDataUrl) return;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 360;
          let w = img.width || maxDim;
          let h = img.height || maxDim;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL("image/jpeg", 0.88);
            setEditAvatarPreview(compressed);
            setEditDeleteAvatar(false);
            setEditError(null);
            return;
          }
        } catch {
          /* fallback */
        }
        setEditAvatarPreview(rawDataUrl);
        setEditDeleteAvatar(false);
        setEditError(null);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setEditAvatarPreview(null);
    setEditDeleteAvatar(true);
    setEditError(null);
  };

  const handleSaveProfile = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = editName.trim();
    const rawUser = editUsername.trim().replace(/^@+/, "").toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setEditError("Ism kamida 2 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!rawUser || rawUser.length < 5) {
      setEditError("Username kamida 5 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!/^[a-z0-9_.]{5,30}$/.test(rawUser)) {
      setEditError("Username faqat lotin harflari, raqamlar, pastki chiziq (_) va nuqta (.) dan iborat bo'lishi mumkin");
      return;
    }

    setEditSaving(true);
    setEditError(null);
    setEditSuccessMsg(null);

    try {
      const patch: {
        name?: string;
        username?: string;
        avatarUrl?: string | null;
        deleteAvatar?: boolean;
      } = {
        name: trimmedName,
        username: rawUser,
      };

      if (editDeleteAvatar) {
        patch.deleteAvatar = true;
        patch.avatarUrl = null;
      } else if (editAvatarPreview && editAvatarPreview !== user?.avatarUrl) {
        patch.avatarUrl = editAvatarPreview;
      }

      await updateProfile(patch);
      setEditSuccessMsg("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
      setTimeout(() => {
        setEditProfileModalOpen(false);
        setEditSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setEditError(err?.message || "Profilni yangilashda xatolik yuz berdi");
    } finally {
      setEditSaving(false);
    }
  };

  const clientIdRef = useRef<string>(getOrCreateClientId());
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const myRoleRef = useRef<"caller" | "callee">("callee");
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());

  const stopMicStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      } catch {
        /* ignore */
      }
    }
    iceCandidatesQueueRef.current = [];
    processedSignalIdsRef.current.clear();
    setIsMySpeaking(false);
  };

  const leaveMatchmakingServer = async () => {
    try {
      await fetch(`${API_BASE}/api/matchmaking/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          userId: user?.id || null,
        }),
      });
    } catch {
      /* ignore */
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    const cid = clientIdRef.current;
    const uid = user?.id || null;

    const handleBeforeUnload = () => {
      try {
        const blob = new Blob([JSON.stringify({ clientId: cid, userId: uid })], {
          type: "application/json",
        });
        navigator.sendBeacon?.(`${API_BASE}/api/matchmaking/leave`, blob);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopMicStream();
      void leaveMatchmakingServer();
    };
  }, [user?.id]);

  // Real-time online presence connection (SSE + Heartbeat)
  useEffect(() => {
    const clientId = clientIdRef.current;
    const userId = user?.id || "";
    const query = `clientId=${encodeURIComponent(clientId)}&userId=${encodeURIComponent(userId)}`;

    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_BASE}/api/presence/stream?${query}`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.onlineCount === "number") {
            setOnlineCount(Math.max(1, data.onlineCount));
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* fallback */
    }

    const sendHeartbeat = () => {
      fetch(`${API_BASE}/api/presence/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, userId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (typeof data?.onlineCount === "number") {
            setOnlineCount(Math.max(1, data.onlineCount));
          }
        })
        .catch(() => {});
    };

    sendHeartbeat();
    const hbInterval = window.setInterval(sendHeartbeat, 1000);

    // Silent background data reload every second without disturbing user
    const bgSyncInterval = window.setInterval(async () => {
      try {
        const token = localStorage.getItem("ls_token");
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.user) {
          if (typeof data.user.diamonds === "number") {
            let localSaved = 0;
            try {
              localSaved = Number(localStorage.getItem(dailyDiamondsStorageKey) || 0);
            } catch {
              localSaved = 0;
            }
            const nextDiamonds = Math.max(data.user.diamonds, isNaN(localSaved) ? 0 : localSaved);
            setDiamonds(nextDiamonds);
          }
          if (data.user.lastDailyClaimAt) {
            setLastDailyClaimAt(data.user.lastDailyClaimAt);
            try {
              localStorage.setItem(dailyClaimStorageKey, data.user.lastDailyClaimAt);
            } catch {
              /* ignore */
            }
          } else {
            try {
              const savedClaim = localStorage.getItem(dailyClaimStorageKey);
              if (savedClaim) {
                const ms = new Date(savedClaim).getTime();
                if (!isNaN(ms) && Date.now() - ms < 24 * 60 * 60 * 1000) {
                  setLastDailyClaimAt(savedClaim);
                } else {
                  localStorage.removeItem(dailyClaimStorageKey);
                  setLastDailyClaimAt(null);
                }
              } else {
                setLastDailyClaimAt(null);
              }
            } catch {
              setLastDailyClaimAt(null);
            }
          }
          if (typeof data.user.streakDays === "number") {
            setStreakDays(data.user.streakDays);
          }
          if (typeof data.user.talkSeconds === "number") {
            setTalkSeconds(data.user.talkSeconds);
          }
          if (typeof data.user.xp === "number") {
            setUserXp(data.user.xp);
          }
          if (typeof data.user.level === "number") {
            setUserLevel(data.user.level);
          }
          if (data.user.completedDailyTasks && typeof data.user.completedDailyTasks === "object") {
            const parsed = normalizeCompletedDailyTasks(data.user.completedDailyTasks);
            setCompletedDailyTasks((prev) => {
              const merged: Record<string, string[]> = { ...prev };
              for (const [dKey, list] of Object.entries(parsed)) {
                const existing = merged[dKey] || [];
                merged[dKey] = Array.from(new Set([...existing, ...list]));
              }
              return merged;
            });
          }
          if (typeof data.user.totalTasksCompleted === "number") {
            setTotalTasksCompleted((prev) => Math.max(prev, data.user.totalTasksCompleted));
          }
        }
      } catch {
        /* silent */
      }
    }, 1000);

    return () => {
      window.clearInterval(hbInterval);
      window.clearInterval(bgSyncInterval);
      es?.close();
    };
  }, [user?.id]);

  // 24-hour Daily Diamond Countdown Timer
  useEffect(() => {
    const updateRemaining = () => {
      if (!lastDailyClaimAt) {
        setDailyRemainingSec(0);
        return;
      }
      const claimedMs = new Date(lastDailyClaimAt).getTime();
      if (isNaN(claimedMs)) {
        setDailyRemainingSec(0);
        return;
      }
      const nextMs = claimedMs + 24 * 60 * 60 * 1000;
      const diffSec = Math.max(0, Math.ceil((nextMs - Date.now()) / 1000));
      setDailyRemainingSec(diffSec);
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [lastDailyClaimAt]);

  // Fetch Social Data (Talk History, Friends, Leaderboard, Books, Clubs)
  const fetchSocialData = async () => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const [histRes, frRes, lbRes, booksRes, clubsRes] = await Promise.all([
        fetch(`${API_BASE}/api/social/history`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/social/friends`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/social/leaderboard`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/social/books`),
        fetch(`${API_BASE}/api/clubs`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      const [histData, frData, lbData, booksData, clubsData] = await Promise.all([
        histRes.json().catch(() => null),
        frRes.json().catch(() => null),
        lbRes.json().catch(() => null),
        booksRes.json().catch(() => null),
        clubsRes.json().catch(() => null),
      ]);
      if (histData?.success && Array.isArray(histData.history)) {
        setTalkHistory(histData.history);
      }
      if (frData?.success) {
        if (Array.isArray(frData.friends)) setFriendsList(frData.friends);
        if (Array.isArray(frData.incomingRequests)) setIncomingRequests(frData.incomingRequests);
        if (Array.isArray(frData.outgoingRequests)) setOutgoingRequests(frData.outgoingRequests);
      }
      if (lbData?.success && Array.isArray(lbData.leaderboard)) {
        setLeaderboard(lbData.leaderboard);
      }
      if (booksData?.success) {
        if (Array.isArray(booksData.books)) {
          setBooksList(booksData.books);
        }
        if (typeof booksData.isPremiumRequired === "boolean") {
          setBooksPremiumRequired(booksData.isPremiumRequired);
        }
      }
      if (clubsData?.success && Array.isArray(clubsData.rooms)) {
        setClubRooms(clubsData.rooms);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void fetchSocialData();
    const interval = window.setInterval(fetchSocialData, 2500);
    return () => window.clearInterval(interval);
  }, [token, activeTab]);

  // Initialize or reset Task Game when language changes
  const startNewTaskGame = (langKey: LanguageKey = gameLang) => {
    const qs = getTaskGameQuestions(langKey);
    setGameQuestions(qs);
    setGameIndex(0);
    setGameSelectedOption(null);
    setGameResultState("idle");
    setGameLives(3);
    setGameCorrectCount(0);
    setGameFinished(false);
    setGameClaimedReward(null);
  };

  useEffect(() => {
    startNewTaskGame(gameLang);
  }, [gameLang]);

  const handleSubmitDailyTaskAnswer = async (task: DailyTaskQuestion) => {
    const selectedIdx = taskSelectedAnswers[task.id];
    if (selectedIdx === undefined) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const alreadyDone =
      Boolean(taskSubmittedResult[task.id]) ||
      (completedDailyTasks[todayKey] || []).includes(task.id);
    if (alreadyDone || submittingTaskId) return;

    const isCorrect = selectedIdx === task.correctIndex;
    const resultState: "correct" | "wrong" = isCorrect ? "correct" : "wrong";

    // 1. Immediately lock this question so no other options can be clicked or re-submitted
    setTaskSubmittedResult((prev) => {
      const next = { ...prev, [task.id]: resultState };
      try {
        localStorage.setItem(taskResultsStorageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    try {
      localStorage.setItem(taskAnswersStorageKey, JSON.stringify(taskSelectedAnswers));
    } catch {
      /* ignore */
    }

    setCompletedDailyTasks((prev) => {
      const existing = prev[todayKey] || [];
      if (existing.includes(task.id)) return prev;
      return {
        ...prev,
        [todayKey]: [...existing, task.id],
      };
    });

    if (isCorrect) {
      setDiamonds((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(dailyDiamondsStorageKey, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      setUserXp((prev) => {
        const nextXp = prev + task.xpReward;
        setUserLevel(Math.floor(nextXp / 100) + 1);
        return nextXp;
      });
      setTaskToastMsg(`Barakalla! To'g'ri javob uchun +1 ta olmos va +${task.xpReward} XP berildi!`);
      setTimeout(() => setTaskToastMsg(null), 4000);
    }

    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;

    setSubmittingTaskId(task.id);
    try {
      const res = await fetch(`${API_BASE}/api/social/tasks/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          language: task.language,
          difficultyTier: task.tier,
          xpEarned: task.xpReward,
          isCorrect,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof data.diamonds === "number") {
          setDiamonds((prev) => {
            const synced = Math.max(prev, data.diamonds);
            try {
              localStorage.setItem(dailyDiamondsStorageKey, String(synced));
            } catch {
              /* ignore */
            }
            return synced;
          });
        }
        if (typeof data.xp === "number") setUserXp((prev) => Math.max(prev, data.xp));
        if (typeof data.level === "number") setUserLevel((prev) => Math.max(prev, data.level));
        if (data.completedDailyTasks) {
          const parsed = normalizeCompletedDailyTasks(data.completedDailyTasks);
          setCompletedDailyTasks((prev) => {
            const merged = { ...prev };
            for (const [dKey, list] of Object.entries(parsed)) {
              const existing = merged[dKey] || [];
              merged[dKey] = Array.from(new Set([...existing, ...list]));
            }
            return merged;
          });
        }
        if (typeof data.totalTasksCompleted === "number") {
          setTotalTasksCompleted((prev) => Math.max(prev, data.totalTasksCompleted));
        }
        await refreshUser();
        void fetchSocialData();
      }
    } catch {
      /* ignore */
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const handleFinishGameClaim = async (finalCorrectCount: number) => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken || gameClaiming || finalCorrectCount <= 0) return;
    setGameClaiming(true);
    try {
      const res = await fetch(`${API_BASE}/api/social/game/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          language: gameLang,
          correctCount: finalCorrectCount,
          totalQuestions: gameQuestions.length || 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof data.diamonds === "number") setDiamonds(data.diamonds);
        if (typeof data.xp === "number") setUserXp(data.xp);
        if (typeof data.level === "number") setUserLevel(data.level);
        setGameClaimedReward({
          xpEarned: data.xpEarned || finalCorrectCount * 15,
          diamondReward: data.diamondReward || 1,
        });
        await refreshUser();
        void fetchSocialData();
      }
    } catch {
      /* ignore */
    } finally {
      setGameClaiming(false);
    }
  };

  // Live search users for Friends page
  useEffect(() => {
    const q = friendSearchQuery.trim();
    if (!q) {
      setFriendSearchResults([]);
      setFriendSearchLoading(false);
      return;
    }
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    setFriendSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/social/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.users)) {
          setFriendSearchResults(data.users);
        }
      } catch {
        /* ignore */
      } finally {
        setFriendSearchLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [friendSearchQuery, token, friendsList.length, incomingRequests.length, outgoingRequests.length]);

  // Direct Message Polling when DM Modal is open
  const fetchDmMessages = async (partnerId: string) => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken || !partnerId) return;
    try {
      const res = await fetch(`${API_BASE}/api/social/dm/${partnerId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.messages)) {
        setDmMessages(data.messages);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!dmPartner?.id) return;
    void fetchDmMessages(dmPartner.id);
    const interval = window.setInterval(() => {
      void fetchDmMessages(dmPartner.id);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [dmPartner?.id, token]);

  const handleOpenDmModal = (partner: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    isPremium?: boolean;
    isVerified?: boolean;
  }) => {
    setActiveTab("messages");
    handleOpenChatWith({
      id: partner.id,
      name: partner.name,
      username: partner.username,
      avatarUrl: partner.avatarUrl,
      isPremium: Boolean(partner.isPremium),
      isVerified: Boolean(partner.isVerified),
      unreadCount: 0,
      lastMessage: null,
    });
  };

  const handleSendDmMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!dmPartner?.id || !dmInput.trim() || dmSending) return;
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    const textToSend = dmInput.trim();
    setDmSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/social/dm/${dmPartner.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: textToSend }),
      });
      const data = await res.json();
      if (data?.success) {
        setDmInput("");
        if (Array.isArray(data.messages)) {
          setDmMessages(data.messages);
        } else {
          await fetchDmMessages(dmPartner.id);
        }
        void fetchSocialData();
        setTimeout(() => {
          dmEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch {
      /* ignore */
    } finally {
      setDmSending(false);
    }
  };

  // Fetch conversations with friends
  const fetchConversations = async () => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/social/conversations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchActiveChatMessages = async (partnerId: string) => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken || !partnerId) return;
    try {
      const res = await fetch(`${API_BASE}/api/social/dm/${partnerId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.messages)) {
        setDmThreadMessages(data.messages);
      }
    } catch {
      /* ignore */
    }
  };

  // Poll conversations regularly
  useEffect(() => {
    if (!token) return;
    void fetchConversations();
    const interval = window.setInterval(() => {
      void fetchConversations();
    }, 3500);
    return () => window.clearInterval(interval);
  }, [token]);

  // When activeChatPartner is open, poll chat messages every 1.5s
  useEffect(() => {
    if (!activeChatPartner?.id) return;
    void fetchActiveChatMessages(activeChatPartner.id);
    void fetchConversations();
    const interval = window.setInterval(() => {
      void fetchActiveChatMessages(activeChatPartner.id);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [activeChatPartner?.id, token]);

  const handleOpenChatWith = (partner: any) => {
    setActiveChatPartner(partner);
    setDmThreadMessages([]);
    void fetchActiveChatMessages(partner.id);
    void fetchConversations();
    setTimeout(() => {
      dmThreadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleSendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeChatPartner?.id || !dmThreadInput.trim() || dmThreadSending) return;
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    const textToSend = dmThreadInput.trim();
    setDmThreadSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/social/dm/${activeChatPartner.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: textToSend }),
      });
      const data = await res.json();
      if (data?.success) {
        setDmThreadInput("");
        if (Array.isArray(data.messages)) {
          setDmThreadMessages(data.messages);
        } else {
          await fetchActiveChatMessages(activeChatPartner.id);
        }
        void fetchConversations();
        setTimeout(() => {
          dmThreadEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 80);
      } else if (data?.message) {
        alert(data.message);
      }
    } catch {
      /* ignore */
    } finally {
      setDmThreadSending(false);
    }
  };

  const handleSendFriendRequest = async (toUserId: string) => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/social/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ toUserId }),
      });
      const data = await res.json();
      if (data?.message) {
        setFriendActionMsg(data.message);
        setTimeout(() => setFriendActionMsg(null), 3500);
      }
      await fetchSocialData();
    } catch {
      /* ignore */
    }
  };

  const handleRespondFriendRequest = async (fromUserId: string, action: "accept" | "reject") => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/social/friends/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fromUserId, action }),
      });
      const data = await res.json();
      if (data?.message) {
        setFriendActionMsg(data.message);
        setTimeout(() => setFriendActionMsg(null), 3500);
      }
      await fetchSocialData();
    } catch {
      /* ignore */
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/social/friends/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (data?.message) {
        setFriendActionMsg(data.message);
        setTimeout(() => setFriendActionMsg(null), 3500);
      }
      await fetchSocialData();
    } catch {
      /* ignore */
    }
  };

  const sendSignal = async (type: "offer" | "answer" | "ice-candidate", payload: any) => {
    if (!activeRoomId) return;
    try {
      await fetch(`${API_BASE}/api/matchmaking/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoomId,
          clientId: clientIdRef.current,
          userId: user?.id || null,
          type,
          payload,
        }),
      });
    } catch {
      /* ignore */
    }
  };

  const handleIncomingSignal = async (signal: { id?: string; type: string; payload: any }) => {
    const pc = peerConnRef.current;
    if (!pc || !signal || !signal.type) return;

    try {
      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        while (iceCandidatesQueueRef.current.length > 0) {
          const cand = iceCandidatesQueueRef.current.shift();
          if (cand) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch {
              /* ignore candidate error */
            }
          }
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal("answer", answer);
      } else if (signal.type === "answer") {
        if (pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          while (iceCandidatesQueueRef.current.length > 0) {
            const cand = iceCandidatesQueueRef.current.shift();
            if (cand) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch {
                /* ignore candidate error */
              }
            }
          }
        }
      } else if (signal.type === "ice-candidate") {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
          } catch {
            /* ignore candidate error */
          }
        } else {
          iceCandidatesQueueRef.current.push(signal.payload);
        }
      }
    } catch (err) {
      console.warn("Signal handle error:", err);
    }
  };

  const triggerEnterMeeting = (
    partner: MatchedPartner,
    roomId: string | null,
    role: "caller" | "callee" = "callee"
  ) => {
    myRoleRef.current = role;
    setMatchedPartner(partner);
    setActiveRoomId(roomId);
    setIsSearching(false);
    setTransitionLoading(true);
    window.setTimeout(() => {
      setTransitionLoading(false);
      setInMeetingRoom(true);
      setIsMicMuted(false);
    }, 1300);
  };

  const isCreateRoomRoute = location.pathname.startsWith("/create-room");
  const isClubChatRoomRoute = location.pathname.startsWith("/chat-room");
  const effectiveClubRoomId = routeClubRoomId || activeClubRoom?.id || null;

  const handlePartnerExited = () => {
    if (isSearchingInRoom) return;
    stopMicStream();
    setTransitionLoading(true);
    window.setTimeout(() => {
      setTransitionLoading(false);
      setInMeetingRoom(false);
      setMatchedPartner(null);
      setActiveRoomId(null);
      setChatMessages([]);
      setChatOpen(false);
      setUnreadChatCount(0);
      setTimeoutNotice("Sherigingiz suhbatni tark etdi.");
    }, 1200);
  };

  // Search timer with 1-minute (60s) wait + automatic cross-language random speaker fallback
  const searchSecondsRef = useRef<number>(0);
  useEffect(() => {
    searchSecondsRef.current = searchSeconds;
  }, [searchSeconds]);

  useEffect(() => {
    const activeSearch = isSearching || isSearchingInRoom;
    if (!activeSearch) {
      setSearchSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setSearchSeconds((prev) => {
        const next = prev + 1;
        if (next >= MAX_SEARCH_SECONDS + 5) {
          // Only if even after 1m + 5s cross-language fallback nobody at all is online
          window.clearInterval(timer);
          if (isSearchingInRoom) {
            setIsSearchingInRoom(false);
            stopMicStream();
            void leaveMatchmakingServer();
            setInMeetingRoom(false);
            setMatchedPartner(null);
            setActiveRoomId(null);
          } else {
            stopMicStream();
            setIsSearching(false);
            void leaveMatchmakingServer();
          }
          setTimeoutNotice(
            "1 daqiqa ichida tanlangan tilda va boshqa tillarda bo'sh suhbatdosh topilmadi. Iltimos, qaytadan urinib ko'ring."
          );
          return 0;
        }
        return Math.min(next, MAX_SEARCH_SECONDS);
      });
    }, 1000);

    const pollInterval = window.setInterval(async () => {
      try {
        const allowCrossLang = searchSecondsRef.current >= MAX_SEARCH_SECONDS - 1;
        const res = await fetch(`${API_BASE}/api/matchmaking/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            userId: user?.id || null,
            language: speakerOption.id,
            allowAnyLanguage: allowCrossLang,
          }),
        });
        const data = await res.json();
        if (data?.status === "matched" && data.partner) {
          if (isSearchingInRoom) {
            myRoleRef.current = data.role || "callee";
            setMatchedPartner(data.partner);
            setActiveRoomId(data.roomId || null);
            setChatMessages([]);
            setUnreadChatCount(0);
            setIsPartnerSpeaking(false);
            setIsSearchingInRoom(false);
            setSearchSeconds(0);
          } else {
            triggerEnterMeeting(data.partner, data.roomId || null, data.role || "callee");
            setIsSearching(false);
          }
        } else if (data?.status === "timeout") {
          if (isSearchingInRoom) {
            setIsSearchingInRoom(false);
            stopMicStream();
            setInMeetingRoom(false);
            setMatchedPartner(null);
            setActiveRoomId(null);
          } else {
            stopMicStream();
            setIsSearching(false);
          }
          setTimeoutNotice(
            "1 daqiqa ichida bo'sh suhbatdosh topilmadi. Iltimos, qaytadan urinib ko'ring."
          );
        }
      } catch {
        /* ignore */
      }
    }, 950);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(pollInterval);
    };
  }, [isSearching, isSearchingInRoom, speakerOption.id, user?.id]);

  // Real-time Room Heartbeat, Chat, WebRTC Audio & Partner events
  useEffect(() => {
    if (!inMeetingRoom || !activeRoomId || isSearchingInRoom) return;

    // 1. Establish WebRTC PeerConnection for two-way live microphone audio
    let pc: RTCPeerConnection | null = null;
    try {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
        ],
      });
      peerConnRef.current = pc;
      iceCandidatesQueueRef.current = [];

      // Ensure explicit audio transceiver for desktop WebRTC
      try {
        pc.addTransceiver("audio", { direction: "sendrecv" });
      } catch {
        /* fallback */
      }

      // When remote audio track is received from the partner
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          const playPromise = remoteAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Desktop audio playback waiting for click gesture:", err);
            });
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void sendSignal("ice-candidate", event.candidate.toJSON());
        }
      };

      // Add our microphone audio tracks to the peer connection
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          pc?.addTrack(track, mediaStreamRef.current!);
        });
      }

      // If this peer is the caller, initiate the audio offer
      if (myRoleRef.current === "caller") {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false })
          .then((offer) => pc?.setLocalDescription(offer).then(() => offer))
          .then((offer) => {
            if (offer) void sendSignal("offer", offer);
          })
          .catch((err) => console.warn("WebRTC createOffer failed:", err));
      }
    } catch (pcErr) {
      console.warn("WebRTC setup error:", pcErr);
    }

    // 2. Connect to room SSE stream for 0ms chat, audio signaling & speaking delivery
    const sseQuery = `roomId=${encodeURIComponent(activeRoomId)}&clientId=${encodeURIComponent(
      clientIdRef.current
    )}&userId=${encodeURIComponent(user?.id || "")}`;

    let roomEs: EventSource | null = null;
    try {
      roomEs = new EventSource(`${API_BASE}/api/matchmaking/room-stream?${sseQuery}`);
      roomEs.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "chat_message" && payload.message) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === payload.message.id)) return prev;
              const isMine =
                payload.message.senderUsername ===
                (user?.username || displayName.toLowerCase());
              return [...prev, { ...payload.message, isMe: isMine }];
            });
            const isMine =
              payload.message.senderUsername ===
              (user?.username || displayName.toLowerCase());
            if (!isMine && !chatOpen) {
              setUnreadChatCount((c) => c + 1);
            }
          } else if (payload.type === "partner_speaking") {
            setIsPartnerSpeaking(Boolean(payload.speaking) && !payload.muted);
          } else if (payload.type === "webrtc_signal" && payload.signal) {
            if (!processedSignalIdsRef.current.has(payload.signal.id)) {
              processedSignalIdsRef.current.add(payload.signal.id);
              void handleIncomingSignal(payload.signal);
            }
          } else if (payload.type === "room_closed") {
            handlePartnerExited();
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* fallback */
    }

    let nextSigIdx = 0;
    const roomPoll = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/matchmaking/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            userId: user?.id || null,
            language: speakerOption.id,
            sinceSignalIndex: nextSigIdx,
          }),
        });
        const data = await res.json();
        if (data?.status === "idle") {
          handlePartnerExited();
        } else if (data?.status === "matched") {
          if (typeof data.nextSignalIndex === "number") {
            nextSigIdx = data.nextSignalIndex;
          }
          if (typeof data.partner?.speaking === "boolean") {
            setIsPartnerSpeaking(Boolean(data.partner.speaking) && !data.partner.muted);
          }
          if (Array.isArray(data.signals) && data.signals.length > 0) {
            for (const sig of data.signals) {
              if (!processedSignalIdsRef.current.has(sig.id)) {
                processedSignalIdsRef.current.add(sig.id);
                void handleIncomingSignal(sig);
              }
            }
          }
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setChatMessages((prev) => {
              const currentIds = new Set(prev.map((m) => m.id));
              const myUsername = (user?.username || displayName).toLowerCase();
              const newItems = data.messages
                .filter((m: any) => !currentIds.has(m.id))
                .map((m: any) => ({
                  ...m,
                  isMe: (m.senderUsername || "").toLowerCase() === myUsername,
                }));
              if (newItems.length > 0) {
                const partnerCount = newItems.filter((m: any) => !m.isMe).length;
                if (!chatOpen && partnerCount > 0) {
                  setUnreadChatCount((c) => c + partnerCount);
                }
                return [...prev, ...newItems];
              }
              return prev;
            });
          }
        }
      } catch {
        /* ignore */
      }
    }, 1200);

    return () => {
      window.clearInterval(roomPoll);
      roomEs?.close();
      if (peerConnRef.current) {
        peerConnRef.current.close();
        peerConnRef.current = null;
      }
      if (remoteAudioRef.current) {
        try {
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        } catch {
          /* ignore */
        }
      }
      processedSignalIdsRef.current.clear();
      iceCandidatesQueueRef.current = [];
    };
  }, [inMeetingRoom, activeRoomId, isSearchingInRoom, chatOpen, user?.username, displayName, speakerOption.id]);

  // Local Voice Volume Analyzer (Detect when I speak)
  useEffect(() => {
    if ((!inMeetingRoom && !isClubChatRoomRoute) || !mediaStreamRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(mediaStreamRef.current);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let lastReported = false;

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const mutedNow = isClubChatRoomRoute ? clubMicMuted : isMicMuted;
        const speakingNow = avg > 13 && !mutedNow;

        if (isClubChatRoomRoute) {
          setClubSpeakingNow(speakingNow);
        } else {
          setIsMySpeaking(speakingNow);
        }

        if (speakingNow !== lastReported) {
          lastReported = speakingNow;
          if (isClubChatRoomRoute && effectiveClubRoomId) {
            const authToken = token || localStorage.getItem("ls_token");
            if (authToken) {
              fetch(`${API_BASE}/api/clubs/${effectiveClubRoomId}/speaking`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  speaking: speakingNow,
                  muted: clubMicMuted,
                }),
              }).catch(() => {});
            }
          } else if (activeRoomId) {
            fetch(`${API_BASE}/api/matchmaking/speaking`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomId: activeRoomId,
                clientId: clientIdRef.current,
                userId: user?.id || null,
                speaking: speakingNow,
                muted: isMicMuted,
              }),
            }).catch(() => {});
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animFrameRef.current = requestAnimationFrame(checkVolume);
    } catch {
      /* ignore audio analyzer failure */
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inMeetingRoom, isClubChatRoomRoute, effectiveClubRoomId, isMicMuted, clubMicMuted, activeRoomId, user?.id, token]);

  // Club Room Polling & Microphone Initialization when inside /chat-room
  useEffect(() => {
    if (!isClubChatRoomRoute || !effectiveClubRoomId) return;

    const authToken = token || localStorage.getItem("ls_token");

    // Request mic if not active
    if (!mediaStreamRef.current && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        .then((stream) => {
          mediaStreamRef.current = stream;
          setClubMicMuted(false);
        })
        .catch(() => {
          /* ignore */
        });
    }

    const fetchClubRoomState = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clubs/${effectiveClubRoomId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.closed || !data?.room) {
          stopMicStream();
          setActiveClubRoom(null);
          setActiveTab("club");
          if (user?.slug) navigate(`/u/${user.slug}`, { replace: true });
          return;
        }
        const room: ClubRoom = data.room;
        if (
          user?.id &&
          Array.isArray(room.kickedUserIds) &&
          room.kickedUserIds.includes(String(user.id))
        ) {
          stopMicStream();
          setActiveClubRoom(null);
          setActiveTab("club");
          if (user?.slug) navigate(`/u/${user.slug}`, { replace: true });
          return;
        }

        // Sync admin-enforced mute on current user
        if (user?.id && Array.isArray(room.members)) {
          const meInRoom = room.members.find((m) => String(m.id) === String(user.id));
          if (meInRoom?.mutedByAdmin) {
            setClubMicMuted(true);
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getAudioTracks().forEach((t) => {
                t.enabled = false;
              });
            }
          }
        }

        // Track unread group chat messages
        const msgList = Array.isArray(room.messages) ? room.messages : [];
        if (msgList.length > prevClubMsgCountRef.current) {
          const diff = msgList.length - prevClubMsgCountRef.current;
          prevClubMsgCountRef.current = msgList.length;
          if (!clubChatOpen) {
            setClubUnreadChat((c) => c + diff);
          }
        } else {
          prevClubMsgCountRef.current = msgList.length;
        }

        setActiveClubRoom(room);
      } catch {
        /* ignore */
      }
    };

    void fetchClubRoomState();
    const interval = window.setInterval(fetchClubRoomState, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [isClubChatRoomRoute, effectiveClubRoomId, token, user?.id, user?.slug, clubChatOpen, navigate]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  useEffect(() => {
    if (clubChatOpen) {
      clubChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeClubRoom?.messages?.length, clubChatOpen]);

  if (user && !isCreateRoomRoute && !isClubChatRoomRoute && slug !== user.slug) {
    return <Navigate to={`/u/${user.slug}`} replace />;
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleConfirmEndMeeting = async () => {
    setEndMeetingModalOpen(false);
    setIsSearchingInRoom(false);
    stopMicStream();
    setTransitionLoading(true);

    try {
      await leaveMatchmakingServer();
    } catch {
      /* ignore */
    }

    window.setTimeout(() => {
      setTransitionLoading(false);
      setInMeetingRoom(false);
      setMatchedPartner(null);
      setActiveRoomId(null);
      setChatMessages([]);
      setChatOpen(false);
      setUnreadChatCount(0);
      setSelectedReasons([]);
      setComplaintDetails("");
      setComplaintSent(false);
    }, 1200);
  };

  // Skip current partner inside Meeting Chat Room ("O'tkazib yuborish")
  const handleSkipPartnerInRoom = async () => {
    if (isSearchingInRoom) return;
    const prevPartnerId = matchedPartner?.id || null;

    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      } catch {
        /* ignore */
      }
    }
    processedSignalIdsRef.current.clear();
    iceCandidatesQueueRef.current = [];

    setActiveRoomId(null);
    setChatMessages([]);
    setChatOpen(false);
    setUnreadChatCount(0);
    setIsPartnerSpeaking(false);
    setSearchSeconds(0);
    setIsSearchingInRoom(true);

    try {
      if (!mediaStreamRef.current && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      }

      const res = await fetch(`${API_BASE}/api/matchmaking/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          userId: user?.id || null,
          language: speakerOption.id,
          name: displayName,
          username: displayUsername,
          avatarUrl: user?.avatarUrl || null,
          skipPartnerId: prevPartnerId,
        }),
      });
      const data = await res.json();
      if (data?.status === "matched" && data.partner) {
        myRoleRef.current = data.role || "caller";
        setMatchedPartner(data.partner);
        setActiveRoomId(data.roomId || null);
        setIsSearchingInRoom(false);
        setSearchSeconds(0);
      }
    } catch {
      /* keep searching via poll */
    }
  };

  // Cancel searching while inside Meeting Chat Room ("Bekor qilish")
  const handleCancelInRoomSearch = async () => {
    setIsSearchingInRoom(false);
    setSearchSeconds(0);
    stopMicStream();
    await leaveMatchmakingServer();
    setInMeetingRoom(false);
    setMatchedPartner(null);
    setActiveRoomId(null);
  };

  // ── Club ("Klub") Actions ──
  const handleOpenCreateRoom = () => {
    setClubFormName("");
    setClubFormDesc("");
    setClubFormMaxMembers(2);
    setClubFormLang(CLUB_LANGUAGES[1]);
    setClubError(null);
    navigate("/create-room");
  };

  const handleCreateClubRoom = async (e: FormEvent) => {
    e.preventDefault();
    setClubError(null);
    const trimmedName = clubFormName.trim();
    if (!trimmedName) {
      setClubError("Iltimos, xona nomini kiriting.");
      return;
    }
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;

    setClubCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/clubs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          description: clubFormDesc.trim(),
          maxMembers: clubFormMaxMembers,
          language: clubFormLang.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data.room) {
        setClubError(data?.message || "Xonani yaratishda xatolik yuz berdi.");
        setClubCreating(false);
        return;
      }

      const createdRoom: ClubRoom = data.room;
      setActiveClubRoom(createdRoom);
      prevClubMsgCountRef.current = 0;
      setClubUnreadChat(0);
      setClubCreating(false);
      setTransitionLoading(true);
      window.setTimeout(() => {
        setTransitionLoading(false);
        navigate(`/chat-room/${createdRoom.id}`);
      }, 1150);
    } catch {
      setClubError("Server bilan bog'lanishda xatolik yuz berdi.");
      setClubCreating(false);
    }
  };

  const handleJoinOrEnterClubRoom = async (room: ClubRoom) => {
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;

    const myId = String(user?.id || "");
    const isAdmin = String(room.owner?.id) === myId;
    const isMember = room.members?.some((m) => String(m.id) === myId);
    const isPending = room.pendingRequests?.some((r) => String(r.id) === myId);

    let updatedRoom = room;
    if (!isAdmin && !isMember && !isPending) {
      try {
        const res = await fetch(`${API_BASE}/api/clubs/${room.id}/request-join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json().catch(() => null);
        if (data?.room) {
          updatedRoom = data.room;
        }
      } catch {
        /* ignore */
      }
    }

    setActiveClubRoom(updatedRoom);
    prevClubMsgCountRef.current = updatedRoom.messages?.length || 0;
    setClubUnreadChat(0);
    setTransitionLoading(true);
    window.setTimeout(() => {
      setTransitionLoading(false);
      navigate(`/chat-room/${room.id}`);
    }, 1150);
  };

  const handleSendClubJoinRequest = async () => {
    if (!activeClubRoom) return;
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/clubs/${activeClubRoom.id}/request-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data?.room) setActiveClubRoom(data.room);
    } catch {
      /* ignore */
    }
  };

  const handleRespondClubRequest = async (
    requestUserId: string,
    action: "approve" | "reject"
  ) => {
    if (!activeClubRoom) return;
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/clubs/${activeClubRoom.id}/respond-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ targetUserId: requestUserId, action }),
      });
      const data = await res.json();
      if (data?.room) setActiveClubRoom(data.room);
    } catch {
      /* ignore */
    }
  };

  const handleClubMemberAction = async (
    targetUserId: string,
    action: "toggle-mute" | "kick"
  ) => {
    if (!activeClubRoom) return;
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/clubs/${activeClubRoom.id}/member-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ targetUserId, action }),
      });
      const data = await res.json();
      if (data?.room) setActiveClubRoom(data.room);
    } catch {
      /* ignore */
    }
  };

  const handleToggleClubMic = async () => {
    if (!activeClubRoom) return;
    const meInRoom = activeClubRoom.members?.find(
      (m) => String(m.id) === String(user?.id)
    );
    if (meInRoom?.mutedByAdmin) {
      return; // Admin muted this user
    }
    const nextMuted = !clubMicMuted;
    setClubMicMuted(nextMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }
    const authToken = token || localStorage.getItem("ls_token");
    if (authToken) {
      fetch(`${API_BASE}/api/clubs/${activeClubRoom.id}/speaking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          speaking: !nextMuted && clubSpeakingNow,
          muted: nextMuted,
        }),
      }).catch(() => {});
    }
  };

  const handleSendClubMessage = async (e: FormEvent) => {
    e.preventDefault();
    const text = clubChatInput.trim();
    if (!text || !activeClubRoom) return;
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) return;
    setClubChatInput("");
    try {
      const res = await fetch(`${API_BASE}/api/clubs/${activeClubRoom.id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data?.room) setActiveClubRoom(data.room);
    } catch {
      /* ignore */
    }
  };

  const handleLeaveClubRoom = async () => {
    const roomIdToLeave = effectiveClubRoomId;
    stopMicStream();
    setClubChatOpen(false);
    setTransitionLoading(true);
    const authToken = token || localStorage.getItem("ls_token");
    if (authToken && roomIdToLeave) {
      try {
        await fetch(`${API_BASE}/api/clubs/${roomIdToLeave}/leave`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        /* ignore */
      }
    }
    void fetchSocialData();
    window.setTimeout(() => {
      setTransitionLoading(false);
      setActiveClubRoom(null);
      setActiveTab("club");
      if (user?.slug) {
        navigate(`/u/${user.slug}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }, 1000);
  };

  const handleStartOrStop = async () => {
    setMicError(null);
    setTimeoutNotice(null);

    if (isSearching) {
      stopMicStream();
      setIsSearching(false);
      await leaveMatchmakingServer();
      return;
    }

    if (requestingMic) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError(
        "Qurilmangizda mikrofon qo'llab-quvvatlanmaydi yoki brauzer ruxsat bermadi."
      );
      return;
    }

    setRequestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setSearchSeconds(0);
      setMatchedPartner(null);

      // Join the isolated language server pool for `speakerOption.id`
      const res = await fetch(`${API_BASE}/api/matchmaking/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          userId: user?.id || null,
          language: speakerOption.id,
          name: displayName,
          username: displayUsername,
          avatarUrl: user?.avatarUrl || null,
        }),
      });
      const data = await res.json();

      if (data?.status === "matched" && data.partner) {
        triggerEnterMeeting(data.partner, data.roomId || null, data.role || "caller");
      } else {
        setIsSearching(true);
      }
    } catch {
      setMicError(
        "Suhbatni boshlash uchun mikrofonga ruxsat berishingiz kerak. Iltimos, brauzer oynasida mikrofonga ruxsat bering."
      );
      setIsSearching(false);
    } finally {
      setRequestingMic(false);
    }
  };

  const handleToggleMic = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
    if (activeRoomId) {
      fetch(`${API_BASE}/api/matchmaking/speaking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoomId,
          clientId: clientIdRef.current,
          userId: user?.id || null,
          speaking: !next && isMySpeaking,
          muted: next,
        }),
      }).catch(() => {});
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !activeRoomId) return;

    setChatInput("");
    try {
      const res = await fetch(`${API_BASE}/api/matchmaking/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoomId,
          clientId: clientIdRef.current,
          userId: user?.id || null,
          text,
        }),
      });
      const data = await res.json();
      if (data?.message) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, { ...data.message, isMe: true }];
        });
      }
    } catch {
      /* ignore */
    }
  };

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmitComplaint = async () => {
    if (selectedReasons.length === 0 && !complaintDetails.trim()) return;
    setComplaintSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/matchmaking/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoomId,
          clientId: clientIdRef.current,
          userId: user?.id || null,
          partnerUsername: matchedPartner?.username,
          reasons: selectedReasons,
          details: complaintDetails,
        }),
      });
      setComplaintSent(true);
      if (token) {
        const pName = matchedPartner?.username ? `@${matchedPartner.username}` : "Suhbatdosh";
        const msgText = `[Shikoyat: ${pName}] Sabab: ${selectedReasons.join(", ")}. ${complaintDetails ? `Izoh: ${complaintDetails}` : ""}`;
        fetch(`${API_BASE}/api/auth/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: msgText }),
        }).then(() => fetchAdminMessages()).catch(() => {});
      }
      window.setTimeout(() => {
        setComplaintModalOpen(false);
        setComplaintSent(false);
        setSelectedReasons([]);
        setComplaintDetails("");
      }, 1500);
    } catch {
      /* ignore */
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const isDailyClaimed = dailyRemainingSec > 0;
  const dailyProgress = isDailyClaimed ? 5 : 0;

  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatTalkDuration = (seconds: number) => {
    const sec = Math.max(0, Number(seconds || 0));
    if (sec === 0) return `0 ${dt.stats.hours}`;
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);

    const hUnit = dt.stats.hours;
    const mUnit = lang === "ru" ? "мин." : lang === "en" ? "min" : lang === "tr" ? "dk" : lang === "ko" ? "분" : "daq";
    const sUnit = lang === "ru" ? "сек." : lang === "en" ? "sec" : lang === "tr" ? "sn" : lang === "ko" ? "초" : "son";

    if (hours > 0 && mins > 0) return `${hours} ${hUnit} ${mins} ${mUnit}`;
    if (hours > 0) return `${hours} ${hUnit}`;
    if (mins > 0) return `${mins} ${mUnit}`;
    return `${sec} ${sUnit}`;
  };

  const handleClaimDiamond = async () => {
    if (isDailyClaimed || claimingDaily) return;
    setClaimingDaily(true);

    // 1. Immediately update UI: fill green progress bar (5/5), add +5 diamonds, start 24h countdown
    const nowIso = new Date().toISOString();
    setLastDailyClaimAt(nowIso);
    setDailyRemainingSec(24 * 60 * 60);
    setDiamonds((prev) => {
      const next = prev + 5;
      try {
        localStorage.setItem(dailyDiamondsStorageKey, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    try {
      localStorage.setItem(dailyClaimStorageKey, nowIso);
    } catch {
      /* ignore */
    }

    // 2. Sync with backend & Supabase
    const authToken = token || localStorage.getItem("ls_token");
    if (!authToken) {
      setClaimingDaily(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/claim-daily`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data?.success) {
        if (typeof data.diamonds === "number") {
          setDiamonds((prev) => {
            const synced = Math.max(prev, data.diamonds);
            try {
              localStorage.setItem(dailyDiamondsStorageKey, String(synced));
            } catch {
              /* ignore */
            }
            return synced;
          });
        }
        if (data.lastDailyClaimAt) {
          setLastDailyClaimAt(data.lastDailyClaimAt);
          try {
            localStorage.setItem(dailyClaimStorageKey, data.lastDailyClaimAt);
          } catch {
            /* ignore */
          }
        }
        void refreshUser();
      } else if (data?.lastDailyClaimAt) {
        setLastDailyClaimAt(data.lastDailyClaimAt);
        try {
          localStorage.setItem(dailyClaimStorageKey, data.lastDailyClaimAt);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* keep optimistic local claim & +5 diamonds */
    } finally {
      setClaimingDaily(false);
    }
  };

  // Auto-unlock desktop WebRTC audio on user interaction
  useEffect(() => {
    if (!inMeetingRoom) return;
    const unlockDesktopAudio = () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        if (remoteAudioRef.current.srcObject) {
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    };
    unlockDesktopAudio();
    window.addEventListener("click", unlockDesktopAudio, { passive: true });
    window.addEventListener("keydown", unlockDesktopAudio, { passive: true });
    window.addEventListener("touchstart", unlockDesktopAudio, { passive: true });
    return () => {
      window.removeEventListener("click", unlockDesktopAudio);
      window.removeEventListener("keydown", unlockDesktopAudio);
      window.removeEventListener("touchstart", unlockDesktopAudio);
    };
  }, [inMeetingRoom]);

  // Devices & Sessions Handlers
  const loadDevices = async () => {
    try {
      setDevicesLoading(true);
      const token = localStorage.getItem("ls_token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/auth/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data?.devices) ? data.devices : (Array.isArray(data?.sessions) ? data.sessions : []);
      if (data?.success && Array.isArray(list)) {
        setDevices(list);
      }
    } catch (e) {
      console.warn("Failed to load devices", e);
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "devices") {
      void loadDevices();
    }
  }, [activeTab]);

  const handleRevokeDevice = async (sessionId: string) => {
    try {
      setDeviceActionLoading(sessionId);
      const token = localStorage.getItem("ls_token");
      const res = await fetch(`${API_BASE}/api/auth/devices/${sessionId}/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data?.success) {
        setDeviceMessage("Seans muvaffaqiyatli o'chirildi. Qurilma hisobdan chiqariladi.");
        await loadDevices();
      } else {
        setDeviceMessage(data?.error || "Seansni o'chirishda xatolik");
      }
    } catch {
      setDeviceMessage("Xatolik yuz berdi");
    } finally {
      setDeviceActionLoading(null);
    }
  };

  const handleBlockDevice = async (sessionId: string) => {
    if (!window.confirm("Rostdan ham ushbu qurilmani bloklamoqchimisiz? Ushbu qurilma hisobdan darhol chiqariladi va unga qayta kirish taqiqlanadi.")) {
      return;
    }
    try {
      setDeviceActionLoading(sessionId);
      const token = localStorage.getItem("ls_token");
      const res = await fetch(`${API_BASE}/api/auth/devices/${sessionId}/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data?.success) {
        setDeviceMessage("Qurilma bloklandi va uning barcha seanslari bekor qilindi.");
        await loadDevices();
      } else {
        setDeviceMessage(data?.error || "Qurilmani bloklashda xatolik");
      }
    } catch {
      setDeviceMessage("Xatolik yuz berdi");
    } finally {
      setDeviceActionLoading(null);
    }
  };

  const handleUnblockDevice = async (sessionId: string) => {
    try {
      setDeviceActionLoading(sessionId);
      const token = localStorage.getItem("ls_token");
      const res = await fetch(`${API_BASE}/api/auth/devices/${sessionId}/unblock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data?.success) {
        setDeviceMessage("Qurilma blokdan chiqarildi.");
        await loadDevices();
      } else {
        setDeviceMessage(data?.error || "Xatolik yuz berdi");
      }
    } catch {
      setDeviceMessage("Xatolik yuz berdi");
    } finally {
      setDeviceActionLoading(null);
    }
  };

  /* ══════════════════════════════════════════════════════════════════
      TAB VIEWS: Mobil va kompyuter uchun to'liq saxifalar
     ══════════════════════════════════════════════════════════════════ */

  const renderProfileView = () => (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-10">
      {/* ── Profile Header Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#120c2d]/90 via-[#0a071c]/95 to-[#0e0924]/90 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl"
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar with Glow Ring */}
          <div className="relative shrink-0 group">
            {user?.isPremium && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 tracking-widest shadow-[0_2px_8px_rgba(245,158,11,0.5)] border border-yellow-200 uppercase whitespace-nowrap">
                PREMIUM
              </span>
            )}
            <button
              type="button"
              onClick={handleOpenEditProfile}
              title="Profilni tahrirlash"
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-full p-0.5 transition-all duration-300 cursor-pointer overflow-hidden",
                user?.isPremium
                  ? "bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_35px_rgba(245,158,11,0.7)] ring-2 ring-amber-400/80"
                  : "bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 shadow-[0_0_25px_rgba(139,92,246,0.5)]"
              )}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0d0822] overflow-hidden">
                <SpeakerAvatar size={76} src={user?.avatarUrl} name={displayName} />
              </div>
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-full">
                <Camera className="h-5 w-5 text-white" />
                <span className="text-[9px] font-bold text-white mt-0.5">Tahrirlash</span>
              </div>
            </button>
            <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0d0822]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white truncate">{displayName}</h2>
              {user?.isPremium && <VerifiedBadge size={22} />}
              {user?.countryCode && (
                <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs">
                  <CountryFlag code={user.countryCode} width={20} className="h-3 w-4 rounded-xs" />
                  <span className="text-zinc-300 font-semibold">{user.countryCode}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-600/20 hover:bg-violet-600/35 text-violet-200 hover:text-white px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <Edit3 className="h-3.5 w-3.5 text-violet-300" />
                <span>Profilni tahrirlash</span>
              </button>
            </div>
            <p className="mt-0.5 text-xs font-mono font-medium text-violet-300">
              @{displayUsername}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400">
              {user?.email && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="truncate max-w-[240px]">{user.email}</span>
                </span>
              )}
              {user?.phone && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{user.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Stats Grid ── */}
        <div className="mt-6 grid grid-cols-3 gap-2.5 pt-5 border-t border-white/[0.08]">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-violet-300">
              <span>{diamonds}</span>
              <Gem className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-400 font-medium">{dt.profile.diamonds}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-amber-300">
              <span>{streakDays} {dt.stats.days}</span>
              <Flame className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-400 font-medium">{dt.profile.streak}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-cyan-300">
              <span>{formatLevel(userLevel, lang)}</span>
              <Zap className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-400 font-medium">{userXp} XP</p>
          </div>
        </div>

        {/* ── XP va Daraja Progress Bar (Telefon Profil saxifasi uchun) ── */}
        <div className="mt-3.5 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-indigo-500/10 p-3.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-cyan-300">
              <Zap className="h-4 w-4 text-cyan-400 fill-cyan-400" />
              {formatLevelTitle(userLevel, lang)}
            </span>
            <span className="font-mono font-bold text-white">
              {userXp} XP{" "}
              <span className="text-zinc-400 font-normal">({userXp % 100}/100 XP)</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(6, userXp % 100))}%` }}
            />
          </div>
        </div>

        {/* ── Action Buttons for Balance, Premium & Profilni tahrirlash ── */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleOpenEditProfile}
            className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-600/35 via-fuchsia-600/30 to-indigo-600/35 hover:border-violet-400 hover:brightness-110 py-2.5 px-3 text-xs font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.25)] transition-all cursor-pointer"
          >
            <Edit3 className="h-4 w-4 text-violet-300" />
            <span>Profilni tahrirlash</span>
          </button>

          <button
            type="button"
            onClick={() => setDepositModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-violet-400/40 py-2.5 px-3 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 text-violet-400" />
            <span>{dt.reward.topUp}</span>
          </button>

          <button
            type="button"
            onClick={() => setPremiumModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/90 via-purple-600/90 to-indigo-600/90 hover:brightness-110 py-2.5 px-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
          >
            <Crown className="h-4 w-4 text-amber-200" />
            <span>{dt.reward.buyPremium}</span>
          </button>
        </div>
      </div>

      {/* ── Barcha Menyu Tugmalari (Chap menyudan ko'chirilgan) ── */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-3.5 sm:p-5 shadow-xl backdrop-blur-2xl flex flex-col gap-1.5">
        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          {dt.profile.sectionsTitle}
        </p>

        {/* Tilni almashtirish */}
        <div className="flex items-center justify-between rounded-2xl p-3 bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Globe2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.profile.appLanguage}</p>
              <p className="text-[11px] text-zinc-400">{dt.profile.appLanguageDesc}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* 1. Mening tarixim */}
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400 group-hover:scale-105 transition-transform">
              <History className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.sidebar.history}</p>
              <p className="text-[11px] text-zinc-400">O'tkazilgan suhbatlar va mashg'ulotlar</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 1.1 Kunlik topshiriqlar */}
        <button
          type="button"
          onClick={() => setActiveTab("daily_tasks")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.sidebar.dailyTasks || "Kunlik topshiriqlar"}</p>
              <p className="text-[11px] text-zinc-400">Har kuni 5 tilda topshiriqlar (+1 olmos va XP)</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 1.2 Topshiriqli o'yin */}
        <button
          type="button"
          onClick={() => setActiveTab("task_game")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400 group-hover:scale-105 transition-transform">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.sidebar.taskGame || "Topshiriqli o'yin"}</p>
              <p className="text-[11px] text-zinc-400">Interaktiv til o'yini orqali XP va olmos yig'ing</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 1.3 Foydali kitoblar (Premium) */}
        <button
          type="button"
          onClick={() => setActiveTab("books")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15 text-amber-300 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white">{dt.sidebar.books || "Foydali kitoblar"}</p>
                {booksPremiumRequired && !user?.isPremium && (
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/45 bg-gradient-to-r from-amber-500/25 to-yellow-500/25 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                    <Crown className="h-2.5 w-2.5 text-amber-300" />
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                {!booksPremiumRequired
                  ? (lang === "ru" ? "Бесплатные электронные книги" : lang === "en" ? "Free ebooks for everyone" : lang === "tr" ? "Herkes için ücretsiz e-kitaplar" : lang === "ko" ? "모두를 위한 무료 전자책" : "Barcha uchun bepul elektron kitoblar")
                  : user?.isPremium
                  ? (lang === "ru" ? "Все книги открыты для вас" : lang === "en" ? "All ebooks unlocked for you" : lang === "tr" ? "Tüm kitaplar sizin için açık" : lang === "ko" ? "모든 도서 이용 가능" : "Siz uchun barcha kitoblar ochiq")
                  : (lang === "ru" ? "Электронные книги для Премиум" : lang === "en" ? "Ebooks for Premium users" : lang === "tr" ? "Premium kullanıcılar için e-kitaplar" : lang === "ko" ? "프리미엄 회원을 위한 전자책" : "Premium foydalanuvchilar uchun elektron kitoblar")}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 2. Do'stlar */}
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.sidebar.friends}</p>
              <p className="text-[11px] text-zinc-400">Suhbatdosh do'stlaringiz ro'yxati</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 2.1. Xabarlar */}
        <button
          type="button"
          onClick={() => setActiveTab("messages")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform relative">
              <MessageCircle className="h-5 w-5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-md">
                  {totalUnreadMessages}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.sidebar.messages || "Xabarlar"}</p>
              <p className="text-[11px] text-zinc-400">Do'stlar bilan yozishmalar va yangi xabarlar</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 3. Reyting */}
        <button
          type="button"
          onClick={() => setActiveTab("rating")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.profile.ratingTitle}</p>
              <p className="text-[11px] text-zinc-400">{dt.profile.ratingDesc}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 4. Yutuqlar */}
        <button
          type="button"
          onClick={() => setActiveTab("achievements")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <Award className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.profile.achievementsTitle}</p>
              <p className="text-[11px] text-zinc-400">{dt.profile.achievementsDesc}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>


        {/* 6. Yordam */}
        <button
          type="button"
          onClick={() => setActiveTab("help")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.profile.helpTitle}</p>
              <p className="text-[11px] text-zinc-400">{dt.profile.helpDesc}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 7. Shikoyat / Taklif */}
        <button
          type="button"
          onClick={() => setActiveTab("feedback")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.profile.feedbackTitle}</p>
              <p className="text-[11px] text-zinc-400">{dt.profile.feedbackDesc}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 8. Admin bilan bog'lanish */}
        <a
          href={import.meta.env.VITE_ADMIN_TELEGRAM || "https://t.me/lingospeek"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400 group-hover:scale-105 transition-transform">
              <Headset className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.profile.supportTitle}</p>
              <p className="text-[11px] text-zinc-400">{dt.profile.supportDesc}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </a>

        {/* 9. Chiqish */}
        <div className="pt-2 mt-1 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full flex items-center justify-between rounded-2xl p-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
                <LogOut className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-red-400">{dt.profile.logoutTitle}</p>
                <p className="text-[11px] text-red-400/60">{dt.profile.logoutDesc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-red-400/60 group-hover:text-red-300 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{dt.sidebar.history}</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Oxirgi marta speaking va chat qilib gaplashgan speakerlar tarixi
            </p>
          </div>
        </div>
        <span className="self-start sm:self-center rounded-full border border-violet-500/30 bg-violet-500/15 px-4 py-1.5 text-xs font-bold text-violet-300">
          {talkHistory.length} ta speaker
        </span>
      </div>

      {talkHistory.length === 0 ? (
        <div className="w-full rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-10 flex flex-col items-center justify-center min-h-[46vh] text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 text-violet-300 mb-5 shadow-[0_0_35px_rgba(139,92,246,0.25)]">
            <History className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-white">Hozircha suhbatlar tarixi mavjud emas</h3>
          <p className="mt-2.5 max-w-md mx-auto text-sm text-zinc-400 leading-relaxed">
            Suhbatdoshlar bilan speaking yoki chat qilib gaplashganingizdan so'ng ularning ro'yxati shu yerda saqlanadi.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Suhbatni boshlash</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {talkHistory.map((item, idx) => {
            const talkedDate = item.talkedAt
              ? new Date(item.talkedAt).toLocaleString("uz-UZ", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Yaqinda";
            return (
              <div
                key={`${item.partnerId}_${idx}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/85 p-4 sm:p-5 shadow-lg backdrop-blur-xl hover:border-violet-500/35 transition-all"
              >
                {/* Left: Avatar + Name + Username */}
                <div className="flex items-center gap-4 min-w-0">
                  <SpeakerAvatar
                    name={item.name}
                    avatarUrl={item.avatarUrl}
                    isPremium={Boolean(item.isPremium)}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm sm:text-base font-bold text-white">
                        {item.name}
                      </p>
                      {(item.isPremium || item.isVerified) && <VerifiedBadge size={16} />}
                    </div>
                    <p className="truncate text-xs font-medium text-violet-300 mt-0.5">
                      @{item.username}
                    </p>
                  </div>
                </div>

                {/* Right: Message button + Last talked timestamp */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 border-white/[0.06] pt-3 sm:pt-0">
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
                    <Clock className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span>Oxirgi suhbat: <strong className="text-white">{talkedDate}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleOpenDmModal({
                        id: item.partnerId,
                        name: item.name,
                        username: item.username,
                        avatarUrl: item.avatarUrl,
                        isPremium: item.isPremium,
                        isVerified: item.isVerified,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] hover:brightness-110 transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Xabar yozish</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderFriendsView = () => (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/15 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{dt.sidebar.friends}</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Ism yoki @username orqali foydalanuvchilarni toping, do'stlashing va suhbatlashing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3.5 py-1 text-xs font-bold text-sky-300">
            Do'stlar: {friendsList.length}
          </span>
          {incomingRequests.length > 0 && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 animate-pulse">
              Takliflar: {incomingRequests.length}
            </span>
          )}
        </div>
      </div>

      {friendActionMsg && (
        <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{friendActionMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFriendActionMsg(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Layout: Left (Search + Accepted Friends) | Right (Incoming Friend Requests) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Search Users + Accepted Friends List */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* 1. Search Box Card */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-sky-400" />
                <span>Foydalanuvchilarni qidirish</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ism yoki @username yozing (masalan: <span className="text-sky-300 font-semibold">ozod</span>)
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                placeholder="Ism yoki @username orqali qidiring..."
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
              />
              {friendSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFriendSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Results List */}
            {friendSearchQuery.trim().length > 0 && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06] max-h-[360px] overflow-y-auto pr-1">
                {friendSearchLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                    <span>Qidirilmoqda...</span>
                  </div>
                ) : friendSearchResults.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    "{friendSearchQuery}" bo'yicha foydalanuvchi topilmadi
                  </div>
                ) : (
                  friendSearchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 hover:border-sky-500/35 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SpeakerAvatar
                          name={u.name}
                          avatarUrl={u.avatarUrl}
                          isPremium={Boolean(u.isPremium)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-bold text-white">{u.name}</p>
                            {(u.isPremium || u.isVerified) && <VerifiedBadge size={15} />}
                          </div>
                          <p className="truncate text-xs text-sky-300">@{u.username}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {u.relation === "friends" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Do'stlar</span>
                          </span>
                        ) : u.relation === "outgoing" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Yuborilgan</span>
                          </span>
                        ) : u.relation === "incoming" ? (
                          <button
                            type="button"
                            onClick={() => void handleRespondFriendRequest(u.id, "accept")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Qabul qilish</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleSendFriendRequest(u.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:brightness-110 transition-all cursor-pointer"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Do'stlashish</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 2. Accepted Friends List Card (Qabul qilingan do'stlar ro'yxati) */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Qabul qilingan do'stlar ro'yxati
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Sizning tasdiqlangan do'stlaringiz
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-300">
                {friendsList.length} ta
              </span>
            </div>

            {friendsList.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2.5" />
                <p className="text-sm font-semibold text-zinc-300">Hozircha qabul qilingan do'stlar yo'q</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Yuqoridagi qidiruv orqali foydalanuvchilarni topib, do'stlik taklifi yuboring.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {friendsList.map((fr) => (
                  <div
                    key={fr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SpeakerAvatar
                        name={fr.name}
                        avatarUrl={fr.avatarUrl}
                        isPremium={Boolean(fr.isPremium)}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-white">{fr.name}</p>
                          {(fr.isPremium || fr.isVerified) && <VerifiedBadge size={15} />}
                        </div>
                        <p className="truncate text-xs text-violet-300">@{fr.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("messages");
                          handleOpenChatWith({
                            id: fr.id,
                            name: fr.name,
                            username: fr.username,
                            avatarUrl: fr.avatarUrl,
                            isPremium: Boolean(fr.isPremium),
                            isVerified: Boolean(fr.isVerified),
                            unreadCount: 0,
                            lastMessage: null,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 hover:bg-violet-500/25 px-3.5 py-2 text-xs font-bold text-violet-200 transition-all cursor-pointer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Xabar yozish</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleRemoveFriend(fr.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/35 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-bold text-red-300 transition-all cursor-pointer"
                        title="Do'stlar ro'yxatidan o'chirish"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Incoming Friend Requests ("Do'stlik taklifi") */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">Do'stlik taklifi</h2>
                  <p className="text-[11px] text-zinc-400">
                    Sizga yuborilgan do'stlashish so'rovlari
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-300">
                {incomingRequests.length}
              </span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="py-12 text-center">
                <UserPlus className="h-10 w-10 text-zinc-600 mx-auto mb-2.5" />
                <p className="text-sm font-semibold text-zinc-300">Yangi do'stlik takliflari yo'q</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Kimdir sizga do'stlashish taklifini yuborsa, shu yerda ko'rinadi.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id || req.fromUserId}
                    className="flex flex-col gap-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SpeakerAvatar
                        name={req.name}
                        avatarUrl={req.avatarUrl}
                        isPremium={Boolean(req.isPremium)}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-white">{req.name}</p>
                          {(req.isPremium || req.isVerified) && <VerifiedBadge size={15} />}
                        </div>
                        <p className="truncate text-xs text-amber-300">@{req.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => void handleRespondFriendRequest(req.fromUserId, "accept")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Qabul qilish</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRespondFriendRequest(req.fromUserId, "reject")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/35 bg-red-500/10 hover:bg-red-500/20 py-2 text-xs font-bold text-red-300 transition-all cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Rad etish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesView = () => {
    // If a chat partner is selected, show the active chat conversation view!
    if (activeChatPartner) {
      return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-h-[820px] rounded-3xl border border-white/[0.1] bg-[#0c0820]/90 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 sm:px-6 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setActiveChatPartner(null);
                  void fetchConversations();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition-colors cursor-pointer"
                title="Yozishmalar ro'yxatiga qaytish"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{lang === "ru" ? "Назад" : lang === "en" ? "Back" : lang === "tr" ? "Geri" : lang === "ko" ? "뒤로" : "Orqaga"}</span>
              </button>

              <div className="relative">
                <SpeakerAvatar
                  name={activeChatPartner.name}
                  avatarUrl={activeChatPartner.avatarUrl}
                  isPremium={Boolean(activeChatPartner.isPremium)}
                  size={40}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-sm sm:text-base font-bold text-white">
                    {activeChatPartner.name}
                  </h2>
                  {(activeChatPartner.isPremium || activeChatPartner.isVerified) && (
                    <VerifiedBadge size={15} />
                  )}
                </div>
                <p className="truncate text-xs text-violet-300">@{activeChatPartner.username}</p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              {lang === "ru" ? "Друг" : lang === "en" ? "Friend" : lang === "tr" ? "Arkadaş" : lang === "ko" ? "친구" : "Do'st"}
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 text-xs">
            {dmThreadMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-2">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {activeChatPartner.name} bilan xabarlar tarixi bo'sh
                </p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Birinchi bo'lib salom deb yozing va suhbatni boshlang!
                </p>
              </div>
            ) : (
              dmThreadMessages.map((m, idx) => {
                const isMine = String(m.fromUserId) === String(user?.id);
                const timeStr = m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <div
                    key={m.id || idx}
                    className={cn(
                      "flex flex-col max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm leading-snug",
                      isMine
                        ? "ml-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm"
                        : "mr-auto bg-white/[0.06] border border-white/10 text-zinc-100 rounded-bl-sm"
                    )}
                  >
                    {/* Sender Full Name Header */}
                    <div className="flex items-center justify-between gap-3 mb-0.5">
                      <span className="text-[10px] font-bold opacity-90 truncate max-w-[160px]">
                        {isMine ? (user?.name || dt.meeting.you || "Siz") : (m.senderName || activeChatPartner.name)}
                      </span>
                    </div>

                    {/* Text */}
                    <p className="text-xs sm:text-[13px] whitespace-pre-wrap break-words">{m.text}</p>

                    {/* Footer: Time + Read Status */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 self-end">
                      <span className="text-[9.5px] opacity-70 font-mono">{timeStr}</span>
                      {isMine && (
                        m.read ? (
                          <span title="O'qildi" className="flex items-center text-sky-300">
                            <CheckCheck className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span title="Yuborildi" className="flex items-center text-white/60">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={dmThreadEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSendChatMessage}
            className="flex items-center gap-2 border-t border-white/[0.08] bg-[#090518] p-3 sm:p-4"
          >
            <input
              type="text"
              placeholder={`@${activeChatPartner.username} ga xabar yozing...`}
              value={dmThreadInput}
              onChange={(e) => setDmThreadInput(e.target.value)}
              maxLength={500}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!dmThreadInput.trim() || dmThreadSending}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50 hover:brightness-110 transition-all cursor-pointer shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{dt.meeting.send || "Yuborish"}</span>
            </button>
          </form>
        </div>
      );
    }

    // Default: List of Conversations
    const filteredConversations = conversations.filter((c) => {
      const q = messagesSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.username && c.username.toLowerCase().includes(q))
      );
    });

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{dt.sidebar.messages || "Xabarlar"}</h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Do'stlaringiz bilan shaxsiy yozishmalar va yangi xabarlar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3.5 py-1 text-xs font-bold text-blue-300">
              {lang === "ru" ? "Диалоги" : lang === "en" ? "Conversations" : lang === "tr" ? "Sohbetler" : lang === "ko" ? "대화목록" : "Suhbatlar"}: {conversations.length}
            </span>
            {totalUnreadMessages > 0 && (
              <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-3.5 py-1 text-xs font-bold text-sky-300 animate-pulse">
                {totalUnreadMessages} ta o'qilmagan
              </span>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={messagesSearchQuery}
            onChange={(e) => setMessagesSearchQuery(e.target.value)}
            placeholder="Ism yoki @username orqali xabarlarni qidirish..."
            className="w-full rounded-2xl border border-white/15 bg-white/[0.04] pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {messagesSearchQuery && (
            <button
              type="button"
              onClick={() => setMessagesSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex flex-col gap-3">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-[#0c0820]/60 p-10 text-center backdrop-blur-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400 mb-3">
                <MessageCircle className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white">Hozircha hech qanday do'stingiz yo'q</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Xabar yozish uchun avval "Do'stlar" bo'limiga o'tib, boshqa foydalanuvchilarga do'stlik taklifini yuboring yoki takliflarini qabul qiling.
              </p>
              <Button
                variant="glow"
                size="sm"
                onClick={() => setActiveTab("friends")}
                className="mt-4"
              >
                Do'stlar bo'limiga o'tish
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-xs text-zinc-400">
              "{messagesSearchQuery}" bo'yicha suhbatlar topilmadi
            </div>
          ) : (
            filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenChatWith(c)}
                className="group flex items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-[#0c0820]/75 p-4 sm:p-4.5 hover:border-blue-500/50 hover:bg-white/[0.04] transition-all cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.18)]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar with unread badge */}
                  <div className="relative shrink-0">
                    <SpeakerAvatar
                      name={c.name}
                      avatarUrl={c.avatarUrl}
                      isPremium={Boolean(c.isPremium)}
                      size={46}
                    />
                    {c.unreadCount > 0 && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-extrabold text-white shadow-[0_0_12px_rgba(37,99,235,0.7)] ring-2 ring-[#0c0820] animate-pulse">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Info & Last message snippet */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                        {c.name}
                      </h3>
                      {(c.isPremium || c.isVerified) && <VerifiedBadge size={15} />}
                      <span className="truncate text-xs text-zinc-500">@{c.username}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {c.lastMessage ? (
                        <p className={cn(
                          "truncate text-xs",
                          c.unreadCount > 0 ? "text-white font-semibold" : "text-zinc-400"
                        )}>
                          {c.lastMessage.isMe && (
                            <span className="text-violet-300 font-semibold mr-1">
                              Siz:
                            </span>
                          )}
                          {c.lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-zinc-500 italic text-[11px]">
                          Yozishmani boshlash uchun bosing
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Timestamp and Arrow */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {c.lastMessage?.createdAt && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {c.lastMessage?.isMe && (
                    c.lastMessage.read ? (
                      <span title="O'qildi" className="flex items-center text-sky-400">
                        <CheckCheck className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span title="Yuborildi" className="flex items-center text-zinc-500">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )
                  )}
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderRatingView = () => {
    const sortedList = [...leaderboard].sort((a, b) => {
      if (ratingSort === "diamonds") return b.diamonds - a.diamonds;
      if (ratingSort === "streak") return b.streakDays - a.streakDays;
      if (ratingSort === "talk") return b.talkSeconds - a.talkSeconds;
      if (ratingSort === "xp") return (b.xp || 0) - (a.xp || 0);
      return b.score - a.score;
    });

    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">{dt.sidebar.rating}</h1>
              <p className="text-xs text-zinc-400">
                Eng ko'p olmos yig'gan, XP darajasi yuqori, har kuni faol bo'lgan va soatlab speaking qilgan foydalanuvchilar reytingi
              </p>
            </div>
          </div>

          {/* Sort Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: lang === "ru" ? "Общий" : lang === "en" ? "Overall" : lang === "tr" ? "Genel" : lang === "ko" ? "전체" : "Umumiy", icon: Trophy },
              { id: "xp", label: lang === "ru" ? "XP и Уровень" : lang === "en" ? "XP & Level" : lang === "tr" ? "XP ve Seviye" : lang === "ko" ? "XP 및 레벨" : "XP va Daraja", icon: Zap },
              { id: "diamonds", label: lang === "ru" ? "Больше алмазов" : lang === "en" ? "Most Diamonds" : lang === "tr" ? "En Çok Elmas" : lang === "ko" ? "최다 다이아몬드" : "Ko'p olmoslar", icon: Gem },
              { id: "streak", label: lang === "ru" ? "Активные" : lang === "en" ? "Top Streak" : lang === "tr" ? "En Yüksek Seri" : lang === "ko" ? "연속 출석" : "Doimiy faollar", icon: Flame },
              { id: "talk", label: lang === "ru" ? "Больше разговоров" : lang === "en" ? "Speaking Time" : lang === "tr" ? "Konuşma Süresi" : lang === "ko" ? "대화 시간" : "Ko'p speaking", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = ratingSort === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRatingSort(tab.id as any)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                    active
                      ? "border-amber-400/50 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Leaderboard List */}
        {sortedList.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[42vh] text-center px-4">
            <Trophy className="h-12 w-12 text-amber-400 mb-3" />
            <h3 className="text-lg font-bold text-white">
              {lang === "ru" ? "Рейтинг загружается..." : lang === "en" ? "Loading leaderboard..." : lang === "tr" ? "Sıralama yükleniyor..." : lang === "ko" ? "랭킹 로딩 중..." : "Reyting yuklanmoqda..."}
            </h3>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedList.map((item, index) => {
              const pos = index + 1;
              const isMe = String(item.id) === String(user?.id);
              const itemXp = item.xp ?? 0;
              const itemLevel = item.level ?? Math.floor(itemXp / 100) + 1;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all",
                    pos === 1
                      ? "border-amber-400/45 bg-gradient-to-r from-amber-500/15 via-[#0b071b]/90 to-[#0b071b]/90 shadow-[0_0_25px_rgba(245,158,11,0.12)]"
                      : pos === 2
                      ? "border-slate-300/35 bg-gradient-to-r from-slate-400/10 via-[#0b071b]/90 to-[#0b071b]/90"
                      : pos === 3
                      ? "border-orange-400/35 bg-gradient-to-r from-orange-500/10 via-[#0b071b]/90 to-[#0b071b]/90"
                      : isMe
                      ? "border-violet-500/45 bg-violet-500/10"
                      : "border-white/[0.08] bg-[#0b071b]/85"
                  )}
                >
                  {/* Left: Rank + Avatar + Name */}
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm border",
                        pos === 1
                          ? "border-amber-300 bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                          : pos === 2
                          ? "border-slate-300 bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950"
                          : pos === 3
                          ? "border-orange-300 bg-gradient-to-br from-orange-400 to-amber-700 text-white"
                          : "border-white/10 bg-white/[0.04] text-zinc-300"
                      )}
                    >
                      {pos <= 3 ? <Medal className="h-5 w-5" /> : `#${pos}`}
                    </div>

                    <SpeakerAvatar
                      name={item.name}
                      avatarUrl={item.avatarUrl}
                      isPremium={Boolean(item.isPremium)}
                      size="md"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="truncate text-sm sm:text-base font-bold text-white">
                          {item.name}
                        </p>
                        {(item.isPremium || item.isVerified) && <VerifiedBadge size={16} />}
                        <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-extrabold text-cyan-300">
                          <Zap className="h-2.5 w-2.5 fill-cyan-400 text-cyan-400" />
                          {formatLevel(itemLevel, lang)}
                        </span>
                        {isMe && (
                          <span className="rounded-md bg-violet-500/25 border border-violet-400/40 px-2 py-0.5 text-[10px] font-bold text-violet-200">
                            {dt.meeting.you || "Siz"}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-zinc-400 mt-0.5">@{item.username}</p>
                    </div>
                  </div>

                  {/* Right: 4 Metrics (XP, Diamonds, Streak Days, Speaking Time) */}
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 border-t sm:border-t-0 border-white/[0.06] pt-3 sm:pt-0">
                    <div className="flex items-center gap-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5">
                      <Zap className="h-3.5 w-3.5 text-cyan-300 fill-cyan-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-[10px] text-zinc-400 leading-none">
                          {lang === "ru" ? "XP / Уровень" : lang === "en" ? "XP / Level" : lang === "tr" ? "XP / Seviye" : lang === "ko" ? "XP / 레벨" : "XP Daraja"}
                        </p>
                        <p className="text-xs font-extrabold text-white tabular-nums mt-0.5">
                          {itemXp} XP
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-1.5">
                      <Gem className="h-3.5 w-3.5 text-violet-300 shrink-0" />
                      <div className="text-left">
                        <p className="text-[10px] text-zinc-400 leading-none">Olmos</p>
                        <p className="text-xs font-extrabold text-white tabular-nums mt-0.5">
                          {item.diamonds}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-[10px] text-zinc-400 leading-none">Faollik</p>
                        <p className="text-xs font-extrabold text-white tabular-nums mt-0.5">
                          {item.streakDays} kun
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-[10px] text-zinc-400 leading-none">Speaking</p>
                        <p className="text-xs font-extrabold text-white tabular-nums mt-0.5">
                          {formatTalkDuration(item.talkSeconds)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
      KUNLIK TOPSHIRIQLAR (Daily Tasks — 5 languages, auto daily rotation, A1 -> C1)
     ══════════════════════════════════════════════════════════════════ */
  const renderDailyTasksView = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCompletedIds = completedDailyTasks[todayStr] || [];
    const {
      tasks: dailyTasks,
      activeTier,
      progressionTitle,
      progressionDescription,
    } = getDailyTasksForUser(taskLang, todayStr, totalTasksCompleted);

    const completedForLangCount = dailyTasks.filter(
      (t) => todayCompletedIds.includes(t.id) || Boolean(taskSubmittedResult[t.id])
    ).length;

    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-12">
        {/* Top Header Row (No outer box border — fits full page like Bosh sahifa) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/35 bg-cyan-500/15 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {dt.sidebar.dailyTasks || "Kunlik topshiriqlar"}
                </h1>
                <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300">
                  Har bir topshiriq = +1 💎 Olmos + XP
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                5 ta tildan xohlaganingizni tanlang — topshiriqlar har kuni avtomatik yangilanadi va osondan qiyinga (A1 → C1) sekin-asta o'sib boradi.
              </p>
            </div>
          </div>

          {/* Right Stats Pill */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-center">
              <p className="text-[10px] text-cyan-200/80 uppercase font-bold">{formatLevelTitle(userLevel, lang)}</p>
              <p className="text-xs sm:text-sm font-black text-white flex items-center justify-center gap-1 mt-0.5">
                <Zap className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
                <span>{formatLevel(userLevel, lang)} • {userXp} XP</span>
              </p>
            </div>
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-2 text-center">
              <p className="text-[10px] text-violet-200/80 uppercase font-bold">Bugun bajarildi</p>
              <p className="text-xs sm:text-sm font-black text-white mt-0.5">
                {completedForLangCount} / {dailyTasks.length}
              </p>
            </div>
          </div>
        </div>

        {/* 5 Language Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {LANGUAGES.map((l) => {
            const isSelected = taskLang === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setTaskLang(l.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white shadow-[0_0_20px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-[#0b071b]/80 text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                )}
              >
                <CountryFlag code={l.flagCode} width={20} className="h-4 w-6 rounded-[3px] shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-xs sm:text-sm font-extrabold text-white">{getLocalizedLangName(l.id, lang, l.name)}</p>
                  <p className="truncate text-[10px] text-zinc-400">
                    {LANGUAGE_META[l.id].subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Gradual Progression Banner */}
        <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-cyan-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold", TIER_META[activeTier].badgeClass)}>
                {TIER_META[activeTier].label}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">{progressionTitle}</span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {progressionDescription}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sana: <strong className="text-white">{todayStr}</strong></span>
            </span>
          </div>
        </div>

        {/* Toast Feedback */}
        {taskToastMsg && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3.5 text-xs sm:text-sm font-bold text-emerald-200 flex items-center justify-between shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Gem className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>{taskToastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setTaskToastMsg(null)}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Daily Task Cards List (Ordered Easy -> Harder) */}
        <div className="flex flex-col gap-4">
          {dailyTasks.map((task, idx) => {
            const isCompletedOnServer = todayCompletedIds.includes(task.id);
            const selectedIdx = taskSelectedAnswers[task.id];
            const submitState = taskSubmittedResult[task.id];
            const isLocked = Boolean(submitState) || isCompletedOnServer;
            const isAnsweredWrong = submitState === "wrong";
            const isAnsweredCorrect =
              submitState === "correct" || (isCompletedOnServer && !isAnsweredWrong);
            const tierInfo = TIER_META[task.tier];

            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-3xl border p-5 sm:p-6 backdrop-blur-2xl transition-all",
                  isAnsweredCorrect
                    ? "border-emerald-500/40 bg-emerald-500/[0.06] shadow-[0_0_25px_rgba(16,185,129,0.08)]"
                    : isAnsweredWrong
                    ? "border-red-500/40 bg-red-500/[0.05] shadow-[0_0_25px_rgba(239,68,68,0.08)]"
                    : "border-white/[0.08] bg-[#0b071b]/85 hover:border-violet-500/30"
                )}
              >
                {/* Card Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-xs font-extrabold text-white">
                      #{idx + 1}
                    </span>
                    <span className={cn("rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold", tierInfo.badgeClass)}>
                      {task.tierLabel}
                    </span>
                    <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                      {task.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-xl border border-violet-500/35 bg-violet-500/15 px-2.5 py-1 text-xs font-extrabold text-violet-200">
                      <Gem className="h-3.5 w-3.5 text-violet-300" />
                      +1 Olmos
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/35 bg-cyan-500/15 px-2.5 py-1 text-xs font-extrabold text-cyan-200">
                      <Zap className="h-3.5 w-3.5 text-cyan-300 fill-cyan-300" />
                      +{task.xpReward} XP
                    </span>
                    {isAnsweredCorrect && (
                      <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/45 bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                        To'g'ri topshirildi
                      </span>
                    )}
                    {isAnsweredWrong && (
                      <span className="inline-flex items-center gap-1 rounded-xl border border-red-500/45 bg-red-500/20 px-3 py-1 text-xs font-extrabold text-red-300">
                        <X className="h-3.5 w-3.5" />
                        Noto'g'ri topshirildi
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed mb-1.5">
                  {task.prompt}
                </h3>
                {task.hint && (
                  <p className="text-xs text-zinc-400 mb-4">💡 Maslahat: {task.hint}</p>
                )}

                {/* Answer Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                  {task.options.map((opt, optIdx) => {
                    const isPicked = selectedIdx === optIdx;
                    const showCorrect = isLocked && optIdx === task.correctIndex;
                    const showWrong =
                      isLocked && isAnsweredWrong && isPicked && optIdx !== task.correctIndex;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          if (isLocked) return;
                          setTaskSelectedAnswers((prev) => {
                            const next = { ...prev, [task.id]: optIdx };
                            try {
                              localStorage.setItem(taskAnswersStorageKey, JSON.stringify(next));
                            } catch {
                              /* ignore */
                            }
                            return next;
                          });
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-xs sm:text-sm font-semibold transition-all",
                          isLocked ? "cursor-not-allowed" : "cursor-pointer",
                          showCorrect
                            ? "border-emerald-400/70 bg-emerald-500/25 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                            : showWrong
                            ? "border-red-500/70 bg-red-500/25 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.2)]"
                            : isLocked
                            ? "border-white/[0.06] bg-white/[0.02] text-zinc-500 opacity-65"
                            : isPicked
                            ? "border-cyan-400/60 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(34,211,238,0.18)]"
                            : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                        )}
                      >
                        <span>
                          <strong
                            className={cn(
                              "mr-2",
                              showCorrect
                                ? "text-emerald-300"
                                : showWrong
                                ? "text-red-300"
                                : "text-zinc-400"
                            )}
                          >
                            {String.fromCharCode(65 + optIdx)}.
                          </strong>
                          {opt}
                        </span>
                        {showCorrect && <Check className="h-4 w-4 text-emerald-300 shrink-0" />}
                        {showWrong && <X className="h-4 w-4 text-red-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation or Submit Bar */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                  {isAnsweredCorrect ? (
                    <div className="text-xs text-emerald-300 leading-relaxed">
                      <strong>✓ To'g'ri javob! (+1 💎 va +{task.xpReward} XP):</strong>{" "}
                      {task.explanation}
                    </div>
                  ) : isAnsweredWrong ? (
                    <div className="text-xs text-red-300 leading-relaxed">
                      <strong>
                        ✕ Noto'g'ri javob! To'g'ri javob —{" "}
                        {String.fromCharCode(65 + task.correctIndex)}.{" "}
                        {task.options[task.correctIndex]}:
                      </strong>{" "}
                      <span className="text-zinc-300">{task.explanation}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400">
                      To'g'ri javobni belgilab, <strong className="text-zinc-200">Topshirish</strong> tugmasini bosing.
                    </div>
                  )}

                  {!isLocked && (
                    <button
                      type="button"
                      disabled={selectedIdx === undefined || submittingTaskId === task.id}
                      onClick={() => void handleSubmitDailyTaskAnswer(task)}
                      className="self-end sm:self-center inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:brightness-110 disabled:opacity-45 transition-all cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>
                        {submittingTaskId === task.id
                          ? "Tekshirilmoqda..."
                          : "Topshirish (+1 💎 va XP)"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
      TOPSHIRIQLI O'YIN (Interactive Language Challenge Game)
     ══════════════════════════════════════════════════════════════════ */
  const renderTaskGameView = () => {
    const currentQ = gameQuestions[gameIndex];

    const handleSelectGameOption = (optIdx: number) => {
      if (gameResultState !== "idle" || gameFinished || !currentQ) return;
      setGameSelectedOption(optIdx);

      if (optIdx === currentQ.correctIndex) {
        setGameResultState("correct");
        setGameCorrectCount((prev) => prev + 1);
      } else {
        setGameResultState("wrong");
        const nextLives = gameLives - 1;
        setGameLives(nextLives);
        if (nextLives <= 0) {
          setTimeout(() => {
            setGameFinished(true);
            void handleFinishGameClaim(gameCorrectCount);
          }, 900);
        }
      }
    };

    const handleNextGameQuestion = () => {
      if (!currentQ) return;
      if (gameIndex + 1 >= gameQuestions.length) {
        setGameFinished(true);
        void handleFinishGameClaim(gameCorrectCount);
      } else {
        setGameIndex((prev) => prev + 1);
        setGameSelectedOption(null);
        setGameResultState("idle");
      }
    };

    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-12">
        {/* Header Row (No outer box border — fits full page) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-500/35 bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_25px_rgba(217,70,239,0.25)]">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {dt.sidebar.taskGame || "Topshiriqli o'yin"}
              </h1>
              <p className="text-xs text-zinc-400">
                Osondan qiyinga qarab ketma-ket savollarni yeching, XP darajangizni oshiring va bonus olmos yutib oling!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startNewTaskGame(gameLang)}
            className="self-start sm:self-center inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 text-xs font-bold text-zinc-200 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>{lang === "ru" ? "Начать заново" : lang === "en" ? "Restart" : lang === "tr" ? "Yeniden başlat" : lang === "ko" ? "다시 시작" : "Qayta boshlash"}</span>
          </button>
        </div>

        {/* 5 Language Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {LANGUAGES.map((l) => {
            const active = gameLang === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setGameLang(l.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer",
                  active
                    ? "border-fuchsia-400/50 bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 text-white shadow-[0_0_20px_rgba(217,70,239,0.2)]"
                    : "border-white/10 bg-[#0b071b]/80 text-zinc-300 hover:bg-white/[0.07]"
                )}
              >
                <CountryFlag code={l.flagCode} width={20} className="h-4 w-6 rounded-[2px] shrink-0" />
                <span className="truncate text-xs sm:text-sm font-bold">{getLocalizedLangName(l.id, lang, l.name)}</span>
              </button>
            );
          })}
        </div>

        {/* Game Arena */}
        {gameFinished ? (
          <div className="rounded-3xl border border-fuchsia-500/35 bg-[#0b071b]/90 p-8 text-center shadow-2xl backdrop-blur-2xl flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500/25 to-violet-600/25 border border-fuchsia-400/40 text-fuchsia-300 shadow-[0_0_35px_rgba(217,70,239,0.3)]">
              <Trophy className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              O'yin yakunlandi!
            </h2>
            <p className="text-sm text-zinc-300 max-w-md">
              Siz <strong>{gameQuestions.length}</strong> ta savoldan{" "}
              <strong className="text-emerald-300">{gameCorrectCount}</strong> tasiga to'g'ri javob berdingiz.
            </p>

            {gameClaimedReward ? (
              <div className="flex flex-wrap items-center justify-center gap-3 my-2">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-sm font-black text-violet-200">
                  <Gem className="h-4 w-4 text-violet-300" />
                  <span>+{gameClaimedReward.diamondReward} Olmos qo'shildi</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-sm font-black text-cyan-200">
                  <Zap className="h-4 w-4 text-cyan-300 fill-cyan-300" />
                  <span>+{gameClaimedReward.xpEarned} XP qo'shildi</span>
                </div>
              </div>
            ) : gameClaiming ? (
              <p className="text-xs text-zinc-400">Mukofotlar hisobingizga yozilmoqda...</p>
            ) : null}

            <button
              type="button"
              onClick={() => startNewTaskGame(gameLang)}
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-7 py-3 text-xs sm:text-sm font-extrabold text-white shadow-[0_0_25px_rgba(217,70,239,0.45)] hover:brightness-110 transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Yana o'ynash</span>
            </button>
          </div>
        ) : currentQ ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col gap-5">
            {/* Status Bar: Progress, Lives, Correct */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-fuchsia-500/35 bg-fuchsia-500/15 px-3 py-1 text-xs font-extrabold text-fuchsia-300">
                  Bosqich: {gameIndex + 1} / {gameQuestions.length}
                </span>
                <span className={cn("rounded-xl border px-3 py-1 text-xs font-extrabold", TIER_META[currentQ.tier].badgeClass)}>
                  {currentQ.tierLabel}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300">
                  <span>Jonlar:</span>
                  <span>{"❤️".repeat(Math.max(0, gameLives)) || "🖤"}</span>
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  <Check className="h-3.5 w-3.5" />
                  <span>To'g'ri: {gameCorrectCount}</span>
                </div>
              </div>
            </div>

            {/* Question */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-400 mb-1">
                {currentQ.category}
              </p>
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-relaxed">
                {currentQ.prompt}
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = gameSelectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                const revealCorrect = gameResultState !== "idle" && isCorrect;
                const revealWrong = gameResultState === "wrong" && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={gameResultState !== "idle"}
                    onClick={() => handleSelectGameOption(idx)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border p-4 text-left text-xs sm:text-sm font-bold transition-all cursor-pointer",
                      revealCorrect
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        : revealWrong
                        ? "border-red-500/60 bg-red-500/20 text-red-200"
                        : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:border-fuchsia-500/40"
                    )}
                  >
                    <span>
                      <strong className="mr-2 text-fuchsia-300">
                        {String.fromCharCode(65 + idx)}.
                      </strong>
                      {opt}
                    </span>
                    {revealCorrect && <Check className="h-4 w-4 text-emerald-300 shrink-0" />}
                    {revealWrong && <X className="h-4 w-4 text-red-300 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Result & Next Button */}
            {gameResultState !== "idle" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/[0.07] animate-in fade-in">
                <div
                  className={cn(
                    "text-xs leading-relaxed font-medium",
                    gameResultState === "correct" ? "text-emerald-300" : "text-amber-300"
                  )}
                >
                  <strong>
                    {gameResultState === "correct" ? "✅ Barakalla, to'g'ri!" : "❌ Xato javob!"}
                  </strong>{" "}
                  {currentQ.explanation}
                </div>

                {gameLives > 0 && (
                  <button
                    type="button"
                    onClick={handleNextGameQuestion}
                    className="self-end sm:self-center inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:brightness-110 transition-all cursor-pointer shrink-0"
                  >
                    <span>
                      {gameIndex + 1 >= gameQuestions.length
                        ? "Natijani ko'rish"
                        : "Keyingi savol"}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
      FOYDALI KITOBLAR (Premium-Gated Books Library uploaded by Admin)
     ══════════════════════════════════════════════════════════════════ */
  const renderBooksView = () => {
    const isVip = Boolean(user?.isPremium);
    const canAccessBooks = isVip || !booksPremiumRequired;

    const resolveMediaUrl = (url: string | null | undefined) => {
      if (!url) return "";
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
        return url;
      }
      return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    const handleDownloadBook = async (e: React.MouseEvent, fileUrl: string, fileName: string) => {
      e.preventDefault();
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Faylni yuklab bo'lmadi");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName || "kitob";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch {
        window.open(fileUrl, "_blank");
      }
    };

    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-12">
        {/* Header Row (No outer box border — fits full page) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {dt.sidebar.books || "Foydali kitoblar"}
                </h1>
                {booksPremiumRequired ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/45 bg-gradient-to-r from-amber-500/25 to-yellow-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    <Crown className="h-3 w-3 text-amber-300" />
                    Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/45 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    <Sparkles className="h-3 w-3 text-emerald-300" />
                    Bepul / Ochiq
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Til o'rganish va speaking mahoratini oshirish uchun saralangan elektron kitoblar va qo'llanmalar
              </p>
            </div>
          </div>

          {!canAccessBooks ? (
            <button
              type="button"
              onClick={() => setPremiumModalOpen(true)}
              className="self-start sm:self-center inline-flex items-center gap-2 rounded-2xl border border-amber-400/45 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110 transition-all cursor-pointer"
            >
              <Crown className="h-4 w-4" />
              <span>{dt.sidebar.premium || "Premium olish"}</span>
            </button>
          ) : !booksPremiumRequired ? (
            <span className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-extrabold text-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span>{lang === "ru" ? "Бесплатный доступ — Все книги открыты" : lang === "en" ? "Free access — All books unlocked" : lang === "tr" ? "Ücretsiz erişim — Tüm kitaplar açık" : lang === "ko" ? "무료 이용 — 모든 도서 개방" : "Bepul kirish — Barcha kitoblar ochiq"}</span>
            </span>
          ) : (
            <span className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-extrabold text-emerald-300">
              <Crown className="h-4 w-4 text-amber-300" />
              <span>{lang === "ru" ? "Премиум активен — Все книги открыты" : lang === "en" ? "Premium active — All books unlocked" : lang === "tr" ? "Premium aktif — Tüm kitaplar açık" : lang === "ko" ? "프리미엄 활성 — 모든 도서 이용 가능" : "Premium faol — Barcha kitoblar ochiq"}</span>
            </span>
          )}
        </div>

        {/* Non-Premium Warning Banner */}
        {!canAccessBooks && (
          <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-300 shrink-0" />
              <p className="text-xs sm:text-sm text-amber-100">
                Ushbu bo'limdagi kitoblarni o'qish va yuklab olish uchun hisobingizda{" "}
                <strong className="text-amber-300">Premium (VIP)</strong> maqomi bo'lishi kerak.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPremiumModalOpen(true)}
              className="self-start sm:self-center shrink-0 rounded-xl bg-amber-400/20 border border-amber-400/40 px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-400/30 transition-all cursor-pointer"
            >
              Batafsil
            </button>
          </div>
        )}

        {/* Books Grid */}
        {booksList.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[42vh] text-center px-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-300 mb-4 border border-amber-500/25">
              <BookOpen className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-white">Hozircha kitoblar yuklanmagan</h3>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-sm">
              Tez orada ma'muriyat tomonidan yangi foydali kitoblar va o'quv qo'llanmalari joylanadi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {booksList.map((book) => {
              const coverSrc = resolveMediaUrl(book.coverUrl);
              const fileHref = resolveMediaUrl(book.fileUrl);

              return (
                <div
                  key={book.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b071b]/90 shadow-xl backdrop-blur-2xl hover:border-amber-500/40 transition-all"
                >
                  {/* Book Cover */}
                  <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-violet-950/60 via-[#120b2e] to-amber-950/40 flex items-center justify-center">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={book.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="h-14 w-14 text-amber-300/50" />
                    )}
                    {!booksPremiumRequired ? (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-emerald-300">
                        <Sparkles className="h-3 w-3 text-emerald-300" />
                        <span>BEPUL</span>
                      </div>
                    ) : !isVip ? (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-amber-300">
                        <Crown className="h-3 w-3 text-amber-300" />
                        <span>PRO</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Book Content */}
                  <div className="flex flex-1 flex-col justify-between p-5 gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-white line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {book.bio || "Til o'rganuvchilar uchun maxsus elektron qo'llanma."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500 truncate max-w-[130px]">
                        📄 {book.fileName || "Kitob fayli"}
                      </span>

                      {canAccessBooks ? (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadBook(e, fileHref, book.fileName || book.title)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.35)] hover:brightness-110 transition-all cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Yuklab olish</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPremiumModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3.5 py-2 text-xs font-bold text-amber-300 transition-all cursor-pointer"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Faqat Premium uchun</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAchievementsView = () => (
    <div className="w-full flex flex-col items-center justify-center min-h-[58vh] text-center px-4 animate-in fade-in duration-200">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 mb-5 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
        <Award className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-white">Hozircha yutuqlar ochilmagan</h3>
      <p className="mt-2.5 max-w-md mx-auto text-sm text-zinc-400 leading-relaxed">
        Kunlik ketma-ketlik va suhbatlar orqali yangi nishonlar va sovrinlarni qo'lga kiriting.
      </p>

      <button
        type="button"
        onClick={() => setActiveTab("home")}
        className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <Play className="h-4 w-4 fill-white" />
        <span>Suhbatni boshlash</span>
      </button>
    </div>
  );

  const renderDevicesView = () => (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{dt.sidebar.devices}</h1>
            <p className="text-xs text-zinc-400">Akkauntga ulangan qurilmalar, ularning IP manzili va seans nazorati</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDevices}
          disabled={devicesLoading}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
        >
          <span>{devicesLoading ? "Yuklanmoqda..." : "Yangilash"}</span>
        </button>
      </div>

      {deviceMessage && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3.5 text-xs font-medium text-violet-300 flex items-center justify-between animate-in fade-in">
          <span>{deviceMessage}</span>
          <button
            type="button"
            onClick={() => setDeviceMessage(null)}
            className="text-zinc-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {devicesLoading && devices.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-400">
          Qurilmalar ro'yxati tekshirilmoqda...
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-8 text-center backdrop-blur-2xl">
          <Laptop className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Faol seanslar topilmadi</h3>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {devices.map((dev) => {
            const isMobile =
              dev.deviceName.toLowerCase().includes("android") ||
              dev.deviceName.toLowerCase().includes("iphone") ||
              dev.deviceName.toLowerCase().includes("mobile");
            const Icon = isMobile ? Smartphone : Laptop;
            const isLoading = deviceActionLoading === dev.id;

            return (
              <div
                key={dev.id}
                className={cn(
                  "rounded-2xl border p-4 backdrop-blur-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  dev.isBlocked
                    ? "border-red-500/30 bg-red-500/5 opacity-80"
                    : dev.current
                    ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.06)]"
                    : "border-white/[0.08] bg-[#0b071b]/80"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                      dev.isBlocked
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : dev.current
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                        : "border-white/10 bg-white/[0.04] text-zinc-300"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">{dev.deviceName}</p>
                      {dev.current && (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          Joriy qurilma
                        </span>
                      )}
                      {dev.isBlocked && (
                        <span className="rounded-md border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                          Bloklangan
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                      <span>IP: <strong className="text-zinc-300">{dev.ip || "Noma'lum"}</strong></span>
                      <span>•</span>
                      <span>
                        Oxirgi faollik:{" "}
                        <strong className="text-zinc-300">
                          {dev.lastActiveAt
                            ? new Date(dev.lastActiveAt).toLocaleString("uz-UZ", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Hozirgina"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {!dev.current && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {dev.isBlocked ? (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleUnblockDevice(dev.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                      >
                        <span>{isLoading ? "..." : "Blokdan chiqarish"}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleRevokeDevice(dev.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
                          title="Seansni o'chirish"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{isLoading ? "..." : "Seansni o'chirish"}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleBlockDevice(dev.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all cursor-pointer"
                          title="Seansni bloklash"
                        >
                          <Ban className="h-3.5 w-3.5 text-red-400" />
                          <span>{isLoading ? "..." : "Bloklash"}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderHelpView = () => (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{dt.help.title}</h1>
          <p className="text-xs text-zinc-400">{dt.help.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {dt.help.faqs.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 backdrop-blur-xl"
          >
            <h3 className="text-sm font-bold text-white mb-1.5">{item.q}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const handleSendFeedback = async (e: FormEvent) => {
    e.preventDefault();
    const textToSend = feedbackText.trim();
    if (!textToSend || !token || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: textToSend }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackText("");
        setFeedbackSuccessMsg("Murojaatingiz ma'muriyatga muvaffaqiyatli yetkazildi!");
        setTimeout(() => setFeedbackSuccessMsg(null), 4000);
        await fetchAdminMessages();
      }
    } catch (err) {
      console.warn("Feedback send error", err);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const renderFeedbackView = () => {
    const sortedFeedMessages = [...adminMessages].sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tA - tB;
    });

    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{dt.feedback.title}</h1>
            <p className="text-xs text-zinc-400">{dt.feedback.subtitle}</p>
          </div>
        </div>

        {/* 1. Murojaat yozish formasi */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Yangi murojaat yoki taklif yuborish</h3>
          </div>

          {feedbackSuccessMsg && (
            <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-3.5 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{feedbackSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSendFeedback} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                {dt.feedback.label}
              </label>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={dt.feedback.placeholder || "Taklif, fikr yoki shikoyatingizni batafsil bayon qiling..."}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!feedbackText.trim() || feedbackSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 hover:brightness-110 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{feedbackSubmitting ? "Yuborilmoqda..." : dt.feedback.submit || "Yuborish"}</span>
            </button>
          </form>
        </div>

        {/* 2. Yuborilgan xabarlar va Admin javoblari tarixi */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Yuborilgan xabarlar tarixi</h3>
                <p className="text-[11px] text-zinc-400">Sizning murojaatlaringiz va Admin javoblari</p>
              </div>
            </div>
            <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 text-[11px] font-mono font-bold text-violet-300">
              {sortedFeedMessages.length} ta xabar
            </span>
          </div>

          {sortedFeedMessages.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              Hozircha hech qanday murojaat yuborilmagan. Yuqoridagi shakl orqali o'z fikr yoki shikoyatingizni qoldiring.
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[440px] overflow-y-auto pr-1">
              {sortedFeedMessages.map((msg, idx) => {
                const isAdmin = Boolean(msg.isAdmin || msg.sender === "Admin");
                const timeStr = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                });

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl p-4 max-w-[88%] text-xs shadow-md transition-all ${
                        isAdmin
                          ? "rounded-tr-none border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-purple-600/20 to-indigo-600/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                          : "rounded-tl-none border border-white/10 bg-white/[0.04] text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {isAdmin ? (
                          <span className="flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            👑 Ma'muriyat (Admin javobi)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-md bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                            👤 Sizning murojaatingiz
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 font-mono">{timeStr}</span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderClubListView = () => {
    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200 pb-12">
        {/* Top bar with Xona yaratish button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-300 mb-2">
              <Users className="h-3.5 w-3.5 text-violet-400" />
              <span>Jamoaviy suhbat klublari</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Klublar va Suhbat Xonalari</h1>
            <p className="text-xs text-zinc-400 mt-1">
              O'zingiz xona yarating yoki boshqalar yaratgan ko'p kishilik suhbat xonalariga qo'shiling
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateRoom}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.45)] hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Xona yaratish</span>
          </button>
        </div>

        {/* Rooms list */}
        {clubRooms.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-12 text-center backdrop-blur-2xl flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 text-violet-300 shadow-[0_0_25px_rgba(139,92,246,0.25)]">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hozircha faol xonalar yo'q</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md">
                Birinchi bo'lib o'z suhbat xonangizni yarating va boshqa foydalanuvchilar bilan jamoa bo'lib suhbatlashing!
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateRoom}
              className="mt-1 inline-flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Xona yaratish</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {clubRooms.map((room) => {
              const langItem =
                CLUB_LANGUAGES.find((l) => l.id === room.language) || CLUB_LANGUAGES[1];
              const currentCount = room.memberCount || room.members?.length || 1;
              const isFull = currentCount >= room.maxMembers;
              const isMyRoom = String(room.owner?.id) === String(user?.id);
              const isApprovedMember = room.members?.some(
                (m) => String(m.id) === String(user?.id)
              );

              return (
                <div
                  key={room.id}
                  className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-violet-500/35 transition-all"
                >
                  {/* Left: Admin Profile + Room Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
                    {/* Admin Avatar + Name + Username */}
                    <div className="flex items-center gap-3.5 shrink-0">
                      <SpeakerAvatar
                        size={54}
                        src={room.owner?.avatarUrl}
                        name={room.owner?.name}
                        isPremium={Boolean(room.owner?.isPremium)}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white truncate">
                            {room.owner?.name}
                          </span>
                          {(room.owner?.isPremium || room.owner?.isVerified) && (
                            <VerifiedBadge size={15} />
                          )}
                          <span className="rounded-md bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                            Admin
                          </span>
                        </div>
                        <p className="text-xs font-mono text-violet-300 truncate">
                          @{room.owner?.username}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block h-10 w-px bg-white/[0.08]" />

                    {/* Room Name & Description */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white truncate">{room.name}</h3>
                      {room.description ? (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                          {room.description}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Jamoaviy jonli ovozli muloqot xonasi
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Room Language, Capacity & Join Button */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
                    {/* Room Language */}
                    <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white">
                      <CountryFlag
                        code={langItem.flagCode}
                        width={20}
                        className="h-3.5 w-5 rounded-[2px]"
                      />
                      <span>{langItem.name}</span>
                    </div>

                    {/* Member Count / Capacity */}
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-200 tabular-nums">
                      <Users className="h-3.5 w-3.5 text-violet-400" />
                      <span>
                        {currentCount} / {room.maxMembers} kishi
                      </span>
                    </div>

                    {/* Xonaga qo'shilish button */}
                    <button
                      type="button"
                      disabled={isFull && !isMyRoom && !isApprovedMember}
                      onClick={() => void handleJoinOrEnterClubRoom(room)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
                        isFull && !isMyRoom && !isApprovedMember
                          ? "border border-white/10 bg-white/5 text-zinc-500 cursor-not-allowed"
                          : "border border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-95"
                      )}
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>
                        {isMyRoom || isApprovedMember
                          ? "Xonaga kirish"
                          : isFull
                          ? "Xona to'lgan"
                          : "Xonaga qo'shilish"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Full-Screen /create-room Page (No menubar, no sidebar)
  const renderCreateRoomPage = () => {
    const otherUsersCount = Math.max(1, clubFormMaxMembers - 1);
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-[#0b071b]/90 p-6 sm:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("club");
                  if (user?.slug) navigate(`/u/${user.slug}`);
                  else navigate(-1);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                title="Orqaga qaytish"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Yangi Xona Yaratish</h1>
                <p className="text-xs text-zinc-400">
                  Ko'pchilik jamoa bo'lib gaplashish uchun klub xonasini sozlang
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <SpeakerAvatar
                size={32}
                src={user?.avatarUrl}
                name={displayName}
                isPremium={Boolean(user?.isPremium)}
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{displayName}</p>
                <p className="text-[10px] font-mono text-violet-300">@{displayUsername}</p>
              </div>
            </div>
          </div>

          {clubError && (
            <div className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{clubError}</span>
            </div>
          )}

          <form onSubmit={handleCreateClubRoom} className="mt-6 flex flex-col gap-5">
            {/* 1. Xona nomini kiritish inputi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Xona nomi
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={clubFormName}
                onChange={(e) => setClubFormName(e.target.value)}
                placeholder="Masalan: IELTS Speaking Club 7.5+ yoki Kundalik Ingliz tili"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* 2. Xona haqida batafsil ma'lumot kiritish inputi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Xona haqida batafsil ma'lumot
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={clubFormDesc}
                onChange={(e) => setClubFormDesc(e.target.value)}
                placeholder="Suhbat mavzusi, qoidalar yoki qatnashuvchilar uchun qisqacha ma'lumot yozing..."
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 leading-relaxed"
              />
            </div>

            {/* 3. Xonaga kiradigan foydalanuvchilar soni (2 dan 99 kishilikgacha kalendar shaklida) */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Foydalanuvchilar soni (2 kishilikdan — 99 kishilikgacha)
                </label>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-500/15 px-3 py-1 text-xs font-extrabold text-violet-200">
                  <Users className="h-3.5 w-3.5 text-violet-400" />
                  <span>{clubFormMaxMembers} kishilik xona</span>
                </span>
              </div>

              {/* Kalendar shaklidagi sig'im tanlash paneli (20 tadan qismlar, Pagination & Back) */}
              <CalendarCapacityPicker
                value={clubFormMaxMembers}
                onChange={(val) => setClubFormMaxMembers(val)}
              />

            </div>

            {/* 4. Xonaning tilini tanlash dropdowni (5 ta til) */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Xonaning tili (5 ta tildan birini tanlang)
              </label>
              <button
                type="button"
                onClick={() => setClubLangDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.07] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CountryFlag
                    code={clubFormLang.flagCode}
                    width={40}
                    className="h-4 w-6 rounded-[2px]"
                  />
                  <span className="text-sm font-bold text-white">{clubFormLang.name}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-400 transition-transform",
                    clubLangDropdownOpen && "rotate-180 text-violet-300"
                  )}
                />
              </button>

              {clubLangDropdownOpen && (
                <div className="absolute left-0 right-0 top-[76px] z-40 rounded-2xl border border-white/15 bg-[#120b2d]/95 p-1.5 shadow-2xl backdrop-blur-2xl flex flex-col gap-1">
                  {CLUB_LANGUAGES.map((l) => {
                    const active = l.id === clubFormLang.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setClubFormLang(l);
                          setClubLangDropdownOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer",
                          active
                            ? "bg-violet-600/25 text-white font-bold"
                            : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CountryFlag
                            code={l.flagCode}
                            width={40}
                            className="h-4 w-6 rounded-[2px]"
                          />
                          <span className="text-xs sm:text-sm">{l.name}</span>
                        </div>
                        {active && <Check className="h-4 w-4 text-violet-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Xonani yaratish tugmasi */}
            <button
              type="submit"
              disabled={clubCreating || !clubFormName.trim()}
              className="mt-2 w-full inline-flex items-center justify-center gap-2.5 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-3.5 px-6 text-sm font-extrabold text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
            >
              {clubCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Yaratilmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Xonani yaratish</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Full-Screen /chat-room Page (No menubar, no sidebar)
  const renderClubChatRoomPage = () => {
    if (!activeClubRoom) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center">
          <AiLoader showText={false} />
          <p className="mt-4 text-xs text-zinc-400">Xona ma'lumotlari yuklanmoqda...</p>
        </div>
      );
    }

    const myId = String(user?.id || "");
    const isRoomAdmin = String(activeClubRoom.owner?.id) === myId;
    const isApprovedMember = activeClubRoom.members?.some(
      (m) => String(m.id) === myId
    );
    const isPendingRequest = activeClubRoom.pendingRequests?.some(
      (r) => String(r.id) === myId
    );
    const meMemberObj = activeClubRoom.members?.find(
      (m) => String(m.id) === myId
    );
    const langObj =
      CLUB_LANGUAGES.find((l) => l.id === activeClubRoom.language) || CLUB_LANGUAGES[1];

    return (
      <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto gap-6">
        {/* ── 1. TEPADA: Xonani yaratgan Adminning Avatar rasmi, Ismi, Usernamesi va Xona ma'lumotlari ── */}
        <div className="rounded-3xl border border-white/[0.1] bg-[#0b071b]/90 p-5 sm:p-6 shadow-[0_15px_45px_rgba(0,0,0,0.65)] backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <SpeakerAvatar
                size={64}
                src={activeClubRoom.owner?.avatarUrl}
                name={activeClubRoom.owner?.name}
                isPremium={Boolean(activeClubRoom.owner?.isPremium)}
              />
              <span className="absolute -bottom-1 -right-1 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-black shadow">
                Admin
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {activeClubRoom.owner?.name}
                </h2>
                {(activeClubRoom.owner?.isPremium || activeClubRoom.owner?.isVerified) && (
                  <VerifiedBadge size={16} />
                )}
              </div>
              <p className="text-xs font-mono text-violet-300">
                @{activeClubRoom.owner?.username}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Xona yaratuvchisi (Klub rahbari)
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1.5">
            <h1 className="text-base sm:text-xl font-bold text-white">
              {activeClubRoom.name}
            </h1>
            {activeClubRoom.description && (
              <p className="text-xs text-zinc-400 max-w-md">{activeClubRoom.description}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white">
                <CountryFlag
                  code={langObj.flagCode}
                  width={20}
                  className="h-3.5 w-5 rounded-[2px]"
                />
                <span>{langObj.name}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200 tabular-nums">
                <Users className="h-3.5 w-3.5 text-violet-400" />
                <span>
                  {activeClubRoom.members?.length || 1} / {activeClubRoom.maxMembers} kishi
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. O'RTADA: Desktopda 2 ustunli (Chapda So'rovnomalar, O'ngda Ruxsat olgan foydalanuvchilar) ── */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* CHAP TOMONDA: Xonaga qo'shilishga so'rovnoma tashlagan foydalanuvchilar */}
          <div className="md:col-span-5 rounded-3xl border border-white/[0.1] bg-[#0b071b]/85 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Qo'shilish so'rovnomalari
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Xonaga kirish uchun ruxsat so'ragan foydalanuvchilar
                </p>
              </div>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 text-xs font-bold text-amber-300 tabular-nums">
                {activeClubRoom.pendingRequests?.length || 0}
              </span>
            </div>

            {!isApprovedMember && !isRoomAdmin && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col gap-2.5">
                {isPendingRequest ? (
                  <p className="font-semibold">
                    ⏳ Sizning so'rovnomangiz yuborilgan. Xona admini qabul qilishini kuting...
                  </p>
                ) : (
                  <>
                    <p>Xonada gaplashish uchun adminga so'rovnoma yuboring:</p>
                    <button
                      type="button"
                      onClick={() => void handleSendClubJoinRequest()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:brightness-110 transition-all cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Qo'shilish so'rovnomasini yuborish</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {(!activeClubRoom.pendingRequests ||
              activeClubRoom.pendingRequests.length === 0) ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Hozircha yangi so'rovnomalar yo'q
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                {activeClubRoom.pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SpeakerAvatar
                        size={44}
                        src={req.avatarUrl}
                        name={req.name}
                        isPremium={Boolean(req.isPremium)}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {req.name}
                          </p>
                          {(req.isPremium || req.isVerified) && <VerifiedBadge size={14} />}
                        </div>
                        <p className="text-[11px] font-mono text-violet-300 truncate">
                          @{req.username}
                        </p>
                      </div>
                    </div>

                    {isRoomAdmin ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleRespondClubRequest(req.id, "approve")}
                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition-colors cursor-pointer"
                        >
                          Qabul qilish
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRespondClubRequest(req.id, "reject")}
                          className="rounded-xl border border-red-500/40 bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 text-[11px] font-bold text-red-300 transition-colors cursor-pointer"
                        >
                          Rad etish
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1 shrink-0">
                        Kutilmoqda
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* O'NG TOMONDA: Xonaga qo'shilishga ruxsat olgan foydalanuvchilar */}
          <div className="md:col-span-7 rounded-3xl border border-white/[0.1] bg-[#0b071b]/85 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Xonadagi ishtirokchilar (Ruxsat olganlar)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Xonaga qabul qilingan va jonli suhbatda qatnashayotgan foydalanuvchilar
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-0.5 text-xs font-bold text-emerald-300 tabular-nums">
                {activeClubRoom.members?.length || 1} / {activeClubRoom.maxMembers}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
              {(activeClubRoom.members || []).map((member) => {
                const isCreator =
                  String(member.id) === String(activeClubRoom.owner?.id);
                const isMuted = Boolean(member.muted || member.mutedByAdmin);
                const isSpeaking = Boolean(member.speaking && !isMuted);

                return (
                  <div
                    key={member.id}
                    className={cn(
                      "rounded-2xl border p-4 flex flex-col gap-3 transition-all",
                      isSpeaking
                        ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                        : "border-white/[0.08] bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <SpeakerAvatar
                          size={52}
                          src={member.avatarUrl}
                          name={member.name}
                          isPremium={Boolean(member.isPremium)}
                        />
                        <span
                          className={cn(
                            "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-black/40",
                            isMuted
                              ? "bg-red-600 text-white"
                              : isSpeaking
                              ? "bg-emerald-500 text-white animate-pulse"
                              : "bg-violet-600 text-white"
                          )}
                        >
                          {isMuted ? (
                            <MicOff className="h-3 w-3" />
                          ) : (
                            <Mic className="h-3 w-3" />
                          )}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-white truncate">
                            {member.name}
                          </p>
                          {(member.isPremium || member.isVerified) && (
                            <VerifiedBadge size={14} />
                          )}
                          {isCreator && (
                            <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-violet-300 truncate">
                          @{member.username}
                        </p>
                        {member.mutedByAdmin && (
                          <p className="text-[10px] font-semibold text-red-300 mt-0.5">
                            Admin tomonidan mikrofoni yopilgan
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Usernamesini pasidan: Mikrofonini yopib qo'yish va Xonadan chiqarib yuborish tugmalari (Faqat xonani yaratgan adminga ko'rinadi) */}
                    {isRoomAdmin && !isCreator && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() =>
                            void handleClubMemberAction(member.id, "toggle-mute")
                          }
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border p-1 pr-3 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]",
                            member.mutedByAdmin
                              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                              : "border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full shadow-sm",
                              member.mutedByAdmin
                                ? "bg-emerald-500/30 text-emerald-300"
                                : "bg-amber-500/30 text-amber-300"
                            )}
                          >
                            {member.mutedByAdmin ? (
                              <Mic className="h-3.5 w-3.5" />
                            ) : (
                              <MicOff className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span>{member.mutedByAdmin ? "Yoqish" : "Mute"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleClubMemberAction(member.id, "kick")
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-rose-500 hover:bg-rose-600 p-1 pr-3 text-xs font-bold text-white shadow-md shadow-rose-500/25 hover:scale-[1.02] transition-all cursor-pointer"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-white shadow-sm">
                            <UserX className="h-3.5 w-3.5" />
                          </span>
                          <span>Chiqarish</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 3. ENG PASDA: Mikrofon, Chat va Chatni tugatish tugmalari (Pastki menubar uslubidagi dumaloq floating dock) ── */}
        <div className="flex items-center justify-center pt-2 pb-1">
          <div className="flex items-center gap-3 sm:gap-4 rounded-full border border-white/15 bg-[#0e0924]/90 p-2 sm:p-2.5 shadow-[0_12px_35px_rgba(0,0,0,0.75)] shadow-violet-900/30 backdrop-blur-2xl relative">
            {/* 1. Mikrofon tugmasi */}
            <button
              type="button"
              disabled={Boolean(meMemberObj?.mutedByAdmin)}
              onClick={() => void handleToggleClubMic()}
              title={meMemberObj?.mutedByAdmin ? "Admin yopgan" : clubMicMuted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
              className={cn(
                "relative group flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                clubMicMuted || meMemberObj?.mutedByAdmin
                  ? "border border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                  : "border border-violet-400/40 bg-gradient-to-b from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] hover:scale-105"
              )}
            >
              <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3 py-1 text-xs font-extrabold text-white shadow-xl backdrop-blur-2xl transition-all duration-200 z-50 opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0">
                {meMemberObj?.mutedByAdmin ? "Admin yopgan" : clubMicMuted ? "Mikrofon yopiq" : "Mikrofon"}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
              </span>
              {clubMicMuted || meMemberObj?.mutedByAdmin ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            {/* 2. Chat tugmasi */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setClubChatOpen((o) => {
                    const next = !o;
                    if (next) setClubUnreadChat(0);
                    return next;
                  });
                }}
                title="Chat"
                className={cn(
                  "relative group flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all cursor-pointer shadow-md",
                  clubChatOpen
                    ? "border border-violet-400/60 bg-white/20 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    : "border border-white/10 bg-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/[0.1]"
                )}
              >
                <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3 py-1 text-xs font-extrabold text-white shadow-xl backdrop-blur-2xl transition-all duration-200 z-50 opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0">
                  Chat
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
                </span>
                <MessageSquare className="h-5 w-5" />
                {clubUnreadChat > 0 && (
                  <span className="absolute -top-1 -right-1 flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg ring-2 ring-[#0b071b] animate-bounce">
                    {clubUnreadChat > 99 ? "99+" : clubUnreadChat}
                  </span>
                )}
              </button>

              {clubChatOpen && (
                <div className="absolute bottom-[68px] left-1/2 -translate-x-1/2 z-50 w-[320px] sm:w-[380px] rounded-2xl border border-white/[0.12] bg-[#0e0924]/95 shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-violet-400" />
                      <span className="text-xs font-bold text-white">
                        Xona chati ({activeClubRoom.name})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClubChatOpen(false)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 max-h-[260px] min-h-[180px] overflow-y-auto p-3.5 space-y-2.5 text-xs">
                    {!activeClubRoom.messages || activeClubRoom.messages.length === 0 ? (
                      <p className="text-center text-[11px] text-zinc-500 py-6">
                        Hali xabarlar yo'q. Birinchi bo'lib yozing!
                      </p>
                    ) : (
                      activeClubRoom.messages.map((msg) => {
                        const isMine = String(msg.senderId) === myId;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed",
                              isMine
                                ? "ml-auto bg-violet-600 text-white rounded-br-none"
                                : "mr-auto bg-white/10 text-zinc-100 rounded-bl-none"
                            )}
                          >
                            <span className="text-[10px] font-semibold opacity-75 mb-0.5">
                              {isMine ? "Siz" : `${msg.senderName} (@${msg.senderUsername})`}
                            </span>
                            <span className="break-words">{msg.text}</span>
                          </div>
                        );
                      })
                    )}
                    <div ref={clubChatEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendClubMessage}
                    className="flex items-center gap-2 border-t border-white/[0.08] p-2 bg-white/[0.02]"
                  >
                    <input
                      type="text"
                      maxLength={300}
                      placeholder="Xabar yozing..."
                      value={clubChatInput}
                      onChange={(e) => setClubChatInput(e.target.value)}
                      className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!clubChatInput.trim()}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 3. Chatni tugatish tugmasi */}
            <button
              type="button"
              onClick={() => void handleLeaveClubRoom()}
              title="Chatni tugatish"
              className="relative group flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-red-500/40 bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3 py-1 text-xs font-extrabold text-white shadow-xl backdrop-blur-2xl transition-all duration-200 z-50 opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0">
                Chatni tugatish
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
              </span>
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const hideChrome = inMeetingRoom || isCreateRoomRoute || isClubChatRoomRoute;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#06040f] text-foreground font-sans antialiased">
      {/* ── Fixed offscreen audio element for WebRTC voice playback (desktop browser compatible) ── */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        aria-hidden="true"
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: "1px",
          height: "1px",
          opacity: 0.001,
          pointerEvents: "none",
        }}
      />

      {/* ── Website Neon Backdrop ── */}
      <div className="neon-backdrop" aria-hidden />

      {/* ── 1. Left Sidebar (hidden in full meeting, create-room, and chat-room modes) ── */}
      {!hideChrome && (
        <UserSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={sidebarCollapsed}
          onOpenPremium={() => setPremiumModalOpen(true)}
          className="hidden md:flex"
        />
      )}

      {/* ── 2. Viewport ── */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-transparent pb-24 md:pb-0">
        {/* iOS 26 Liquid Glass Translucent Sticky Navbar (Only on dashboard) */}
        {!hideChrome && (
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.1] bg-white/[0.025] px-4 sm:px-8 backdrop-blur-2xl backdrop-saturate-[190%] shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_0_rgba(255,255,255,0.16)]">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:text-white transition-all"
                title="Menyuni yig'ish / ochish"
              >
                <PanelLeft className="h-4 w-4" />
              </button>

              <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 sm:px-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(160,185,129,0.9)]" />
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs">
                  <span className="font-bold text-white tabular-nums">{onlineCount}</span>
                  <span className="hidden sm:inline font-medium text-zinc-300">{dt.topbar.usersOnline}</span>
                  <span className="sm:hidden font-medium text-zinc-300">{dt.topbar.online}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Til tanlash tugmasi (Telefonda navbardan yashirilgan, Desktopda ko'rinadi) */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Xabarlar tugmasi (shadcn Button + Badge) */}
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={handleOpenMessagesModal}
                className="relative rounded-full h-9 w-9 border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                title="Xabarlar"
              >
                <MessageSquare className="h-4 w-4" />
                {unreadAdminCount > 0 && (
                  <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1 text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold border-0 shadow-md">
                    {unreadAdminCount > 99 ? "99+" : unreadAdminCount}
                  </Badge>
                )}
              </Button>

              {/* Bildirishnomalar (shadcn Button + Badge) */}
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={handleOpenNotificationsModal}
                className="relative rounded-full h-9 w-9 border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                title={dt.topbar.notifications}
              >
                <Bell className="h-4 w-4" />
                {unreadAnnouncementsCount > 0 && (
                  <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1 text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold border-0 shadow-md">
                    {unreadAnnouncementsCount > 99 ? "99+" : unreadAnnouncementsCount}
                  </Badge>
                )}
              </Button>

              {/* Desktop Account Menu (Telefonda pastdagi navigatsiyada, Desktopda esa tepada chiqadi) */}
              <div className="hidden md:block">
                <AccountMenu
                  onSelectTab={(tab) => setActiveTab(tab)}
                  diamondsOverride={diamonds}
                />
              </div>
            </div>
          </header>
        )}

        {/* ── 3. Content Body (Switches between Full-Screen Create/Chat Room, Meeting Room, and Tabs) ── */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 bg-transparent max-w-full overflow-x-hidden">
          <div className="w-full">
            {isCreateRoomRoute ? (
              renderCreateRoomPage()
            ) : isClubChatRoomRoute ? (
              renderClubChatRoomPage()
            ) : inMeetingRoom && (matchedPartner || isSearchingInRoom) ? (
              /* ════════════════════════════════════════════════════════════════
                  A. MEETING CHAT ROOM (To'liq Meeting Chat Saxifasi + O'tkazib yuborish)
                 ════════════════════════════════════════════════════════════════ */
              <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
                {/* ── Top Header Row: Mening profilim (chapda) va Speaker sherigim profili (o'ngda) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chap tomonda tepada: Mening profilim */}
                  <VipUserCard
                    name={displayName}
                    username={displayUsername}
                    avatarUrl={user?.avatarUrl}
                    isPremium={Boolean(user?.isPremium)}
                    isVerified={Boolean(user?.isVerified || user?.isPremium)}
                    roleBadge="Siz"
                    isMicMuted={isMicMuted}
                  />

                  {/* O'ng tomonda tepada: Speaker sherigim profili */}
                  {isSearchingInRoom ? (
                    <div className="flex items-center justify-between rounded-2xl border border-violet-500/30 bg-[#0b071b]/85 p-4 backdrop-blur-xl">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-violet-400/50 bg-violet-500/10 text-violet-300 animate-pulse">
                          <Radio className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Yangi suhbatdosh qidirilmoqda...</p>
                          <p className="text-xs font-mono text-violet-300">
                            {formatSeconds(searchSeconds)} / 01:00
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5">
                        <CountryFlag
                          code={speakerOption.flagCode}
                          width={20}
                          className="h-3.5 w-5 rounded-[2px]"
                        />
                        <span className="text-xs font-semibold text-white">
                          {speakerOption.name}
                        </span>
                      </div>
                    </div>
                  ) : matchedPartner ? (
                    <VipUserCard
                      name={matchedPartner.name}
                      username={matchedPartner.username}
                      avatarUrl={matchedPartner.avatarUrl}
                      isPremium={Boolean(matchedPartner.isPremium)}
                      isVerified={Boolean(matchedPartner.isVerified || matchedPartner.isPremium)}
                      roleBadge="Sherik"
                      isPartner
                      rightExtra={
                        <div className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5">
                          <CountryFlag
                            code={speakerOption.flagCode}
                            width={20}
                            className="h-3.5 w-5 rounded-[2px]"
                          />
                          <span className="text-xs font-semibold text-white">
                            {speakerOption.name}
                          </span>
                        </div>
                      }
                    />
                  ) : null}
                </div>

                {/* ── Main Meeting Area: Tagma-tag Katta Avatarlar Yoki Searching Dumaloq Tugmasi ── */}
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-6 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                  {isSearchingInRoom ? (
                    /* O'tkazib yuborish bosilganda o'rtada chiqadigan dumaloq Searching tugmasi va pasida Bekor qilish tugmasi */
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="relative flex items-center justify-center">
                        <div
                          aria-hidden
                          className="absolute -inset-4 rounded-full border border-violet-400/50 scale-110 animate-pulse pointer-events-none"
                        />
                        <span
                          aria-hidden
                          className="absolute -inset-2 rounded-full border border-violet-400/60 animate-ping opacity-25 pointer-events-none"
                        />
                        <div className="relative flex flex-col items-center justify-center rounded-full h-32 w-32 sm:h-36 sm:w-36 border border-violet-300/30 bg-gradient-to-b from-violet-500 via-violet-600 to-indigo-700 text-white shadow-[0_0_45px_rgba(139,92,246,0.55),inset_0_2px_0_rgba(255,255,255,0.25)]">
                          <Radio className="h-7 w-7 text-white animate-pulse" />
                          <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-100">
                            {dt.start.searching}
                          </span>
                          <span className="mt-0.5 text-xs font-mono font-bold text-white tabular-nums">
                            {formatSeconds(searchSeconds)} / 01:00
                          </span>
                        </div>
                      </div>

                      <p className="mt-5 text-xs text-zinc-400 text-center max-w-xs">
                        1 daqiqa ichida tanlangan tilda suhbatdosh topilmasa, boshqa tillardagi speakerlardan biri avtomatik ulanadi.
                      </p>

                      <button
                        type="button"
                        onClick={() => void handleCancelInRoomSearch()}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-rose-500 hover:bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span>Bekor qilish</span>
                      </button>
                    </div>
                  ) : matchedPartner ? (
                    <>
                      {/* Tagma-tag Katta Avatarlar (Top: My Avatar, Bottom: Speaker Partner Avatar) */}
                      <div className="flex flex-col items-center gap-8 my-4">
                        {/* 1. Mening Katta Avatarim */}
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={cn(
                              "relative rounded-full transition-all duration-300",
                              user?.isPremium
                                ? isMySpeaking
                                  ? "p-[4px] bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_45px_rgba(245,158,11,0.95)] scale-105 animate-pulse"
                                  : "p-[3.5px] bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.65)] ring-2 ring-amber-400/80"
                                : isMySpeaking
                                ? "p-[4px] bg-gradient-to-tr from-violet-400 via-fuchsia-400 to-indigo-400 shadow-[0_0_40px_rgba(168,85,247,0.85)] scale-105 animate-pulse"
                                : "p-[3px] bg-white/10"
                            )}
                          >
                            <div className="overflow-hidden rounded-full h-28 w-28 sm:h-32 sm:w-32 bg-[#120b2d]">
                              <SpeakerAvatar size={128} src={user?.avatarUrl} />
                            </div>
                            {isMySpeaking && (
                              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 shadow-glow">
                                <AudioWaveform className="h-3.5 w-3.5 text-white animate-pulse" />
                              </span>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <p className="text-sm font-bold text-white">{displayName}</p>
                              {user?.isPremium && <VerifiedBadge size={16} />}
                            </div>
                            <p className="text-xs font-mono text-violet-300">@{displayUsername}</p>
                          </div>
                        </div>

                        {/* O'rtada Jonli Ovozli Aloqa Statusi */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Jonli ovozli suhbat faol</span>
                        </div>

                        {/* 2. Speaker Sherigimning Katta Avatari */}
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={cn(
                              "relative rounded-full transition-all duration-300",
                              matchedPartner?.isPremium
                                ? isPartnerSpeaking
                                  ? "p-[4px] bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_45px_rgba(245,158,11,0.95)] scale-105 animate-pulse"
                                  : "p-[3.5px] bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.65)] ring-2 ring-amber-400/80"
                                : isPartnerSpeaking
                                ? "p-[4px] bg-gradient-to-tr from-cyan-400 via-violet-400 to-fuchsia-400 shadow-[0_0_40px_rgba(56,189,248,0.85)] scale-105 animate-pulse"
                                : "p-[3px] bg-white/10"
                            )}
                          >
                            <div className="overflow-hidden rounded-full h-28 w-28 sm:h-32 sm:w-32 bg-[#120b2d]">
                              <SpeakerAvatar size={128} src={matchedPartner.avatarUrl} />
                            </div>
                            {isPartnerSpeaking && (
                              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 shadow-glow">
                                <AudioWaveform className="h-3.5 w-3.5 text-white animate-pulse" />
                              </span>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <p className="text-sm font-bold text-white">{matchedPartner.name}</p>
                              {matchedPartner?.isPremium && <VerifiedBadge size={16} />}
                            </div>
                            <p className="text-xs font-mono text-violet-300">
                              @{matchedPartner.username}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ── Boshqaruv Paneli: Mikrofon, Chat, O'tkazib yuborish, Suhbatni tugatish ── */}
                      <div className="mt-8 flex flex-col items-center gap-4 w-full">
                        <div className="flex flex-wrap items-center justify-center gap-3.5 relative">
                          {/* 1. Mikrofon Tugmasi */}
                          <button
                            type="button"
                            onClick={handleToggleMic}
                            className={cn(
                              "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg",
                              isMicMuted
                                ? "border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                : "border-violet-400/40 bg-gradient-to-b from-violet-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105"
                            )}
                            title={isMicMuted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
                          >
                            {isMicMuted ? (
                              <MicOff className="h-6 w-6" />
                            ) : (
                              <Mic className="h-6 w-6" />
                            )}
                          </button>

                          {/* 2. Chat Tugmasi */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setChatOpen((o) => {
                                  const next = !o;
                                  if (next) setUnreadChatCount(0);
                                  return next;
                                });
                              }}
                              className={cn(
                                "relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg",
                                chatOpen
                                  ? "border-violet-400 bg-white/15 text-white"
                                  : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white"
                              )}
                              title={dt.meeting.chatTitle || "Yozishmalar (Chat)"}
                            >
                              <MessageSquare className="h-6 w-6" />
                              {unreadChatCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-[11px] font-black text-white shadow-lg shadow-red-500/60 ring-2 ring-[#0b071b] animate-bounce">
                                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                                </span>
                              )}
                            </button>

                            {/* Dropdown Real-Time Chat Popover */}
                            {chatOpen && (
                              <div className="absolute bottom-[68px] left-1/2 -translate-x-1/2 z-40 w-[320px] sm:w-[360px] rounded-2xl border border-white/[0.12] bg-[#0e0924]/95 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {/* Chat Header */}
                                <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-violet-400" />
                                    <span className="text-xs font-bold text-white">
                                      {dt.meeting.chatTitle || "Jonli yozishma"} (@{matchedPartner.username})
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setChatOpen(false)}
                                    className="text-zinc-400 hover:text-white"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Chat Message List */}
                                <div className="flex-1 max-h-[260px] min-h-[180px] overflow-y-auto p-3.5 space-y-2.5 text-xs">
                                  {chatMessages.length === 0 ? (
                                    <p className="text-center text-[11px] text-zinc-500 py-6">
                                      Hali xabarlar yo'q. Birinchi bo'lib yozing!
                                    </p>
                                  ) : (
                                    chatMessages.map((msg) => (
                                      <div
                                        key={msg.id}
                                        className={cn(
                                          "flex flex-col max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed",
                                          msg.isMe
                                            ? "ml-auto bg-violet-600 text-white rounded-br-none"
                                            : "mr-auto bg-white/10 text-zinc-100 rounded-bl-none"
                                        )}
                                      >
                                        <span className="text-[10px] font-semibold opacity-70 mb-0.5">
                                          {msg.isMe ? (dt.meeting.you || "Siz") : msg.senderName}
                                        </span>
                                        <span className="break-words">{msg.text}</span>
                                      </div>
                                    ))
                                  )}
                                  <div ref={chatMessagesEndRef} />
                                </div>

                                {/* Chat Input & Send Button */}
                                <form
                                  onSubmit={handleSendMessage}
                                  className="flex items-center gap-2 border-t border-white/[0.08] p-2 bg-white/[0.02]"
                                >
                                  <input
                                    type="text"
                                    maxLength={300}
                                    placeholder={dt.meeting.typeMessage || "Xabar yozing..."}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>

                          {/* 3. O'tkazib yuborish (Keyingi suhbatdoshni qidirish) Tugmasi */}
                          <button
                            type="button"
                            onClick={() => void handleSkipPartnerInRoom()}
                            className="flex h-14 items-center gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <SkipForward className="h-5 w-5" />
                            <span>{dt.meeting.skip || "O'tkazib yuborish"}</span>
                          </button>

                          {/* 4. Suhbatni Tugatish Qizil Tugmasi */}
                          <button
                            type="button"
                            onClick={() => setEndMeetingModalOpen(true)}
                            className="flex h-14 items-center gap-2 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-600 to-rose-700 px-5 text-sm font-bold text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <PhoneOff className="h-5 w-5" />
                            <span>{dt.meeting.endCall}</span>
                          </button>
                        </div>

                        {/* 5. Shikoyat bildirish tugmasi - Suhbatni tugatish tugmasining tagida */}
                        <div className="w-full flex justify-center pt-2">
                          <button
                            type="button"
                            onClick={() => setComplaintModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 transition-all cursor-pointer shadow-sm"
                          >
                            <Flag className="h-3.5 w-3.5" />
                            <span>{dt.meeting.complaintTitle || "Shikoyat bildirish"}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : activeTab === "club" ? (
              renderClubListView()
            ) : activeTab === "profile" ? (
              renderProfileView()
            ) : activeTab === "history" ? (
              renderHistoryView()
            ) : activeTab === "daily_tasks" ? (
              renderDailyTasksView()
            ) : activeTab === "task_game" ? (
              renderTaskGameView()
            ) : activeTab === "books" ? (
              renderBooksView()
            ) : activeTab === "friends" ? (
              renderFriendsView()
            ) : activeTab === "messages" ? (
              renderMessagesView()
            ) : activeTab === "rating" ? (
              renderRatingView()
            ) : activeTab === "achievements" ? (
              renderAchievementsView()
            ) : activeTab === "devices" ? (
              renderDevicesView()
            ) : activeTab === "help" ? (
              renderHelpView()
            ) : activeTab === "feedback" ? (
              renderFeedbackView()
            ) : (
              /* ════════════════════════════════════════════════════════════════
                  B. MAIN DASHBOARD VIEW (START Bosishdan oldingi va keyingi)
                 ════════════════════════════════════════════════════════════════ */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ── LEFT & CENTER COLUMN (8 cols) ── */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* ── A. Welcome Banner (Decorative non-clickable country pills) ── */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#130d2e]/90 via-[#0c0820]/95 to-[#110b29]/90 p-6 sm:p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-2xl">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl"
                    />

                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                      <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-300 mb-3">
                          <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                          <span>{dt.welcome.greeting}, {displayName}</span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {dt.welcome.question}
                        </h1>
                        <p className="mt-1.5 text-[13px] text-zinc-400 leading-relaxed">
                          {dt.welcome.description}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-2 select-none pointer-events-none">
                          {LANGUAGES.map((l) => (
                            <div
                              key={l.id}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                            >
                              <CountryFlag
                                code={l.flagCode}
                                width={40}
                                className="h-4 w-5.5 rounded-[3px]"
                              />
                              <span>{getLocalizedLangName(l.id, lang, l.name)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-4 self-end xl:self-center shrink-0">
                        <div className="text-right">
                          <p className="font-script text-base text-violet-200 leading-tight">
                            {dt.welcome.quoteA} <br />
                            <span className="text-violet-400">{dt.welcome.quoteB}</span>
                          </p>
                          <svg
                            className="ml-auto mt-1 h-5 w-11 text-violet-400/70"
                            viewBox="0 0 50 25"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          >
                            <path d="M5 5 C 20 2, 35 10, 45 20" />
                            <path d="M38 20 L 45 20 L 44 13" />
                          </svg>
                        </div>

                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/30 bg-gradient-to-b from-violet-500 to-indigo-600 shadow-[0_10px_30px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.3)]">
                          <AudioWaveform className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── B. 3-Metric Stats Bar (Streak, Speaking Time, Diamonds) ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-400">{dt.stats.streak}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-bold tracking-tight text-white tabular-nums">
                            {streakDays} {dt.stats.days}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            <Flame className="h-3 w-3 text-amber-400" />
                            {dt.stats.days}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-400">{dt.stats.talkTime}</p>
                        <p className="mt-1 text-lg font-bold tracking-tight text-white tabular-nums">
                          {formatTalkDuration(talkSeconds)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300">
                        <Gem className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-400">{dt.profile.diamonds}</p>
                        <p className="mt-1 text-lg font-bold tracking-tight text-white tabular-nums">
                          {diamonds}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── C. Suhbatdosh Tanlash & START Studio ── */}
                  <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b071b]/85 p-6 sm:p-7 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-white/[0.07]">
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4.5 w-4.5 text-violet-400" />
                          <h2 className="text-base font-semibold tracking-tight text-white">
                            {dt.start.chooseLanguage}
                          </h2>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {dt.start.ruleWarning}
                        </p>
                      </div>

                      {/* Compact Speaker Language Dropdown */}
                      <div className="relative w-full sm:w-[230px] shrink-0">
                        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          <Users className="h-3 w-3 text-violet-400" />
                          <span>{dt.start.selected}</span>
                        </label>
                        <button
                          type="button"
                          disabled={isSearching}
                          onClick={() => setSpeakerDropdownOpen((o) => !o)}
                          className={cn(
                            "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                            speakerDropdownOpen
                              ? "border-violet-500/60 bg-white/[0.06] ring-2 ring-violet-500/20"
                              : "border-white/[0.1] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CountryFlag
                              code={speakerOption.flagCode}
                              width={40}
                              className="h-4 w-5.5 rounded-[2px] shrink-0"
                            />
                            <span className="truncate text-xs font-semibold text-white">
                              {getLocalizedLangName(speakerOption.id, lang, speakerOption.name)}
                            </span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-150",
                              speakerDropdownOpen && "rotate-180 text-violet-300"
                            )}
                          />
                        </button>

                        {speakerDropdownOpen && (
                          <div className="absolute left-0 right-0 top-[58px] z-30 rounded-xl border border-white/[0.1] bg-[#100b26]/95 p-1 shadow-2xl backdrop-blur-2xl flex flex-col gap-0.5">
                            {LANGUAGES.map((opt) => {
                              const active = speakerOption.id === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setSpeakerOption(opt);
                                    setSpeakerDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors",
                                    active
                                      ? "bg-violet-500/20 text-white font-semibold"
                                      : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <CountryFlag
                                      code={opt.flagCode}
                                      width={40}
                                      className="h-3.5 w-5 rounded-[2px]"
                                    />
                                    <span className="text-xs font-medium text-white">{getLocalizedLangName(opt.id, lang, opt.name)}</span>
                                  </div>
                                  {active && <Check className="h-3.5 w-3.5 text-violet-400" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {micError && (
                      <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-200">
                        <MicOff className="h-4 w-4 shrink-0 text-red-400" />
                        <span>{micError}</span>
                      </div>
                    )}

                    {timeoutNotice && (
                      <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-200">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>{timeoutNotice}</span>
                      </div>
                    )}

                    {/* START Stage + Partner Slot */}
                    <div className="mt-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                        {/* START Button */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative flex items-center justify-center">
                            <div
                              aria-hidden
                              className={cn(
                                "absolute -inset-4 rounded-full border transition-all duration-500 pointer-events-none",
                                isSearching
                                  ? "border-violet-400/50 scale-110 animate-pulse"
                                  : "border-white/[0.06]"
                              )}
                            />
                            {isSearching && (
                              <span
                                aria-hidden
                                className="absolute -inset-2 rounded-full border border-violet-400/60 animate-ping opacity-25 pointer-events-none"
                              />
                            )}

                            <button
                              type="button"
                              disabled={requestingMic}
                              onClick={handleStartOrStop}
                              className={cn(
                                "group relative flex flex-col items-center justify-center rounded-full text-white transition-all duration-200 cursor-pointer disabled:opacity-60",
                                "h-28 w-28 sm:h-32 sm:w-32",
                                "border border-violet-300/30 bg-gradient-to-b from-violet-500 via-violet-600 to-indigo-700 shadow-[0_0_40px_rgba(139,92,246,0.45),inset_0_2px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_55px_rgba(139,92,246,0.7)] hover:scale-[1.03] active:scale-95"
                              )}
                            >
                              {requestingMic ? (
                                <div className="flex flex-col items-center justify-center px-2 text-center">
                                  <Mic className="h-6 w-6 text-white animate-bounce" />
                                  <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-100">
                                    Mic...
                                  </span>
                                </div>
                              ) : isSearching ? (
                                <div className="flex flex-col items-center justify-center">
                                  <Radio className="h-6 w-6 text-white animate-pulse" />
                                  <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-100">
                                    {dt.start.searching}
                                  </span>
                                  <span className="mt-0.5 text-xs font-mono font-bold text-white tabular-nums">
                                    {formatSeconds(searchSeconds)} / 01:00
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center">
                                  <Play className="h-7 w-7 fill-white text-white translate-x-0.5 group-hover:scale-110 transition-transform duration-150" />
                                  <span className="mt-1.5 text-sm sm:text-base font-extrabold tracking-widest uppercase">
                                    {dt.start.startBtn}
                                  </span>
                                </div>
                              )}
                            </button>
                          </div>

                          {isSearching && (
                            <button
                              type="button"
                              onClick={handleStartOrStop}
                              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>{dt.start.cancelBtn}</span>
                            </button>
                          )}
                        </div>

                        {/* Partner Slot to the Right of START */}
                        <div className="w-full max-w-[270px] rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                          <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              {dt.meeting.partner}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                              <CountryFlag
                                code={speakerOption.flagCode}
                                width={20}
                                className="h-3 w-4 rounded-[2px]"
                              />
                              <span>{speakerOption.name}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3.5 py-1">
                            <div
                              className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed transition-colors",
                                isSearching
                                  ? "border-violet-400/50 bg-violet-500/10 text-violet-300 animate-pulse"
                                  : "border-white/15 bg-white/[0.03] text-zinc-500"
                              )}
                            >
                              <Users className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-zinc-300">
                                {isSearching ? dt.start.searching : dt.start.waitingQueue}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                                {isSearching ? `${speakerOption.name}...` : "@username"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.05] pt-4 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Mic className="h-3.5 w-3.5 text-violet-400" />
                          WebRTC Audio
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-700" />
                        <span className="inline-flex items-center gap-1.5">
                          <Headphones className="h-3.5 w-3.5 text-violet-400" />
                          HD Voice
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-700" />
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          SSL Secure
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: WIDGETS (4 cols — Only Kunlik olmoscha & Hisobingiz/Premium) ── */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0b071b]/85 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                            isDailyClaimed
                              ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-400"
                              : "border-amber-500/25 bg-amber-500/10 text-amber-400"
                          )}
                        >
                          <Gem className="h-4 w-4" />
                        </div>
                        <span className="text-[13px] font-semibold text-white">{dt.reward.dailyTitle}</span>
                        <Info className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums transition-colors",
                          isDailyClaimed ? "text-emerald-400" : "text-zinc-300"
                        )}
                      >
                        {dailyProgress} / 5
                      </span>
                    </div>

                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isDailyClaimed
                            ? "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.65)]"
                            : "bg-gradient-to-r from-amber-500 to-yellow-400"
                        )}
                        style={{ width: `${(dailyProgress / 5) * 100}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isDailyClaimed || claimingDaily}
                      onClick={() => void handleClaimDiamond()}
                      className={cn(
                        "w-full inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all",
                        isDailyClaimed
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                          : "border-amber-500/35 bg-gradient-to-r from-amber-500/20 to-yellow-500/15 hover:from-amber-500/30 hover:to-yellow-500/25 text-amber-300 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      )}
                    >
                      {isDailyClaimed ? (
                        <>
                          <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                          <span className="font-mono tabular-nums">
                            {formatCountdown(dailyRemainingSec)}
                          </span>
                        </>
                      ) : claimingDaily ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                          <span>{dt.reward.claiming || "Olinmoqda..."}</span>
                        </>
                      ) : (
                        <>
                          <Gem className="h-3.5 w-3.5 text-amber-400" />
                          <span>{dt.reward.claimBtn || "5 ta olmosni olish"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#0b071b]/85 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300">
                          <Gem className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-400">{dt.reward.balance}</p>
                          <p className="mt-0.5 text-2xl font-bold tracking-tight text-white tabular-nums">
                            {diamonds}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                        {dt.reward.balance}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-1 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setDepositModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-violet-400/40 py-2.5 px-4 text-xs font-semibold text-white transition-all"
                      >
                        <Plus className="h-4 w-4 text-violet-400" />
                        <span>{dt.reward.topUp}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPremiumModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/90 via-purple-600/90 to-indigo-600/90 hover:brightness-110 py-2.5 px-4 text-xs font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all"
                      >
                        <Crown className="h-4 w-4 text-amber-200" />
                        <span>{dt.reward.buyPremium}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── 4. Mobile Bottom Navigation Bar (md:hidden) ── */}
      {!hideChrome && (
        <nav
          aria-label="Pastki mobil navigatsiya"
          className="fixed bottom-4 left-0 right-0 z-40 flex items-center justify-center gap-2 px-2 pointer-events-none md:hidden"
        >
          {/* Connected capsule with border: Speaking, Klub, Mening tarixim, Do'stlar, Xabarlar */}
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-[#0e0924]/90 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-[180%]">
            {/* 1. Speaking */}
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              title={dt.sidebar.home}
              aria-label={dt.sidebar.home}
              className={cn(
                "relative group flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer",
                activeTab === "home"
                  ? "bg-white/15 text-white shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(0,0,0,0.75)] shadow-violet-900/30 backdrop-blur-2xl transition-all duration-200 z-50",
                  activeTab === "home"
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
                )}
              >
                {dt.sidebar.home}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
              </span>
              <AudioWaveform className="h-5 w-5" />
            </button>

            {/* 2. Klub */}
            <button
              type="button"
              onClick={() => setActiveTab("club")}
              title={dt.sidebar.club || "Klub"}
              aria-label={dt.sidebar.club || "Klub"}
              className={cn(
                "relative group flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer",
                activeTab === "club"
                  ? "bg-white/15 text-white shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(0,0,0,0.75)] shadow-violet-900/30 backdrop-blur-2xl transition-all duration-200 z-50",
                  activeTab === "club"
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
                )}
              >
                {dt.sidebar.club || "Klub"}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
              </span>
              <Radio className="h-5 w-5" />
            </button>

            {/* 3. Mening tarixim */}
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              title={dt.sidebar.history}
              aria-label={dt.sidebar.history}
              className={cn(
                "relative group flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer",
                activeTab === "history"
                  ? "bg-white/15 text-white shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(0,0,0,0.75)] shadow-violet-900/30 backdrop-blur-2xl transition-all duration-200 z-50",
                  activeTab === "history"
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
                )}
              >
                {dt.sidebar.history}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
              </span>
              <History className="h-5 w-5" />
            </button>

            {/* 4. Do'stlar */}
            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              title={dt.sidebar.friends}
              aria-label={dt.sidebar.friends}
              className={cn(
                "relative group flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer",
                activeTab === "friends"
                  ? "bg-white/15 text-white shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(0,0,0,0.75)] shadow-violet-900/30 backdrop-blur-2xl transition-all duration-200 z-50",
                  activeTab === "friends"
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
                )}
              >
                {dt.sidebar.friends}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
              </span>
              <Users className="h-5 w-5" />
            </button>

            {/* 5. Xabarlar */}
            <button
              type="button"
              onClick={() => setActiveTab("messages")}
              title={dt.sidebar.messages || "Xabarlar"}
              aria-label={dt.sidebar.messages || "Xabarlar"}
              className={cn(
                "relative group flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer",
                activeTab === "messages"
                  ? "bg-white/15 text-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(0,0,0,0.75)] shadow-blue-900/30 backdrop-blur-2xl transition-all duration-200 z-50",
                  activeTab === "messages"
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
                )}
              >
                {dt.sidebar.messages || "Xabarlar"}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
              </span>
              <MessageCircle className="h-5 w-5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-extrabold text-white shadow-md ring-2 ring-[#0e0924]">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </span>
              )}
            </button>
          </div>

          {/* 6. Profil (alohida avatar tugmasi) */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            title={dt.sidebar.profile}
            aria-label={dt.sidebar.profile}
            className={cn(
              "pointer-events-auto relative group flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/15 bg-[#0e0924]/90 text-zinc-300 shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-[180%] transition-all hover:scale-105 active:scale-95 cursor-pointer",
              activeTab === "profile" && "border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.35)]"
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-[#0d0724]/95 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_25px_rgba(0,0,0,0.75)] shadow-violet-900/30 backdrop-blur-2xl transition-all duration-200 z-50",
                activeTab === "profile"
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
              )}
            >
              {dt.sidebar.profile}
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#0d0724]" />
            </span>
            <div
              className={cn(
                "relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all overflow-hidden p-0.5",
                activeTab === "profile"
                  ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-[#0e0924] shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                  : "ring-1 ring-white/20 hover:ring-white/40"
              )}
            >
              <SpeakerAvatar size={36} src={user?.avatarUrl} name={displayName} />
            </div>
          </button>
        </nav>
      )}

      {/* ── Transition Loader Overlay (ai-loader — only animation, without text) ── */}
      {transitionLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <AiLoader showText={false} />
        </div>
      )}

      {/* ── Rostdan ham suhbatni tugatmoqchimisiz? (Question Dropdown / Modal) ── */}
      {endMeetingModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/35 bg-[#0f0923] p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/15 text-red-400 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <PhoneOff className="h-7 w-7" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {dt.meeting.confirmEndTitle}
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {dt.meeting.confirmEndDesc}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEndMeetingModalOpen(false)}
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-xs font-bold text-zinc-200 hover:bg-white/10 transition-colors"
              >
                {dt.meeting.no}
              </button>

              <button
                type="button"
                onClick={handleConfirmEndMeeting}
                className="flex items-center justify-center rounded-xl border border-red-500/40 bg-gradient-to-r from-red-600 to-rose-700 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:brightness-110 transition-all"
              >
                {dt.meeting.yes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profilni tahrirlash modali ── */}
      {editProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-violet-500/30 bg-gradient-to-b from-[#140c2e] via-[#0d0822] to-[#0a061a] p-6 shadow-2xl text-left relative overflow-hidden">
            {/* Ambient background glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-600/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-fuchsia-600/20 blur-3xl"
            />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Profilni tahrirlash</h3>
                  <p className="text-[11px] text-zinc-400">Ism, username va rasm ma'lumotlarini o'zgartirish</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !editSaving && setEditProfileModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 relative z-10">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="relative shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-0.5 shadow-lg">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0d0822] overflow-hidden">
                      {editAvatarPreview && !editDeleteAvatar ? (
                        <img
                          src={resolveAvatarUrl(editAvatarPreview) || editAvatarPreview}
                          alt="Preview"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {(editName || displayName || "A").trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 text-center sm:text-left">
                  <p className="text-xs font-semibold text-white">Profil rasmi</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-600/20 hover:bg-violet-600/30 text-violet-200 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Yangi rasm yuklash</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSelectNewAvatar(file);
                        }}
                      />
                    </label>

                    {(editAvatarPreview || user?.avatarUrl) && !editDeleteAvatar && (
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20 px-3.5 py-1.5 text-xs transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Rasmni o'chirish</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400">PNG, JPG yoki WEBP (avtomatik siqiladi va saqlanadi)</p>
                </div>
              </div>

              {/* Ism Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Ism</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  maxLength={60}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 transition-all"
                />
              </div>

              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Username</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-mono font-bold text-violet-400">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                    placeholder="username"
                    maxLength={30}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] pl-8 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 transition-all"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Kamida 5 ta belgi: faqat kichik lotin harflari, raqamlar, pastki chiziq (_) va nuqta (.)
                </p>
              </div>

              {/* Error Message */}
              {editError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Success Message */}
              {editSuccessMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={editSaving}
                  onClick={() => setEditProfileModalOpen(false)}
                  className="rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold border-0 shadow-md shadow-rose-500/20 text-xs px-4 py-2 cursor-pointer"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  variant="glow"
                  size="sm"
                  disabled={editSaving}
                  className="rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-xs px-5 font-bold cursor-pointer"
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modals for Deposit & Premium ── */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0e0922] p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300 mb-3">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Hisobni to'ldirish</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Olmoslar sonini oshirib, cheksiz suhbatlar va yangi xususiyatlarga ega bo'ling.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { amount: 50, price: "10,000 so'm" },
                { amount: 150, price: "25,000 so'm" },
                { amount: 500, price: "70,000 so'm" },
              ].map((pkg, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center hover:border-violet-500 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-violet-300">
                    <span>{pkg.amount}</span>
                    <Gem className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">{pkg.price}</p>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDepositModalOpen(false)}
              className="mt-5 w-full rounded-xl text-xs border-white/10"
            >
              Yopish
            </Button>
          </div>
        </div>
      )}

      {premiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/35 bg-[#0e0922] p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300 mb-3">
              <Crown className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Speaking Premium</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Barcha imkoniyatlar faqat premiumda! Cheksiz ovozli suhbatlar va barcha tillar ochiq.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5">
              <p className="text-sm font-bold text-amber-300">Oylik obuna: 49,000 so'm</p>
            </div>
            <Button
              variant="glow"
              size="sm"
              onClick={() => setPremiumModalOpen(false)}
              className="mt-5 w-full rounded-xl text-xs bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 cursor-pointer"
            >
              Obunani faollashtirish
            </Button>
          </div>
        </div>
      )}

      {/* ── Shikoyat bildirish modali (Tugma bosilganda ochiladi) ── */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/35 bg-[#0f0923] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Shikoyat bildirish
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setComplaintModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-300">
              Suhbatdosh nojo'ya xatti-harakat qilsa, belgilab jo'nating:
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {COMPLAINT_OPTIONS.map((reason) => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleToggleReason(reason)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all text-xs cursor-pointer",
                      isSelected
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-200 font-semibold"
                        : "border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[10px]",
                        isSelected
                          ? "border-amber-400 bg-amber-500 text-black font-extrabold"
                          : "border-white/20 bg-white/5"
                      )}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    <span className="truncate">{reason}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400">Batafsil izoh:</label>
              <textarea
                rows={3}
                placeholder="Qo'shimcha tafsilotlar yozing..."
                value={complaintDetails}
                onChange={(e) => setComplaintDetails(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] p-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {complaintSent ? (
              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-2.5 text-center text-xs font-semibold text-emerald-300">
                ✓ Shikoyatingiz qabul qilindi
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setComplaintModalOpen(false)}
                  className="flex-1 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20 py-2.5 text-xs transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={
                    complaintSubmitting ||
                    (selectedReasons.length === 0 && !complaintDetails.trim())
                  }
                  onClick={handleSubmitComplaint}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-600 to-amber-700 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>{complaintSubmitting ? "Jo'natilmoqda..." : "Jo'natish"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Kengaytirilgan Xabarlar va Admin Muloqoti Modali ── */}
      {messagesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-[560px] max-h-[88vh] rounded-3xl border border-white/[0.12] bg-[#0c0820]/95 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">Ma'muriyat bilan xabarlar</h3>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Yordam
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">Admin xabarlarini o'qish va bevosita javob qaytarish</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMessagesModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              {adminMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-500 mb-3">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-300">Hozircha xabarlar yo'q</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Admin tomonidan yuborilgan xabarlar shu yerda ko'rinadi. Istalgan vaqtda savol yoki taklif yozishingiz mumkin.
                  </p>
                </div>
              ) : (
                adminMessages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={cn(
                      "flex flex-col max-w-[85%] rounded-2xl p-3.5 shadow-md leading-relaxed transition-all",
                      msg.isAdmin
                        ? "mr-auto bg-[#140f2e] border border-purple-500/30 text-zinc-100 rounded-tl-sm shadow-[0_4px_20px_rgba(168,85,247,0.12)]"
                        : "ml-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.isAdmin ? (
                        <span className="flex items-center gap-1 rounded bg-purple-500/25 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold opacity-80">
                          {msg.sender || "Siz"}
                        </span>
                      )}
                      <span className="text-[10px] opacity-60 ml-auto font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                ))
              )}
              <div ref={adminMessagesEndRef} />
            </div>

            {/* Chat Footer / Input Form */}
            <form
              onSubmit={handleSendAdminReply}
              className="flex items-center gap-2.5 border-t border-white/[0.08] bg-[#0a061a] p-3 sm:p-4"
            >
              <input
                type="text"
                placeholder="Adminga javob yoki xabar yozing..."
                value={adminMessageInput}
                onChange={(e) => setAdminMessageInput(e.target.value)}
                maxLength={500}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!adminMessageInput.trim() || adminMessageSending}
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50 hover:brightness-110 transition-all cursor-pointer shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Yuborish</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Bildirishnomalar modali ── */}
      {notificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#0d0924]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15 text-violet-300">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bildirishnomalar va E'lonlar</h3>
                  <p className="text-xs text-zinc-400">
                    Platforma ma'muriyati (admin) tomonidan e'lon qilingan yangiliklar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">
                <Bell className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-300">Hozircha yangi bildirishnomalar mavjud emas</p>
                <p className="text-xs text-zinc-500 mt-1">Yangi e'lonlar e'lon qilinganda shu yerda ko'rinadi</p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-3.5 pr-1 max-h-[50vh]">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4.5 space-y-2 hover:bg-white/[0.07] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{a.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.priority === "urgent"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : a.priority === "important"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                          }`}
                        >
                          {a.priority === "urgent"
                            ? "Shoshilinch"
                            : a.priority === "important"
                            ? "Muhim"
                            : "E'lon"}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {a.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 mt-auto border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationsModalOpen(false)}
                className="w-full rounded-2xl text-xs border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer py-2.5 font-bold"
              >
                Yopish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Speaker / Do'st bilan shaxsiy chat (Direct Message) Modali ── */}
      {dmPartner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-[540px] max-h-[88vh] rounded-3xl border border-white/[0.12] bg-[#0c0820]/95 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* DM Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <SpeakerAvatar
                  name={dmPartner.name}
                  avatarUrl={dmPartner.avatarUrl}
                  isPremium={Boolean(dmPartner.isPremium)}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm sm:text-base font-bold text-white">
                      {dmPartner.name}
                    </h3>
                    {(dmPartner.isPremium || dmPartner.isVerified) && <VerifiedBadge size={15} />}
                  </div>
                  <p className="truncate text-xs text-violet-300">@{dmPartner.username}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDmPartner(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* DM Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
              {dmMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-3">
                    <MessageCircle className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {dmPartner.name} bilan yozishmani boshlang
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Yozgan xabarlaringiz suhbatdoshingizga darhol yetib boradi.
                  </p>
                </div>
              ) : (
                dmMessages.map((m, idx) => {
                  const isMine = String(m.fromUserId) === String(user?.id);
                  const timeStr = m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                  return (
                    <div
                      key={m.id || idx}
                      className={cn(
                        "flex flex-col max-w-[82%] rounded-2xl px-4 py-2.5 shadow-md leading-relaxed",
                        isMine
                          ? "ml-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm"
                          : "mr-auto bg-white/[0.06] border border-white/10 text-zinc-100 rounded-bl-sm"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 mb-0.5">
                        <span className="text-[10px] font-bold opacity-80">
                          {isMine ? "Siz" : m.senderName || dmPartner.name}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono">{timeStr}</span>
                      </div>
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{m.text}</p>
                    </div>
                  );
                })
              )}
              <div ref={dmEndRef} />
            </div>

            {/* DM Input Form */}
            <form
              onSubmit={handleSendDmMessage}
              className="flex items-center gap-2.5 border-t border-white/[0.08] bg-[#0a061a] p-3 sm:p-4"
            >
              <input
                type="text"
                placeholder={`@${dmPartner.username} ga xabar yozing...`}
                value={dmInput}
                onChange={(e) => setDmInput(e.target.value)}
                maxLength={500}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!dmInput.trim() || dmSending}
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50 hover:brightness-110 transition-all cursor-pointer shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Yuborish</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
