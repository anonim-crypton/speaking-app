import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useParams } from "react-router-dom";
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
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import UserSidebar, { type UserNavTab } from "@/components/UserSidebar";
import AccountMenu from "@/components/AccountMenu";
import CountryFlag from "@/components/CountryFlag";
import SpeakerAvatar from "@/components/SpeakerAvatar";
import AiLoader from "@/components/ui/ai-loader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

const MAX_SEARCH_SECONDS = 120; // 2 daqiqa kutish limiti

interface LanguageItem {
  id: "uz" | "en" | "ru" | "tr" | "ko";
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
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderUsername: string;
  text: string;
  createdAt: string;
  isMe?: boolean;
}

const LANGUAGES: LanguageItem[] = [
  { id: "uz", name: "O'zbek tili", country: "O'zbekiston", flagCode: "UZ" },
  { id: "en", name: "Ingliz tili", country: "AQSH / Buyuk Britaniya", flagCode: "GB" },
  { id: "ru", name: "Rus tili", country: "Rossiya", flagCode: "RU" },
  { id: "tr", name: "Turk tili", country: "Turkiya", flagCode: "TR" },
  { id: "ko", name: "Koreys tili", country: "Janubiy Koreya", flagCode: "KR" },
];

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
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<UserNavTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Language selection (5 isolated language servers)
  const [speakerOption, setSpeakerOption] = useState<LanguageItem>(LANGUAGES[1]); // Ingliz tili
  const [speakerDropdownOpen, setSpeakerDropdownOpen] = useState(false);

  // Searching, Matchmaking & Microphone state
  const [isSearching, setIsSearching] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [timeoutNotice, setTimeoutNotice] = useState<string | null>(null);

  // Meeting Room State
  const [matchedPartner, setMatchedPartner] = useState<MatchedPartner | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [inMeetingRoom, setInMeetingRoom] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);

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

  // Real-time online users count
  const [onlineCount, setOnlineCount] = useState<number>(1);

  // Diamonds & Daily reward state
  const [diamonds, setDiamonds] = useState<number>(user?.diamonds ?? 0);
  const [dailyProgress, setDailyProgress] = useState<number>(0);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const displayName =
    user?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Anonim";

  const displayUsername =
    user?.username ||
    (user?.email ? user.email.split("@")[0].toLowerCase() : null) ||
    "speaker";

  const clientIdRef = useRef<string>(getOrCreateClientId());
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

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
            setDiamonds(data.user.diamonds);
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

  // Search timer with strict 2-minute (120s) limit + polling
  useEffect(() => {
    if (!isSearching) {
      setSearchSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setSearchSeconds((prev) => {
        const next = prev + 1;
        if (next >= MAX_SEARCH_SECONDS) {
          window.clearInterval(timer);
          stopMicStream();
          setIsSearching(false);
          void leaveMatchmakingServer();
          setTimeoutNotice(
            "2 daqiqa ichida tanlangan tilda bo'sh suhbatdosh topilmadi. Iltimos, qaytadan urinib ko'ring."
          );
          return 0;
        }
        return next;
      });
    }, 1000);

    const pollInterval = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/matchmaking/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            userId: user?.id || null,
            language: speakerOption.id,
          }),
        });
        const data = await res.json();
        if (data?.status === "matched" && data.partner) {
          triggerEnterMeeting(data.partner, data.roomId || null);
          setIsSearching(false);
        } else if (data?.status === "timeout") {
          stopMicStream();
          setIsSearching(false);
          setTimeoutNotice(
            "2 daqiqa ichida tanlangan tilda bo'sh suhbatdosh topilmadi. Iltimos, qaytadan urinib ko'ring."
          );
        }
      } catch {
        /* ignore */
      }
    }, 1100);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(pollInterval);
    };
  }, [isSearching, speakerOption.id, user?.id]);

  // Real-time Room Heartbeat & Chat Polling / Partner events
  useEffect(() => {
    if (!inMeetingRoom || !activeRoomId) return;

    // Connect to room SSE stream for 0ms chat & speaking delivery
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
            if (!chatOpen) {
              setUnreadChatCount((c) => c + 1);
            }
          } else if (payload.type === "partner_speaking") {
            setIsPartnerSpeaking(Boolean(payload.speaking) && !payload.muted);
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

    const roomPoll = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/matchmaking/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            userId: user?.id || null,
            language: speakerOption.id,
          }),
        });
        const data = await res.json();
        if (data?.status === "idle") {
          handlePartnerExited();
        } else if (data?.status === "matched") {
          if (typeof data.partner?.speaking === "boolean") {
            setIsPartnerSpeaking(Boolean(data.partner.speaking) && !data.partner.muted);
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
                if (!chatOpen) setUnreadChatCount((c) => c + newItems.length);
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
    };
  }, [inMeetingRoom, activeRoomId, chatOpen, user?.username, displayName, speakerOption.id]);

  // Local Voice Volume Analyzer (Detect when I speak)
  useEffect(() => {
    if (!inMeetingRoom || !mediaStreamRef.current) return;

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
        const speakingNow = avg > 13 && !isMicMuted;

        setIsMySpeaking(speakingNow);

        if (speakingNow !== lastReported && activeRoomId) {
          lastReported = speakingNow;
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

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animFrameRef.current = requestAnimationFrame(checkVolume);
    } catch {
      /* ignore audio analyzer failure */
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inMeetingRoom, isMicMuted, activeRoomId, user?.id]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  if (user && slug !== user.slug) {
    return <Navigate to={`/u/${user.slug}`} replace />;
  }


  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const triggerEnterMeeting = (partner: MatchedPartner, roomId: string | null) => {
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

  const handlePartnerExited = () => {
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

  const handleConfirmEndMeeting = async () => {
    setEndMeetingModalOpen(false);
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
        }),
      });
      const data = await res.json();

      if (data?.status === "matched" && data.partner) {
        triggerEnterMeeting(data.partner, data.roomId || null);
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
    } catch {
      /* ignore */
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const handleClaimDiamond = () => {
    if (dailyProgress >= 10) return;
    setDailyProgress((p) => p + 1);
    setDiamonds((d) => d + 10);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#06040f] text-foreground font-sans antialiased">
      {/* ── Hidden audio element for WebRTC voice playback ── */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* ── Website Neon Backdrop ── */}
      <div className="neon-backdrop" aria-hidden />

      {/* ── 1. Left Sidebar (hidden in full meeting mode for immersion) ── */}
      {!inMeetingRoom && (
        <UserSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={sidebarCollapsed}
          onOpenPremium={() => setPremiumModalOpen(true)}
        />
      )}

      {/* ── 2. Viewport ── */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-transparent">
        {/* iOS 26 Liquid Glass Translucent Sticky Navbar (Only on dashboard) */}
        {!inMeetingRoom && (
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.1] bg-white/[0.025] px-6 sm:px-8 backdrop-blur-2xl backdrop-saturate-[190%] shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_0_rgba(255,255,255,0.16)]">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:text-white transition-all"
                title="Menyuni yig'ish / ochish"
              >
                <PanelLeft className="h-4 w-4" />
              </button>

              <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(160,185,129,0.9)]" />
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-white tabular-nums">{onlineCount}</span>
                  <span className="font-medium text-zinc-300">ta foydalanuvchi onlayn</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:text-white transition-all"
                title="Bildirishnomalar"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-400 ring-2 ring-[#080514]" />
              </button>

              <AccountMenu />
            </div>
          </header>
        )}

        {/* ── 3. Content Body (Switches between Dashboard and Meeting Chat Room) ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-transparent">
          <div className="mx-auto max-w-[1440px]">
            {/* ════════════════════════════════════════════════════════════════
                A. MEETING CHAT ROOM (To'liq Meeting Chat Saxifasi)
               ════════════════════════════════════════════════════════════════ */}
            {inMeetingRoom && matchedPartner ? (
              <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
                {/* ── Top Header Row: Mening profilim (chapda) va Speaker sherigim profili (o'ngda) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chap tomonda tepada: Mening profilim */}
                  <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-[#0b071b]/90 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
                    <div className="relative shrink-0">
                      <SpeakerAvatar size={48} />
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#0b071b]",
                          isMicMuted ? "bg-red-500" : "bg-emerald-500"
                        )}
                      >
                        {isMicMuted ? (
                          <MicOff className="h-2.5 w-2.5 text-white" />
                        ) : (
                          <Mic className="h-2.5 w-2.5 text-white" />
                        )}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                          Siz
                        </span>
                        <p className="truncate text-sm font-bold text-white">{displayName}</p>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-mono font-medium text-violet-300">
                        @{displayUsername}
                      </p>
                    </div>
                  </div>

                  {/* O'ng tomonda tepada: Speaker sherigim profili */}
                  <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-white/[0.08] bg-[#0b071b]/90 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {matchedPartner.avatarUrl ? (
                          <img
                            src={matchedPartner.avatarUrl}
                            alt={matchedPartner.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-400/60"
                          />
                        ) : (
                          <SpeakerAvatar size={48} />
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0b071b]">
                          <UserCheck className="h-2.5 w-2.5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                            Sherik
                          </span>
                          <p className="truncate text-sm font-bold text-white">
                            {matchedPartner.name}
                          </p>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-mono font-medium text-violet-300">
                          @{matchedPartner.username}
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
                </div>

                {/* ── Main Meeting Area: Chapda Shikoyatlar, O'rtada Tagma-tag Katta Avatarlar va Tugmalar ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* ── CHAP TOMON: Shikoyatlar bo'limi ── */}
                  <div className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/85 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                      <Flag className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Shikoyat bildirish
                      </h3>
                    </div>

                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      Suhbatdosh nojo'ya xatti-harakat qilsa, belgilab jo'nating:
                    </p>

                    {/* Shikoyat variantlari (Select tugmalari) */}
                    <div className="flex flex-col gap-2">
                      {COMPLAINT_OPTIONS.map((reason) => {
                        const isSelected = selectedReasons.includes(reason);
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => handleToggleReason(reason)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all text-xs",
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

                    {/* Batafsil izoh textarea */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-400">
                        Batafsil izoh:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Qo'shimcha tafsilotlar yozing..."
                        value={complaintDetails}
                        onChange={(e) => setComplaintDetails(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] p-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    {/* Jo'natish tugmasi */}
                    {complaintSent ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-2.5 text-center text-xs font-semibold text-emerald-300">
                        ✓ Shikoyatingiz qabul qilindi
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          complaintSubmitting ||
                          (selectedReasons.length === 0 && !complaintDetails.trim())
                        }
                        onClick={handleSubmitComplaint}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-600/80 to-amber-700/80 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50 transition-all"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span>{complaintSubmitting ? "Jo'natilmoqda..." : "Shikoyatni jo'natish"}</span>
                      </button>
                    )}
                  </div>

                  {/* ── O'RTA VA O'NG TOMON: Tagma-tag Katta Avatarlar + Boshqaruv Tugmalari ── */}
                  <div className="lg:col-span-8 flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0b071b]/85 p-6 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                    {/* Tagma-tag Katta Avatarlar (Top: My Avatar, Bottom: Speaker Partner Avatar) */}
                    <div className="flex flex-col items-center gap-8 my-4">
                      {/* 1. Mening Katta Avatarim (Gapirganda animated light gradient border bilan yonadi) */}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={cn(
                            "relative rounded-full transition-all duration-300",
                            isMySpeaking
                              ? "p-[4px] bg-gradient-to-tr from-violet-400 via-fuchsia-400 to-indigo-400 shadow-[0_0_40px_rgba(168,85,247,0.85)] scale-105 animate-pulse"
                              : "p-[3px] bg-white/10"
                          )}
                        >
                          <div className="overflow-hidden rounded-full h-28 w-28 sm:h-32 sm:w-32 bg-[#120b2d]">
                            <SpeakerAvatar size={128} />
                          </div>
                          {isMySpeaking && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 shadow-glow">
                              <AudioWaveform className="h-3.5 w-3.5 text-white animate-pulse" />
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white">{displayName}</p>
                          <p className="text-xs font-mono text-violet-300">@{displayUsername}</p>
                        </div>
                      </div>

                      {/* O'rtada Jonli Ovozli Aloqa Statusi */}
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Jonli ovozli suhbat faol</span>
                      </div>

                      {/* 2. Speaker Sherigimning Katta Avatari (Gapirganda animated light gradient border bilan yonadi) */}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={cn(
                            "relative rounded-full transition-all duration-300",
                            isPartnerSpeaking
                              ? "p-[4px] bg-gradient-to-tr from-cyan-400 via-violet-400 to-fuchsia-400 shadow-[0_0_40px_rgba(56,189,248,0.85)] scale-105 animate-pulse"
                              : "p-[3px] bg-white/10"
                          )}
                        >
                          <div className="overflow-hidden rounded-full h-28 w-28 sm:h-32 sm:w-32 bg-[#120b2d]">
                            {matchedPartner.avatarUrl ? (
                              <img
                                src={matchedPartner.avatarUrl}
                                alt={matchedPartner.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <SpeakerAvatar size={128} />
                            )}
                          </div>
                          {isPartnerSpeaking && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 shadow-glow">
                              <AudioWaveform className="h-3.5 w-3.5 text-white animate-pulse" />
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white">{matchedPartner.name}</p>
                          <p className="text-xs font-mono text-violet-300">@{matchedPartner.username}</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Boshqaruv Paneli: Mikrofon, Chat (Dropdown), Suhbatni tugatish (Qizil) ── */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative">
                      {/* 1. Mikrofon Tugmasi (Bosganda yonsin, yana bossa o'chsin) */}
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
                        {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                      </button>

                      {/* 2. Chat Tugmasi (Bosganda dropdown chat ochilsin) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setChatOpen((o) => !o);
                            setUnreadChatCount(0);
                          }}
                          className={cn(
                            "relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg",
                            chatOpen
                              ? "border-violet-400 bg-white/15 text-white"
                              : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white"
                          )}
                          title="Yozishmalar (Chat)"
                        >
                          <MessageSquare className="h-6 w-6" />
                          {unreadChatCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-extrabold text-white ring-2 ring-[#0b071b] animate-bounce">
                              {unreadChatCount}
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
                                  Jonli yozishma (@{matchedPartner.username})
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

                            {/* Chat Message List (Vaqtinchalik, keshlanmaydi) */}
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
                                      {msg.isMe ? "Siz" : msg.senderName}
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
                                placeholder="Xabar yozing..."
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

                      {/* 3. Suhbatni Tugatish Qizil Tugmasi */}
                      <button
                        type="button"
                        onClick={() => setEndMeetingModalOpen(true)}
                        className="flex h-14 items-center gap-2 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-600 to-rose-700 px-5 text-sm font-bold text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <PhoneOff className="h-5 w-5" />
                        <span>Suhbatni tugatish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
                          <span>Assalomu alaykum, {displayName}</span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          Qaysi tilda gaplashishni xohlaysiz?
                        </h1>
                        <p className="mt-1.5 text-[13px] text-zinc-400 leading-relaxed">
                          O'zingizga mos tildagi suhbatdoshni tanlang va darhol jonli muloqotni boshlang.
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-2 select-none pointer-events-none">
                          {LANGUAGES.map((lang) => (
                            <div
                              key={lang.id}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                            >
                              <CountryFlag
                                code={lang.flagCode}
                                width={40}
                                className="h-4 w-5.5 rounded-[3px]"
                              />
                              <span>{lang.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-4 self-end xl:self-center shrink-0">
                        <div className="text-right">
                          <p className="font-script text-base text-violet-200 leading-tight">
                            Yangi odamlar bilan tanishing, <br />
                            <span className="text-violet-400">yangi tillar o'rganing!</span>
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

                  {/* ── B. 3-Metric Stats Bar (all 0) ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-400">Ketma-ket kunlar</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-bold tracking-tight text-white tabular-nums">
                            0 kun
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            <Flame className="h-3 w-3 text-amber-400" />
                            kun
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-400">Umumiy mashq vaqti</p>
                        <p className="mt-1 text-lg font-bold tracking-tight text-white tabular-nums">
                          0 min
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300">
                        <Gem className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-400">Yig'ilgan olmoslar</p>
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
                            Jonli muloqot xonasi
                          </h2>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Speaker (sherik) tilini tanlang va START tugmasini bosing
                        </p>
                      </div>

                      {/* Compact Speaker Language Dropdown */}
                      <div className="relative w-full sm:w-[230px] shrink-0">
                        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          <Users className="h-3 w-3 text-violet-400" />
                          <span>Speaker (Sherik) tili</span>
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
                              {speakerOption.name}
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
                                    <span className="text-xs font-medium text-white">{opt.name}</span>
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
                                    Ruxsat...
                                  </span>
                                </div>
                              ) : isSearching ? (
                                <div className="flex flex-col items-center justify-center">
                                  <Radio className="h-6 w-6 text-white animate-pulse" />
                                  <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-100">
                                    Qidirilmoqda
                                  </span>
                                  <span className="mt-0.5 text-xs font-mono font-bold text-white tabular-nums">
                                    {formatSeconds(searchSeconds)} / 02:00
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center">
                                  <Play className="h-7 w-7 fill-white text-white translate-x-0.5 group-hover:scale-110 transition-transform duration-150" />
                                  <span className="mt-1.5 text-sm sm:text-base font-extrabold tracking-widest uppercase">
                                    START
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
                              <span>Bekor qilish</span>
                            </button>
                          )}
                        </div>

                        {/* Partner Slot to the Right of START */}
                        <div className="w-full max-w-[270px] rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                          <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              Speaker (Sherik) hisobi
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
                                {isSearching ? "Sherik qidirilmoqda..." : "Sherik kutilmoqda"}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                                {isSearching ? `${speakerOption.name} serverida...` : "@username"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.05] pt-4 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Mic className="h-3.5 w-3.5 text-violet-400" />
                          Mikrofon ruxsati talab etiladi
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-700" />
                        <span className="inline-flex items-center gap-1.5">
                          <Headphones className="h-3.5 w-3.5 text-violet-400" />
                          HD Audio
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-700" />
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          Maksimal kutish: 2 daqiqa
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400">
                          <Gem className="h-4 w-4" />
                        </div>
                        <span className="text-[13px] font-semibold text-white">Kunlik olmoscha</span>
                        <Info className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                      <span className="text-xs font-bold text-zinc-300 tabular-nums">
                        {dailyProgress} / 10
                      </span>
                    </div>

                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                        style={{ width: `${(dailyProgress / 10) * 100}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimDiamond}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-amber-500/30 py-2 text-xs font-semibold text-amber-300 transition-all"
                    >
                      <Gem className="h-3.5 w-3.5 text-amber-400" />
                      <span>Kunlik olmoslarni olish</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#0b071b]/85 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300">
                          <Gem className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-400">Jami hisobdagi olmoslar</p>
                          <p className="mt-0.5 text-2xl font-bold tracking-tight text-white tabular-nums">
                            {diamonds}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                        Balans
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-1 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setDepositModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-violet-400/40 py-2.5 px-4 text-xs font-semibold text-white transition-all"
                      >
                        <Plus className="h-4 w-4 text-violet-400" />
                        <span>Hisobni to'ldirish</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPremiumModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/90 via-purple-600/90 to-indigo-600/90 hover:brightness-110 py-2.5 px-4 text-xs font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all"
                      >
                        <Crown className="h-4 w-4 text-amber-200" />
                        <span>Premium xarid qilish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

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
              Rostdan ham suhbatni tugatmoqchimisiz?
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Suhbat tugatilsa, joriy xona yopiladi va barcha vaqtinchalik yozishmalar tozalanadi.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEndMeetingModalOpen(false)}
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-xs font-bold text-zinc-200 hover:bg-white/10 transition-colors"
              >
                Yo'q
              </button>

              <button
                type="button"
                onClick={handleConfirmEndMeeting}
                className="flex items-center justify-center rounded-xl border border-red-500/40 bg-gradient-to-r from-red-600 to-rose-700 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:brightness-110 transition-all"
              >
                Ha
              </button>
            </div>
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
              className="mt-5 w-full rounded-xl text-xs bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600"
            >
              Obunani faollashtirish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
