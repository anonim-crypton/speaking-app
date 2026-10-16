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
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { DASHBOARD_TRANSLATIONS } from "@/i18n/dashboardTranslations";
import UserSidebar, { type UserNavTab } from "@/components/UserSidebar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
  const { user, logout } = useAuth();
  const { lang } = useLanguage();
  const dt = DASHBOARD_TRANSLATIONS[lang] ?? DASHBOARD_TRANSLATIONS.uz;

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
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);

  // Messages & Notifications modal state
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

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

  // Diamonds & Daily reward state
  const [diamonds, setDiamonds] = useState<number>(user?.diamonds ?? 0);
  const [dailyProgress, setDailyProgress] = useState<number>(0);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

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
          triggerEnterMeeting(data.partner, data.roomId || null, data.role || "callee");
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

  // Real-time Room Heartbeat, Chat, WebRTC Audio & Partner events
  useEffect(() => {
    if (!inMeetingRoom || !activeRoomId) return;

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

  const handleClaimDiamond = () => {
    if (dailyProgress >= 10) return;
    setDailyProgress((p) => p + 1);
    setDiamonds((d) => d + 10);
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
      if (data?.success && Array.isArray(data.sessions)) {
        setDevices(data.sessions);
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
    <div className="mx-auto max-w-2xl flex flex-col gap-5 animate-in fade-in duration-200">
      {/* ── Profile Header Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#120c2d]/90 via-[#0a071c]/95 to-[#0e0924]/90 p-6 shadow-2xl backdrop-blur-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl"
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar with Glow Ring */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 p-0.5 shadow-[0_0_25px_rgba(139,92,246,0.5)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0d0822] overflow-hidden">
                <SpeakerAvatar size={76} />
              </div>
            </div>
            <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0d0822]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white truncate">{displayName}</h2>
              {user?.countryCode && (
                <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs">
                  <CountryFlag code={user.countryCode} width={20} className="h-3 w-4 rounded-xs" />
                  <span className="text-zinc-300 font-semibold">{user.countryCode}</span>
                </div>
              )}
            </div>
            <p className="mt-0.5 text-xs font-mono font-medium text-violet-300">
              @{displayUsername}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400">
              {user?.email && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="truncate max-w-[200px]">{user.email}</span>
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
              <span>0 {dt.stats.days}</span>
              <Flame className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-400 font-medium">{dt.profile.streak}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-300">
              <span>#1</span>
              <Trophy className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-400 font-medium">{dt.profile.rank}</p>
          </div>
        </div>

        {/* ── Action Buttons for Balance & Premium ── */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
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
      <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl flex flex-col gap-1.5">
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
              <p className="text-sm font-semibold text-white">Ilova tili</p>
              <p className="text-[11px] text-zinc-400">Interfeys tilini tanlang</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* 1. Mening tarixim */}
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
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

        {/* 2. Do'stlar */}
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
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

        {/* 3. Reyting */}
        <button
          type="button"
          onClick={() => setActiveTab("rating")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
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
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
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

        {/* 5. Qurilmalarim */}
        <button
          type="button"
          onClick={() => setActiveTab("devices")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <Laptop className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{dt.sidebar.devices}</p>
              <p className="text-[11px] text-zinc-400">Faol seanslar va xavfsizlik nazorati</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 6. Yordam */}
        <button
          type="button"
          onClick={() => setActiveTab("help")}
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
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
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
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
          href="https://t.me"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl p-3 text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400 group-hover:scale-105 transition-transform">
              <Headset className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Admin bilan bog'lanish</p>
              <p className="text-[11px] text-zinc-400">Telegram orqali tezkor yordam</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </a>

        {/* 9. Chiqish */}
        <div className="pt-2 mt-1 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={logout}
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
    <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{dt.sidebar.history}</h1>
          <p className="text-xs text-zinc-400">O'tkazilgan suhbatlar va audio mashg'ulotlar tarixi</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-300 mb-4 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
          <History className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Hozircha suhbatlar tarixi mavjud emas</h3>
        <p className="mt-2 max-w-md mx-auto text-xs text-zinc-400 leading-relaxed">
          Suhbatdoshlar bilan suhbatlashganingizdan so'ng barcha gaplashish tarixingiz shu yerda saqlanadi.
        </p>

        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>Suhbatni boshlash</span>
        </button>
      </div>
    </div>
  );

  const renderFriendsView = () => (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{dt.friends.title}</h1>
            <p className="text-xs text-zinc-400">{dt.friends.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-500/10 text-sky-400 mb-4 shadow-[0_0_25px_rgba(56,189,248,0.2)]">
          <Users className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white">{dt.friends.emptyTitle}</h3>
        <p className="mt-2 max-w-md mx-auto text-xs text-zinc-400 leading-relaxed">
          {dt.friends.emptyDesc}
        </p>

        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>{dt.friends.startMeeting}</span>
        </button>
      </div>
    </div>
  );

  const renderRatingView = () => (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{dt.rating.title}</h1>
          <p className="text-xs text-zinc-400">{dt.rating.subtitle}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400 mb-4 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
          <Trophy className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Hozircha reyting ma'lumotlari mavjud emas</h3>
        <p className="mt-2 max-w-md mx-auto text-xs text-zinc-400 leading-relaxed">
          Foydalanuvchilar suhbatlashgan sari haftalik va oylik reyting jadvali shu yerda shakllanib boradi.
        </p>

        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>Suhbatni boshlash</span>
        </button>
      </div>
    </div>
  );

  const renderAchievementsView = () => (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{dt.achievements.title}</h1>
          <p className="text-xs text-zinc-400">{dt.achievements.subtitle}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 mb-4 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
          <Award className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Hozircha yutuqlar ochilmagan</h3>
        <p className="mt-2 max-w-md mx-auto text-xs text-zinc-400 leading-relaxed">
          Kunlik ketma-ketlik va suhbatlar orqali yangi nishonlar va sovrinlarni qo'lga kiriting.
        </p>

        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>Suhbatni boshlash</span>
        </button>
      </div>
    </div>
  );

  const renderDevicesView = () => (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-in fade-in duration-200">
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
    <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-in fade-in duration-200">
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

      <div className="flex flex-col gap-3">
        {dt.help.faqs.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-4 backdrop-blur-xl"
          >
            <h3 className="text-sm font-bold text-white mb-1.5">{item.q}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeedbackView = () => (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 animate-in fade-in duration-200">
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

      <div className="rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-6 shadow-2xl backdrop-blur-2xl">
        {feedbackSent ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 mb-3">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-white">{dt.feedback.successTitle}</h3>
            <p className="mt-1 text-xs text-zinc-400">
              {dt.feedback.successDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                setFeedbackSent(false);
                setFeedbackText("");
              }}
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              {dt.feedback.newFeedback}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (feedbackText.trim()) setFeedbackSent(true);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                {dt.feedback.label}
              </label>
              <textarea
                rows={5}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={dt.feedback.placeholder}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={!feedbackText.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{dt.feedback.submit}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );

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

      {/* ── 1. Left Sidebar (hidden in full meeting mode for immersion, and hidden on mobile) ── */}
      {!inMeetingRoom && (
        <UserSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={sidebarCollapsed}
          onOpenPremium={() => setPremiumModalOpen(true)}
          className="hidden md:flex"
        />
      )}

      {/* ── 2. Viewport ── */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-transparent pb-20 md:pb-0">
        {/* iOS 26 Liquid Glass Translucent Sticky Navbar (Only on dashboard) */}
        {!inMeetingRoom && (
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
              <LanguageSwitcher />

              {/* Xabarlar tugmasi (Account avatar o'rniga navbar yonida) */}
              <button
                type="button"
                onClick={() => setMessagesModalOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                title="Xabarlar"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#080514]" />
              </button>

              {/* Bildirishnomalar */}
              <button
                type="button"
                onClick={() => setNotificationsModalOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                title={dt.topbar.notifications}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-400 ring-2 ring-[#080514]" />
              </button>
            </div>
          </header>
        )}

        {/* ── 3. Content Body (Switches between Dashboard, Tab Views and Meeting Chat Room) ── */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 bg-transparent max-w-full overflow-x-hidden">
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

                {/* ── Main Meeting Area: Tagma-tag Katta Avatarlar + Boshqaruv Tugmalari (Markazda) ── */}
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-[#0b071b]/85 p-6 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
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
                  <div className="mt-8 flex flex-col items-center gap-4 w-full">
                    <div className="flex flex-wrap items-center justify-center gap-4 relative">
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
                        {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
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
                          title="Yozishmalar (Chat)"
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
                        <span>{dt.meeting.endCall}</span>
                      </button>
                    </div>

                    {/* 4. Shikoyat bildirish tugmasi - Suhbatni tugatish tugmasining tagida */}
                    <div className="w-full flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setComplaintModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 transition-all cursor-pointer shadow-sm"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span>Shikoyat bildirish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "profile" ? (
              renderProfileView()
            ) : activeTab === "history" ? (
              renderHistoryView()
            ) : activeTab === "friends" ? (
              renderFriendsView()
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
                              <span>{l.name}</span>
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

                  {/* ── B. 3-Metric Stats Bar (all 0) ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b071b]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-400">{dt.stats.streak}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-bold tracking-tight text-white tabular-nums">
                            0 {dt.stats.days}
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
                          0 {dt.stats.hours}
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
                                    {formatSeconds(searchSeconds)} / 02:00
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400">
                          <Gem className="h-4 w-4" />
                        </div>
                        <span className="text-[13px] font-semibold text-white">{dt.reward.dailyTitle}</span>
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
                      <span>{dt.reward.claimBtn}</span>
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
      {!inMeetingRoom && (
        <nav
          aria-label="Pastki mobil navigatsiya"
          className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/[0.1] bg-[#090518]/95 px-2 backdrop-blur-2xl backdrop-saturate-[180%] md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
        >
          {/* 1. Bosh sahifa */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer",
              activeTab === "home" ? "text-violet-400" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                activeTab === "home" ? "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.4)]" : ""
              )}
            >
              <Home className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">{dt.sidebar.home}</span>
          </button>

          {/* 2. Mening tarixim */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer",
              activeTab === "history" ? "text-violet-400" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                activeTab === "history" ? "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.4)]" : ""
              )}
            >
              <History className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">{dt.sidebar.history}</span>
          </button>

          {/* 3. Do'stlar */}
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer",
              activeTab === "friends" ? "text-violet-400" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                activeTab === "friends" ? "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.4)]" : ""
              )}
            >
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">{dt.sidebar.friends}</span>
          </button>

          {/* 4. Profil (faqat avatar) */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="flex flex-1 flex-col items-center justify-center py-1 transition-all cursor-pointer"
            title={dt.sidebar.profile}
          >
            <div
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full transition-all overflow-hidden p-0.5",
                activeTab === "profile"
                  ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-[#090518] shadow-[0_0_14px_rgba(139,92,246,0.7)] scale-105"
                  : "ring-1 ring-white/25 hover:ring-white/50 opacity-80 hover:opacity-100"
              )}
            >
              <SpeakerAvatar size={32} />
            </div>
            <span className="text-[10px] font-medium tracking-tight">{dt.sidebar.profile}</span>
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
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 cursor-pointer"
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

      {/* ── Xabarlar modali ── */}
      {messagesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0e0922] p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Xabarlar</h3>
            <p className="mt-2 text-xs text-zinc-400">
              Hozircha yangi xabarlar mavjud emas. Suhbatlar va bildirishnomalar shu yerda ko'rinadi.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessagesModalOpen(false)}
              className="mt-5 w-full rounded-xl text-xs border-white/10 cursor-pointer"
            >
              Yopish
            </Button>
          </div>
        </div>
      )}

      {/* ── Bildirishnomalar modali ── */}
      {notificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0e0922] p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300 mb-3">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Bildirishnomalar</h3>
            <p className="mt-2 text-xs text-zinc-400">
              Hozircha yangi bildirishnomalar mavjud emas.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotificationsModalOpen(false)}
              className="mt-5 w-full rounded-xl text-xs border-white/10 cursor-pointer"
            >
              Yopish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
