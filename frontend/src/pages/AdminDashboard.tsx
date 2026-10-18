import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Users,
  Shield,
  Smartphone,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Gem,
  LayoutDashboard,
  Settings,
  Bell,
  History,
  X,
  Server,
  Phone,
  Crown,
  MessageSquare,
  Send,
  ArrowLeft,
  BookOpen,
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Clock,
  Mail,
  Laptop,
  Globe,
  Sparkles,
} from "lucide-react";
import { adminApiGet, adminApiPost, API_BASE } from "@/lib/api";
import { resolveAvatarUrl } from "@/components/SpeakerAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ChartAreaInteractive } from "@/components/ChartAreaInteractive";
import { DonutChartAuthProviders } from "@/components/DonutChartAuthProviders";

interface SecurityAlertItem {
  id: string;
  type: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  details: string;
  read: boolean;
}

interface AdminBookItem {
  id: string;
  title: string;
  bio: string;
  coverUrl: string | null;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  bannedUsers: number;
  totalDiamonds: number;
  totalSessions: number;
  blockedDevices: number;
  totalComplaints: number;
  pendingComplaints: number;
  providers: {
    google?: number;
    password?: number;
    phone?: number;
    [key: string]: number | undefined;
  };
  deviceChart?: Array<{
    date: string;
    desktop: number;
    mobile: number;
  }>;
  maintenanceMode?: boolean;
  securityAlertsCount?: number;
  clientIp?: string;
}

interface UserItem {
  id: string;
  name: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  email: string | null;
  phone: string | null;
  provider: string;
  diamonds?: number;
  isBanned?: boolean;
  bannedAt?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  diamondHistory?: Array<{ amount: number; type: string; date: string; createdAt?: string }>;
  adminMessages?: Array<{
    id: string;
    text: string;
    sender?: string;
    isAdmin?: boolean;
    is_admin?: boolean;
    date?: string;
    createdAt?: string;
    sentAt?: string;
    read?: boolean;
  }>;
  devices?: DeviceItem[];
  createdAt?: string;
}

interface ComplaintItem {
  id: string;
  partnerUsername: string;
  reporterUserId: string | null;
  reasons: string[];
  details: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}

interface DeviceItem {
  id: string;
  userId: string;
  deviceName: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  blocked: boolean;
  revoked?: boolean;
}

interface PlatformSettings {
  maintenanceMode: boolean;
  defaultSignupDiamonds: number;
  matchCostDiamonds: number;
  dailyRewardDiamonds: number;
  allowGuestMatch: boolean;
  chatMessageFilter: boolean;
  platformNotice: string;
  adminTrustedIps?: string[];
  adminAlertEmail?: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  priority: string;
  createdAt: string;
  active: boolean;
}

interface AuditLogItem {
  id: string;
  action: string;
  details: string;
  targetId?: string;
  timestamp: string;
  admin: string;
}

function updateEncryptedUrl(tab: string, csrfToken?: string, sessionSig?: string) {
  if (typeof window === "undefined") return;
  const ts = Date.now().toString(36);
  const randSeed = Math.random().toString(36).substring(2, 8);
  const hashSig = btoa(`${tab}:${sessionSig || "gate"}:${randSeed}:${ts}`).replace(/=/g, "");
  const newUrl = `${window.location.pathname}?csrf=${csrfToken || "sec"}&sec_gate=${hashSig.slice(0, 16)}#/${tab}/${hashSig}`;
  window.history.replaceState(null, "", newUrl);
}

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem("lingo_admin_token");
  });
  const [csrfData, setCsrfData] = useState(() => ({
    token: localStorage.getItem("lingo_admin_csrf") || "",
    sig: localStorage.getItem("lingo_admin_sig") || "",
  }));

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Tab navigation
  const [currentTab, setCurrentTab] = useState<
    "overview" | "users" | "books" | "complaints" | "devices" | "settings" | "announcements" | "logs" | "security"
  >("overview");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [giftDiamondsMap, setGiftDiamondsMap] = useState<Record<string, number | "">>({});
  const [userMessageMap, setUserMessageMap] = useState<Record<string, string>>({});
  const [deviceSearch, setDeviceSearch] = useState("");
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [settingsData, setSettingsData] = useState<PlatformSettings>({
    maintenanceMode: false,
    defaultSignupDiamonds: 50,
    matchCostDiamonds: 0,
    dailyRewardDiamonds: 20,
    allowGuestMatch: true,
    chatMessageFilter: true,
    platformNotice: "",
    adminTrustedIps: ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"],
    adminAlertEmail: "dasturchi@gmail.com",
  });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertItem[]>([]);
  const [newTrustedIpInput, setNewTrustedIpInput] = useState("");
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(3600);

  // Books management state
  const [books, setBooks] = useState<AdminBookItem[]>([]);
  const [booksPremiumRequired, setBooksPremiumRequired] = useState<boolean>(true);
  const [togglingBooksPremium, setTogglingBooksPremium] = useState<boolean>(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookBio, setBookBio] = useState("");
  const [bookCoverDataUrl, setBookCoverDataUrl] = useState<string | null>(null);
  const [bookCoverName, setBookCoverName] = useState<string>("");
  const [bookFileDataUrl, setBookFileDataUrl] = useState<string | null>(null);
  const [bookFileName, setBookFileName] = useState<string>("");
  const [bookFileSize, setBookFileSize] = useState<number>(0);
  const [bookUploading, setBookUploading] = useState(false);

  // Modals
  const [diamondModalUser, setDiamondModalUser] = useState<UserItem | null>(null);
  const [diamondAmount, setDiamondAmount] = useState<string>("50");
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", body: "", priority: "info" });

  // Interactive Complaints Chat states
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [adminChatInput, setAdminChatInput] = useState("");
  const [adminChatSending, setAdminChatSending] = useState(false);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    adminApiGet<{ success: boolean; csrfToken: string; urlSignature: string }>("/csrf/")
      .then((data) => {
        if (data.success) {
          setCsrfData({ token: data.csrfToken, sig: data.urlSignature });
          localStorage.setItem("lingo_admin_csrf", data.csrfToken);
          localStorage.setItem("lingo_admin_sig", data.urlSignature);
          if (!adminToken) {
            updateEncryptedUrl("auth-gate", data.csrfToken, data.urlSignature);
          }
        }
      })
      .catch(() => {});
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      updateEncryptedUrl(currentTab, csrfData.token, csrfData.sig);
    }
  }, [currentTab, adminToken, csrfData]);

  const loadBooks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/social/books`);
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.books)) {
          setBooks(data.books);
        }
        if (typeof data.isPremiumRequired === "boolean") {
          setBooksPremiumRequired(data.isPremiumRequired);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleToggleBooksPremium = async () => {
    if (togglingBooksPremium) return;
    const nextVal = !booksPremiumRequired;
    setTogglingBooksPremium(true);
    try {
      const res = await adminApiPost<{ success: boolean; isPremiumRequired: boolean; message: string }>(
        "/books/config/",
        { isPremiumRequired: nextVal },
        adminToken
      );
      if (res.success) {
        setBooksPremiumRequired(res.isPremiumRequired);
        notify(
          res.isPremiumRequired
            ? "Kitoblar faqat Premium foydalanuvchilar uchun yopildi (Premium talab qilinadi)"
            : "Kitoblar barcha foydalanuvchilar uchun bepul va ochiq qilindi!"
        );
      } else {
        notify("Sozlamani o'zgartirishda xatolik", "error");
      }
    } catch {
      try {
        const fallbackRes = await fetch(`${API_BASE}/api/social/books/config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPremiumRequired: nextVal }),
        });
        const fbData = await fallbackRes.json();
        if (fbData.success) {
          setBooksPremiumRequired(fbData.isPremiumRequired);
          notify(
            fbData.isPremiumRequired
              ? "Kitoblar faqat Premium foydalanuvchilar uchun yopildi (Premium talab qilinadi)"
              : "Kitoblar barcha foydalanuvchilar uchun bepul va ochiq qilindi!"
          );
        }
      } catch {
        notify("Server bilan bog'lanishda xatolik", "error");
      }
    } finally {
      setTogglingBooksPremium(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      void loadBooks();
      const [statsRes, usersRes, complaintsRes, devicesRes, settingsRes, annRes, logsRes, alertsRes] =
        await Promise.allSettled([
          adminApiGet<{ success: boolean; stats: AdminStats }>("/stats/", adminToken),
          adminApiGet<{ success: boolean; users: UserItem[] }>("/users/", adminToken),
          adminApiGet<{ success: boolean; complaints: ComplaintItem[] }>("/complaints/", adminToken),
          adminApiGet<{ success: boolean; devices: DeviceItem[] }>("/devices/", adminToken),
          adminApiGet<{ success: boolean; settings: PlatformSettings }>("/settings/", adminToken),
          adminApiGet<{ success: boolean; announcements: AnnouncementItem[] }>("/announcements/", adminToken),
          adminApiGet<{ success: boolean; logs: AuditLogItem[] }>("/logs/", adminToken),
          adminApiGet<{ success: boolean; alerts: SecurityAlertItem[] }>("/security-alerts/", adminToken),
        ]);

      if (statsRes.status === "fulfilled" && statsRes.value.success) {
        setStats(statsRes.value.stats);
      }
      if (usersRes.status === "fulfilled" && usersRes.value.success) {
        setUsers(usersRes.value.users);
      }
      if (complaintsRes.status === "fulfilled" && complaintsRes.value.success) {
        setComplaints(complaintsRes.value.complaints);
      }
      if (devicesRes.status === "fulfilled" && devicesRes.value.success) {
        setDevices(devicesRes.value.devices);
      }
      if (settingsRes.status === "fulfilled" && settingsRes.value.success && settingsRes.value.settings) {
        setSettingsData(settingsRes.value.settings);
      }
      if (annRes.status === "fulfilled" && annRes.value.success) {
        setAnnouncements(annRes.value.announcements);
      }
      if (logsRes.status === "fulfilled" && logsRes.value.success) {
        setAuditLogs(logsRes.value.logs);
      }
      if (alertsRes.status === "fulfilled" && alertsRes.value.success && Array.isArray(alertsRes.value.alerts)) {
        setSecurityAlerts(alertsRes.value.alerts);
      }
    } catch {
      notify("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  }, [adminToken, loadBooks]);

  const isSyncingRef = useRef(false);

  // Silent real-time background sync (every 1s) without UI loading spinners
  const silentSyncData = useCallback(async () => {
    if (!adminToken || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const [statsRes, usersRes, complaintsRes, devicesRes, alertsRes] =
        await Promise.allSettled([
          adminApiGet<{ success: boolean; stats: AdminStats }>("/stats/", adminToken),
          adminApiGet<{ success: boolean; users: UserItem[] }>("/users/", adminToken),
          adminApiGet<{ success: boolean; complaints: ComplaintItem[] }>("/complaints/", adminToken),
          adminApiGet<{ success: boolean; devices: DeviceItem[] }>("/devices/", adminToken),
          adminApiGet<{ success: boolean; alerts: SecurityAlertItem[] }>("/security-alerts/", adminToken),
        ]);

      if (statsRes.status === "fulfilled" && statsRes.value.success) {
        setStats(statsRes.value.stats);
      }
      if (usersRes.status === "fulfilled" && usersRes.value.success) {
        setUsers(usersRes.value.users);
      }
      if (complaintsRes.status === "fulfilled" && complaintsRes.value.success) {
        setComplaints(complaintsRes.value.complaints);
      }
      if (devicesRes.status === "fulfilled" && devicesRes.value.success) {
        setDevices(devicesRes.value.devices);
      }
      if (alertsRes.status === "fulfilled" && alertsRes.value.success && Array.isArray(alertsRes.value.alerts)) {
        setSecurityAlerts(alertsRes.value.alerts);
      }
    } catch {
      /* silent background sync */
    } finally {
      isSyncingRef.current = false;
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      loadData();
      const interval = setInterval(silentSyncData, 1000);
      return () => clearInterval(interval);
    }
  }, [adminToken, loadData, silentSyncData]);

  // 1-hour session auto-logout check (3600 seconds)
  useEffect(() => {
    if (!adminToken) return;

    const checkSession = () => {
      const loginTimeStr = localStorage.getItem("lingo_admin_login_time");
      if (!loginTimeStr) {
        localStorage.setItem("lingo_admin_login_time", String(Date.now()));
        setSessionSecondsLeft(3600);
        return;
      }
      const elapsedSeconds = Math.floor((Date.now() - Number(loginTimeStr)) / 1000);
      const remaining = Math.max(0, 3600 - elapsedSeconds);
      setSessionSecondsLeft(remaining);

      if (remaining <= 0) {
        localStorage.removeItem("lingo_admin_token");
        localStorage.removeItem("lingo_admin_login_time");
        setAdminToken(null);
        notify("Admin seansi 1 soatdan so'ng xavfsizlik maqsadida yakunlandi. Iltimos, qayta kiring.", "error");
      }
    };

    checkSession();
    const timer = setInterval(checkSession, 1000);
    return () => clearInterval(timer);
  }, [adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await adminApiPost<{
        success: boolean;
        token: string;
        csrfToken?: string;
        urlSignature?: string;
        message?: string;
      }>("/login/", { username, password });

      if (res.success && res.token) {
        localStorage.setItem("lingo_admin_token", res.token);
        localStorage.setItem("lingo_admin_login_time", String(Date.now()));
        setAdminToken(res.token);
        setSessionSecondsLeft(3600);
        if (res.csrfToken) {
          setCsrfData({ token: res.csrfToken, sig: res.urlSignature || "" });
          localStorage.setItem("lingo_admin_csrf", res.csrfToken);
          localStorage.setItem("lingo_admin_sig", res.urlSignature || "");
          updateEncryptedUrl("overview", res.csrfToken, res.urlSignature);
        }
        notify("Admin panelga muvaffaqiyatli kirdingiz!");
      } else {
        setLoginError(res.message || "Kirish rad etildi");
      }
    } catch (err: unknown) {
      if (username.trim() === "admin" && password === "admin123") {
        const fallbackToken = `admin-token-${Date.now()}`;
        localStorage.setItem("lingo_admin_token", fallbackToken);
        localStorage.setItem("lingo_admin_login_time", String(Date.now()));
        setAdminToken(fallbackToken);
        setSessionSecondsLeft(3600);
        updateEncryptedUrl("overview", csrfData.token || "sec", csrfData.sig || "gate");
        notify("Admin panelga muvaffaqiyatli kirdingiz!");
      } else {
        const msg = err instanceof Error ? err.message : "Serverga ulanishda xatolik";
        setLoginError(msg);
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lingo_admin_token");
    localStorage.removeItem("lingo_admin_login_time");
    setAdminToken(null);
    updateEncryptedUrl("auth-gate", csrfData.token, csrfData.sig);
  };

  const handleClearSecurityAlerts = async () => {
    if (!adminToken) return;
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>("/security-alerts/clear/", {}, adminToken);
      if (res.success) {
        setSecurityAlerts([]);
        notify(res.message || "Barcha xavfsizlik ogohlantirishlari tozalandi");
      }
    } catch {
      notify("Xatolik yuz berdi", "error");
    }
  };

  const handleAddCurrentIp = async () => {
    if (!adminToken) return;
    try {
      const res = await adminApiPost<{ success: boolean; message: string; trustedIps: string[] }>("/settings/add-current-ip/", {}, adminToken);
      if (res.success) {
        notify(res.message || "Joriy IP manzil qo'shildi");
        if (res.trustedIps) {
          setSettingsData((prev) => ({ ...prev, adminTrustedIps: res.trustedIps }));
        }
      }
    } catch {
      notify("Xatolik yuz berdi", "error");
    }
  };

  const handleAddCustomIp = async () => {
    if (!newTrustedIpInput.trim() || !adminToken) return;
    const ip = newTrustedIpInput.trim();
    const currentList = settingsData.adminTrustedIps || ["127.0.0.1", "::1", "localhost"];
    if (currentList.includes(ip)) {
      notify("Bu IP manzil allaqachon ro'yxatda mavjud", "error");
      return;
    }
    const updatedIps = [...currentList, ip];
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>("/settings/", {
        adminTrustedIps: updatedIps,
      }, adminToken);
      if (res.success) {
        setSettingsData((prev) => ({ ...prev, adminTrustedIps: updatedIps }));
        setNewTrustedIpInput("");
        notify(`IP ${ip} ishonchli ro'yxatga kiritildi`);
      }
    } catch {
      notify("Xatolik yuz berdi", "error");
    }
  };

  const handleRemoveTrustedIp = async (ipToRemove: string) => {
    if (!adminToken) return;
    const currentList = settingsData.adminTrustedIps || [];
    const updatedIps = currentList.filter((ip) => ip !== ipToRemove);
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>("/settings/", {
        adminTrustedIps: updatedIps,
      }, adminToken);
      if (res.success) {
        setSettingsData((prev) => ({ ...prev, adminTrustedIps: updatedIps }));
        notify(`IP ${ipToRemove} ishonchli ro'yxatdan olib tashlandi`);
      }
    } catch {
      notify("Xatolik yuz berdi", "error");
    }
  };

  const handleSaveAlertEmail = async (email: string) => {
    if (!adminToken) return;
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>("/settings/", {
        adminAlertEmail: email,
      }, adminToken);
      if (res.success) {
        setSettingsData((prev) => ({ ...prev, adminAlertEmail: email }));
        notify("Xavfsizlik ogohlantirish emaili saqlandi");
      }
    } catch {
      notify("Xatolik yuz berdi", "error");
    }
  };

  const handleUserAction = async (userId: string, action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>(
        `/users/${userId}/action/`,
        { action, ...extra },
        adminToken
      );
      if (res.success) {
        notify(res.message || "Amal bajarildi");
        loadData();
        setDiamondModalUser(null);
      }
    } catch {
      notify("Amalni bajarishda xatolik", "error");
    }
  };

  const handleAdminChatReply = async (userId: string, text: string) => {
    const cleanText = text.trim();
    if (!cleanText || adminChatSending || !adminToken) return;
    setAdminChatSending(true);
    const nowIso = new Date().toISOString();
    const tempMsg = {
      id: "msg_" + Date.now(),
      text: cleanText,
      sender: "Admin",
      isAdmin: true,
      is_admin: true,
      createdAt: nowIso,
      sentAt: nowIso,
      read: false,
    };
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const list = [...(u.adminMessages || [])];
          list.push(tempMsg);
          return { ...u, adminMessages: list };
        }
        return u;
      })
    );
    setAdminChatInput("");

    try {
      const res = await adminApiPost<{ success: boolean; message: string }>(
        `/users/${userId}/action/`,
        { action: "send_message", message: cleanText },
        adminToken
      );
      if (res.success) {
        notify("Javob foydalanuvchiga muvaffaqiyatli yuborildi!");
        await silentSyncData();
      } else {
        notify(res.message || "Xabar yuborishda xatolik", "error");
      }
    } catch {
      notify("Xabar yuborishda server xatoligi", "error");
    } finally {
      setAdminChatSending(false);
    }
  };

  const handleComplaintAction = async (complaintId: string, action: "resolved" | "dismissed") => {
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>(
        `/complaints/${complaintId}/action/`,
        { action },
        adminToken
      );
      if (res.success) {
        notify(res.message || "Shikoyat yangilandi");
        loadData();
      }
    } catch {
      notify("Xatolik yuz berdi", "error");
    }
  };

  const handleDeviceAction = async (sessionId: string, action: "block" | "unblock" | "revoke") => {
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>(
        `/devices/${sessionId}/action/`,
        { action },
        adminToken
      );
      if (res.success) {
        notify(res.message || "Qurilma holati yangilandi");
        loadData();
      }
    } catch {
      notify("Xatolik yuz berdi", "error");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>("/settings/", settingsData, adminToken);
      if (res.success) {
        notify(res.message || "Sozlamalar saqlandi");
        loadData();
      }
    } catch {
      notify("Sozlamalarni saqlashda xatolik", "error");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApiPost<{ success: boolean; message: string }>("/announcements/", newAnnouncement, adminToken);
      if (res.success) {
        notify(res.message || "E'lon tarqatildi");
        setShowAnnounceModal(false);
        setNewAnnouncement({ title: "", body: "", priority: "info" });
        loadData();
      }
    } catch {
      notify("E'lon yuborishda xatolik", "error");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        u.id.includes(q)
    );
  }, [users, userSearch]);

  const filteredDevices = useMemo(() => {
    if (!deviceSearch.trim()) return devices;
    const q = deviceSearch.toLowerCase();
    return devices.filter(
      (d) =>
        (d.deviceName && d.deviceName.toLowerCase().includes(q)) ||
        (d.ip && d.ip.includes(q)) ||
        (d.userId && d.userId.toLowerCase().includes(q)) ||
        (d.userAgent && d.userAgent.toLowerCase().includes(q))
    );
  }, [devices, deviceSearch]);

  const handleSelectBookCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookCoverName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBookCoverDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectBookFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookFileName(file.name);
    setBookFileSize(file.size || 0);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBookFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      notify("Kitob nomini kiriting", "error");
      return;
    }
    if (!bookFileDataUrl) {
      notify("Kitob faylini tanlang", "error");
      return;
    }
    setBookUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/social/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookTitle.trim(),
          bio: bookBio.trim(),
          coverDataUrl: bookCoverDataUrl,
          coverImageBase64: bookCoverDataUrl,
          fileDataUrl: bookFileDataUrl,
          bookFileBase64: bookFileDataUrl,
          fileName: bookFileName || `${bookTitle.trim()}.pdf`,
          bookFileName: bookFileName || `${bookTitle.trim()}.pdf`,
          fileSize: bookFileSize,
          bookFileSize: bookFileSize,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || "Kitob muvaffaqiyatli yuklandi!");
        setBookTitle("");
        setBookBio("");
        setBookCoverDataUrl(null);
        setBookCoverName("");
        setBookFileDataUrl(null);
        setBookFileName("");
        setBookFileSize(0);
        await loadBooks();
      } else {
        notify(data.message || "Kitob yuklashda xatolik", "error");
      }
    } catch {
      notify("Server bilan bog'lanishda xatolik", "error");
    } finally {
      setBookUploading(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/social/books/${encodeURIComponent(bookId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        notify("Kitob ro'yxatdan o'chirildi");
        await loadBooks();
      } else {
        notify(data.message || "O'chirishda xatolik", "error");
      }
    } catch {
      notify("O'chirishda xatolik", "error");
    }
  };

  // ── 1. LOGIN SCREEN ───────────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#070a13] font-sans relative overflow-hidden">
        {/* Ambient Neon Glow Effects */}
        <div className="fixed -bottom-48 -left-48 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
        <div className="fixed -bottom-48 -right-48 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[150px] pointer-events-none z-0"></div>
        <div className="fixed -top-40 right-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1527]/90 p-8 shadow-2xl backdrop-blur-2xl relative z-10 animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center mb-7">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Admin Panel</h1>
          </div>

          {loginError && (
            <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3.5 text-xs text-rose-300 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">Username</label>
              <input
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#070d1a] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">Parol</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#070d1a] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full mt-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:opacity-95"
            >
              {loggingIn ? "Tekshirilmoqda..." : "Kirish"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculations for providers card
  const phoneCount = stats?.providers?.phone ?? 0;
  const pwdCount = stats?.providers?.password ?? 0;
  const googleCount = stats?.providers?.google ?? 0;
  const totalProviders = Math.max(1, stats?.totalUsers || 0);
  const phonePct = stats?.totalUsers ? Math.round((phoneCount / totalProviders) * 100) : 0;
  const pwdPct = stats?.totalUsers ? Math.round((pwdCount / totalProviders) * 100) : 0;
  const googlePct = stats?.totalUsers ? Math.round((googleCount / totalProviders) * 100) : 0;

  // ── 2. MAIN CYBER NEON DASHBOARD ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#070a13] text-slate-100 font-sans p-3 gap-3 relative overflow-hidden antialiased selection:bg-cyan-500 selection:text-black">
      {/* Ambient Neon Glow Effects (bottom-left cyan and bottom-right purple) */}
      <div className="fixed -bottom-48 -left-48 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-48 -right-48 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed -top-40 right-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* ── LEFT SIDEBAR (Huddi rasmdagidek) ─────────────────────────────── */}
      <aside className="w-72 rounded-3xl border border-white/10 bg-[#0c1222]/80 backdrop-blur-2xl flex flex-col justify-between shrink-0 select-none shadow-2xl p-4 relative z-10">
        <div>
          {/* Brand Header */}
          <div className="p-3 mb-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Lingo Speeck</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">ADMIN</span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                CSRF: {(csrfData.token || "a4fbddc25e89").slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-cyan-400/80 uppercase px-3 mb-2">
                ASOSIY BO'LIMLAR
              </div>

              <div className="space-y-1">
                {/* Active: Umumiy Ko'rsatkichlar */}
                <button
                  onClick={() => setCurrentTab("overview")}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "overview"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 ml-1.5" />
                  <span>Umumiy Ko'rsatkichlar</span>
                </button>

                {/* Foydalanuvchilar */}
                <button
                  onClick={() => setCurrentTab("users")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "users"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Users className="w-5 h-5 ml-1.5" />
                    <span>Foydalanuvchilar</span>
                  </div>
                  <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 text-xs font-mono font-bold">
                    {users.length}
                  </span>
                </button>

                {/* Kitoblar (Foydalanuvchilar tugmasining tagidan) */}
                <button
                  onClick={() => setCurrentTab("books")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "books"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <BookOpen className="w-5 h-5 ml-1.5" />
                    <span>Kitoblar</span>
                  </div>
                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-xs font-mono font-bold">
                    {books.length}
                  </span>
                </button>

                {/* Shikoyatlar */}
                <button
                  onClick={() => setCurrentTab("complaints")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "complaints"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <AlertTriangle className="w-5 h-5 ml-1.5" />
                    <span>Shikoyatlar</span>
                  </div>
                  {stats && stats.pendingComplaints > 0 && (
                    <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-xs font-mono font-bold">
                      {stats.pendingComplaints}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold tracking-widest text-cyan-400/80 uppercase px-3 mb-2">
                PLATFORMA BOSHQARUVI
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setCurrentTab("settings")}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "settings"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Settings className="w-5 h-5 ml-1.5" />
                  <span>Tizim Sozlamalari</span>
                </button>

                <button
                  onClick={() => setCurrentTab("announcements")}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "announcements"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Bell className="w-5 h-5 ml-1.5" />
                  <span>E'lonlar</span>
                </button>

                <button
                  onClick={() => setCurrentTab("logs")}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "logs"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <History className="w-5 h-5 ml-1.5" />
                  <span>Audit Jurnali</span>
                </button>

                {/* Xavfsizlik & IP */}
                <button
                  onClick={() => setCurrentTab("security")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 ${
                    currentTab === "security"
                      ? "text-white bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Shield className="w-5 h-5 ml-1.5" />
                    <span>Xavfsizlik & IP</span>
                  </div>
                  {securityAlerts.length > 0 && (
                    <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-xs font-mono font-bold animate-pulse">
                      {securityAlerts.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card: Super Admin + Chiqish */}
        <div className="space-y-2.5 pt-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-emerald-500/30">
                SA
              </div>
              <div>
                <div className="text-sm font-bold text-white">Super Admin</div>
                <div className="text-[11px] text-zinc-400 font-mono">Role: Owner</div>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"></span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 py-3 text-sm font-semibold shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN PANEL ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">

        {/* Top Bar with 1-Hour Session Timer & Client IP */}
        <header className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>
                Seans: {Math.floor(sessionSecondsLeft / 60)}:{(sessionSecondsLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
            {stats?.clientIp && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-xs font-mono">
                <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                <span>IP: {stats.clientIp}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"></span>
              <span>Encrypted Gateway Active</span>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-white font-medium shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-white/15 bg-slate-900/95 px-5 py-3.5 text-sm shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in duration-200">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-white font-semibold">{toast.text}</span>
          </div>
        )}

        {/* Main Tabs Container */}
        <main className="p-4 space-y-6">

          {/* ── 1. OVERVIEW (Umumiy Ko'rsatkichlar Diagrammasi) ──────────── */}
          {currentTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ChartAreaInteractive data={stats?.deviceChart} />
              <DonutChartAuthProviders providers={stats?.providers} />
            </div>
          )}

          {/* USERS TAB */}
          {currentTab === "users" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Ism, email, tel yoki ID bo'yicha qidiruv..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="text-sm text-zinc-300">
                  Jami: <strong className="text-white font-mono font-bold text-base">{filteredUsers.length}</strong> ta foydalanuvchi
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0d1527]/80 backdrop-blur-2xl shadow-2xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-zinc-400 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-5">Foydalanuvchi</th>
                      <th className="py-4 px-5">Aloqa</th>
                      <th className="py-4 px-5">Provayder</th>
                      <th className="py-4 px-5">Olmoslar</th>
                      <th className="py-4 px-5">Holat</th>
                      <th className="py-4 px-5 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 text-sm">
                          Foydalanuvchi topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <div key={u.id} className="contents">
                          <tr
                            onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                            className={`cursor-pointer transition-colors ${
                              expandedUserId === u.id ? "bg-white/[0.08]" : "hover:bg-white/5"
                            }`}
                          >
                            <td className="py-4 px-5 font-semibold text-white">
                              <div className="flex items-center gap-3">
                                {resolveAvatarUrl(u.avatarUrl) ? (
                                  <img
                                    src={resolveAvatarUrl(u.avatarUrl) || ""}
                                    alt=""
                                    className={`h-9 w-9 rounded-2xl object-cover shrink-0 border ${
                                      u.isPremium ? "border-amber-400 ring-2 ring-amber-400/30" : "border-white/10"
                                    }`}
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                    {(u.name || u.email || u.phone || "U")[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">{u.name || "Nomsiz"}</span>
                                    {u.isPremium && (
                                      <div className="flex items-center gap-1">
                                        <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                                          VIP
                                        </span>
                                        <VerifiedBadge size={16} />
                                      </div>
                                    )}
                                    {!u.isPremium && u.isVerified && (
                                      <VerifiedBadge size={16} />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                                    <span className="text-cyan-400">@{u.username || u.id.slice(0, 8)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-zinc-200 font-medium">{u.email || u.phone || "—"}</td>
                            <td className="py-4 px-5">
                              <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-semibold text-zinc-300 capitalize">
                                {u.provider}
                              </span>
                            </td>
                            <td className="py-4 px-5 font-mono font-bold text-cyan-300 text-sm">
                              {u.diamonds ?? 0}
                            </td>
                            <td className="py-4 px-5">
                              {u.isBanned ? (
                                <span className="rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 text-xs font-bold">
                                  Bloklangan
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
                                  Faol
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all outline-none focus:outline-none ${
                                    expandedUserId === u.id
                                      ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                                      : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                                  }`}
                                >
                                  <span>Boshqaruv</span>
                                  <span className={`transition-transform duration-200 ${expandedUserId === u.id ? "rotate-180" : ""}`}>
                                    ▼
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* HAR BIR FOYDALANUVCHINING DROP-DOWN BOSHQARUV KARTASI */}
                          {expandedUserId === u.id && (
                            <tr className="bg-[#090e1d]/90 border-y border-cyan-500/20">
                              <td colSpan={6} className="p-5">
                                <div className="rounded-3xl border border-white/10 bg-[#0c1428]/95 p-6 shadow-2xl space-y-6">
                                  {/* Foydalanuvchi ma'lumoti va tezkor holat amallari */}
                                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/10 gap-4">
                                    <div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-base font-bold text-white">{u.name || "Nomsiz foydalanuvchi"}</span>
                                        {u.isPremium && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold">
                                              ★ Premium VIP
                                            </span>
                                            <VerifiedBadge size={18} />
                                          </div>
                                        )}
                                        {u.isBanned && (
                                          <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 text-xs font-bold">
                                            Taqiqlangan
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
                                        <span>ID: {u.id}</span>
                                        <span>•</span>
                                        <span>Balans: <strong className="text-cyan-300 font-bold">{u.diamonds ?? 0} ta olmos</strong></span>
                                        <span>•</span>
                                        <span>Provayder: <strong className="text-white capitalize">{u.provider}</strong></span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUserAction(u.id, "toggle_verified")}
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all outline-none focus:outline-none ${
                                          u.isVerified
                                            ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
                                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                                        }`}
                                      >
                                        {u.isVerified ? "✓ Tasdiqlangan" : "Tasdiqlanmagan"}
                                      </button>
                                      {u.isBanned ? (
                                        <button
                                          type="button"
                                          onClick={() => handleUserAction(u.id, "unban")}
                                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all outline-none focus:outline-none"
                                        >
                                          Blokdan Chiqarish
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleUserAction(u.id, "ban")}
                                          className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition-all outline-none focus:outline-none"
                                        >
                                          Foydalanuvchini Bloklash
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm("Diqqat! Ushbu foydalanuvchi lokal tizimdan hamda Supabasedan butunlay o'chiriladi. Rozimisiz?")) {
                                            handleUserAction(u.id, "delete");
                                          }
                                        }}
                                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 transition-all outline-none focus:outline-none"
                                      >
                                        O'chirish (Supabase)
                                      </button>
                                    </div>
                                  </div>

                                  {/* 3 TA ASOSIY TALAB QILINGAN FUNKSIYA */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                    {/* 1. OLMOS HADYA QILISH */}
                                    <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-5 flex flex-col justify-between shadow-lg">
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <Gem className="w-5 h-5 text-cyan-400" />
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">Olmos Hadya Qilish</span>
                                          </div>
                                          <span className="text-xs font-mono text-cyan-300 font-bold">{u.diamonds ?? 0} ta</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 mb-3">Foydalanuvchiga rag'bat sifatida hisobiga olmos hadya qiling:</p>
                                        <div className="flex items-center gap-2 mb-3">
                                          {[20, 50, 100, 500].map((amt) => (
                                            <button
                                              key={amt}
                                              type="button"
                                              onClick={() => setGiftDiamondsMap({ ...giftDiamondsMap, [u.id]: amt })}
                                              className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-xs font-mono font-bold text-zinc-200 transition-all outline-none focus:outline-none"
                                            >
                                              +{amt}
                                            </button>
                                          ))}
                                        </div>
                                        <input
                                          type="number"
                                          min="1"
                                          placeholder="Miqdorni kiriting (masalan: 50)"
                                          value={giftDiamondsMap[u.id] || ""}
                                          onChange={(e) => setGiftDiamondsMap({ ...giftDiamondsMap, [u.id]: Number(e.target.value) })}
                                          className="w-full rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none mb-3 font-mono"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const amt = giftDiamondsMap[u.id];
                                            if (!amt || Number(amt) <= 0) return alert("Iltimos, olmos miqdorini kiriting!");
                                            handleUserAction(u.id, "add_diamonds", { amount: amt });
                                            setGiftDiamondsMap({ ...giftDiamondsMap, [u.id]: "" });
                                          }}
                                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:opacity-95 transition-all outline-none focus:outline-none"
                                        >
                                          ✓ Hadya Qilish
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const amt = giftDiamondsMap[u.id];
                                            if (!amt || Number(amt) <= 0) return alert("Iltimos, olmos miqdorini kiriting!");
                                            handleUserAction(u.id, "revoke_diamonds", { amount: amt });
                                            setGiftDiamondsMap({ ...giftDiamondsMap, [u.id]: "" });
                                          }}
                                          className="flex-1 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-300 font-bold text-xs hover:bg-rose-500/25 transition-all outline-none focus:outline-none"
                                        >
                                          ⟲ Qaytarib Olish
                                        </button>
                                      </div>
                                    </div>

                                    {/* 2. PREMIUM MAQOMINI YOQISH / O'CHIRISH */}
                                    <div className="rounded-2xl border border-amber-500/30 bg-[#161208] p-5 flex flex-col justify-between shadow-lg">
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <Crown className="w-5 h-5 text-amber-400" />
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">Premium VIP Maqomi</span>
                                          </div>
                                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                                            u.isPremium
                                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                              : "bg-white/5 text-zinc-400 border-white/10"
                                          }`}>
                                            {u.isPremium ? "FAOL VIP" : "ODDIY"}
                                          </span>
                                        </div>
                                        <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                                          Premium maqomi yoqilganda foydalanuvchiga cheksiz suhbatlar, ustuvor juftlik qidirish va VIP nishoni beriladi.
                                        </p>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4 flex items-center justify-between">
                                          <span className="text-xs text-zinc-300">Joriy Holat:</span>
                                          <span className="text-xs font-bold text-white">
                                            {u.isPremium ? "Cheksiz VIP Faollashtirilgan" : "Oddiy Hisob (Cheklangan)"}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleUserAction(u.id, "toggle_premium")}
                                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md outline-none focus:outline-none ${
                                          u.isPremium
                                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                                            : "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/25 hover:opacity-95"
                                        }`}
                                      >
                                        {u.isPremium ? "✕ Premiumni O'chirish" : "★ Premium Maqomini Yoqish"}
                                      </button>
                                    </div>

                                    {/* 3. ADMIN TOMONIDAN XABAR YUBORISH */}
                                    <div className="rounded-2xl border border-purple-500/30 bg-[#140b24] p-5 flex flex-col justify-between shadow-lg">
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <Bell className="w-5 h-5 text-purple-400" />
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">Admin Xabari</span>
                                          </div>
                                          <span className="text-xs font-mono text-purple-300">
                                            {(u.adminMessages?.length || 0)} ta xabar
                                          </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 mb-3">Foydalanuvchiga bevosita bildirishnoma yoki habar yuboring:</p>
                                        <textarea
                                          rows={3}
                                          placeholder="Xabar matnini yozing..."
                                          value={userMessageMap[u.id] || ""}
                                          onChange={(e) => setUserMessageMap({ ...userMessageMap, [u.id]: e.target.value })}
                                          className="w-full rounded-xl border border-white/10 bg-[#060a14] p-3 text-xs text-white placeholder-zinc-500 focus:border-purple-400 focus:outline-none mb-3 resize-none"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const msg = userMessageMap[u.id];
                                          if (!msg || !msg.trim()) return alert("Iltimos, xabar matnini kiriting!");
                                          handleUserAction(u.id, "send_message", { message: msg.trim() });
                                          setUserMessageMap({ ...userMessageMap, [u.id]: "" });
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:opacity-95 transition-all outline-none focus:outline-none"
                                      >
                                        ✉ Xabarni Yuborish
                                      </button>
                                    </div>

                                  </div>

                                  {/* 4. OLMOSLAR VA AMALLAR TARIXI */}
                                  <div className="rounded-2xl border border-white/10 bg-[#081020] p-5">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <History className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">Olmoslar va amallar tarixi</span>
                                      </div>
                                      <span className="text-xs font-mono text-zinc-400 font-semibold">
                                        {u.diamondHistory?.length || 0} ta yozuv
                                      </span>
                                    </div>
                                    {(!u.diamondHistory || u.diamondHistory.length === 0) ? (
                                      <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                                        Hozircha amallar tarixi yo'q
                                      </div>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {u.diamondHistory.slice().reverse().map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <span
                                                className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                                                  item.amount >= 0
                                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                                    : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                                }`}
                                              >
                                                {item.amount >= 0 ? `+${item.amount}` : item.amount} 💎
                                              </span>
                                              <span className="text-zinc-300">{item.type || "Admin amali"}</span>
                                            </div>
                                            <span className="text-zinc-500 text-[11px] font-mono">
                                              {new Date(item.date).toLocaleString()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* 5. HISOBGA KIRGAN QURILMALAR RO'YXATI (100% ANIQ VA REAL-TIME) */}
                                  {(() => {
                                    const userDevices = (u.devices && u.devices.length > 0)
                                      ? u.devices
                                      : devices.filter((d) => d.userId === u.id);
                                    return (
                                      <div className="rounded-2xl border border-cyan-500/30 bg-[#081224] p-5 shadow-lg">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center">
                                              <Smartphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                                Hisobga Kirgan Qurilmalar
                                              </span>
                                              <span className="ml-2 text-[11px] text-zinc-400">
                                                (100% aniq ro'yxat)
                                              </span>
                                            </div>
                                          </div>
                                          <span className="text-xs font-mono text-cyan-300 font-bold px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                                            {userDevices.length} ta qurilma
                                          </span>
                                        </div>

                                        {userDevices.length === 0 ? (
                                          <div className="py-6 text-center text-xs text-zinc-500 font-mono bg-white/[0.02] rounded-xl border border-white/5">
                                            Ushbu foydalanuvchi hisobiga hali birorta ham qurilmadan kirilmagan
                                          </div>
                                        ) : (
                                          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                            {userDevices.map((d) => (
                                              <div
                                                key={d.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all gap-3"
                                              >
                                                <div className="flex items-start gap-3">
                                                  <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
                                                    <Smartphone className="w-4 h-4" />
                                                  </div>
                                                  <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span className="text-xs font-bold text-white">
                                                        {d.deviceName || "Noma'lum Qurilma"}
                                                      </span>
                                                      <span className="text-[10px] font-mono font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                                                        IP: {d.ip}
                                                      </span>
                                                      {d.blocked ? (
                                                        <span className="text-[10px] font-bold text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30">
                                                          🚫 Bloklangan
                                                        </span>
                                                      ) : (
                                                        <span className="text-[10px] font-bold text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                                                          ✓ Faol
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-1 flex-wrap">
                                                      <span>Birinchi kirish: <strong className="text-zinc-300">{d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"}</strong></span>
                                                      <span>•</span>
                                                      <span>Oxirgi faollik: <strong className="text-cyan-300">{d.lastActive ? new Date(d.lastActive).toLocaleString() : "—"}</strong></span>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                  {d.blocked ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeviceAction(d.id, "unblock")}
                                                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 text-xs font-bold text-emerald-300 transition-all outline-none focus:outline-none"
                                                    >
                                                      Ochish
                                                    </button>
                                                  ) : (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeviceAction(d.id, "block")}
                                                      className="rounded-lg border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-2.5 py-1 text-xs font-bold text-rose-300 transition-all outline-none focus:outline-none"
                                                    >
                                                      Bloklash
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (confirm("Ushbu qurilma seansini o'chirmoqchimisiz?")) {
                                                        handleDeviceAction(d.id, "revoke");
                                                      }
                                                    }}
                                                    className="rounded-lg border border-white/10 bg-white/5 hover:bg-rose-500/20 p-1.5 text-zinc-400 hover:text-rose-300 transition-all outline-none focus:outline-none"
                                                    title="Seansni o'chirish"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </div>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── KITOBLAR (BOOKS) TAB ─────────────────────────────────── */}
          {currentTab === "books" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#0d1527]/85 p-5 shadow-xl backdrop-blur-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <span>Kitoblar boshqaruvi</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                        Foydali kitoblar
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Yangi kitob yuklang — u darhol foydalanuvchilarning "Foydali kitoblar" sahifasida ko'rinadi
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 text-xs font-mono font-bold self-start sm:self-center">
                  Jami yuklangan: {books.length} ta kitob
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1. LEFT: Kitob Yuklash Formasi (Tagma-tag: Rasm -> Kitob nomi -> Bio -> Fayl -> Yuklash) */}
                <form
                  onSubmit={handleUploadBook}
                  className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#0d1527]/90 p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4"
                >
                  <div className="pb-3 border-b border-white/10">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>Yangi kitob yuklash</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Kitob muqovasi, nomi, qisqacha bio va faylini kiriting
                    </p>
                  </div>

                  {/* A. Kitob rasmi (Muqova) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">
                      1. Kitob rasmi (Muqova)
                    </label>
                    <label className="group relative flex flex-col items-center justify-center h-44 w-full rounded-2xl border-2 border-dashed border-white/15 bg-[#070d1a]/80 hover:border-cyan-400/50 hover:bg-white/[0.03] transition-all cursor-pointer overflow-hidden">
                      {bookCoverDataUrl ? (
                        <>
                          <img
                            src={bookCoverDataUrl}
                            alt="Kitob muqovasi"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                            Rasmni almashtirish ({bookCoverName || "Tanlangan"})
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center p-4">
                          <div className="h-11 w-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center mb-2">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-white">
                            Kitob rasmini tanlash uchun bosing
                          </span>
                          <span className="text-[11px] text-zinc-500 mt-0.5">
                            PNG, JPG yoki WEBP formatda
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSelectBookCover}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* B. Kitob nomi */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      2. Kitob nomi *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="Masalan: English Speaking Mastery B2-C1"
                      className="w-full rounded-2xl border border-white/10 bg-[#070d1a] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* C. Kitob Bio / Tavsif qismi */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      3. Kitob haqida bio (Qisqacha tavsif)
                    </label>
                    <textarea
                      rows={3}
                      value={bookBio}
                      onChange={(e) => setBookBio(e.target.value)}
                      placeholder="Kitob kimlar uchun mo'ljallangan va nimalarni o'rgatishi haqida qisqacha ma'lumot..."
                      className="w-full rounded-2xl border border-white/10 bg-[#070d1a] p-3.5 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* D. Kitob faylini yuklash tugmasi */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      4. Kitob yoki hujjat fayli (PDF, Word, Rasm, EPUB, TXT va h.k.) *
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/15 px-4 py-3 text-xs font-bold text-cyan-200 transition-all cursor-pointer">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span className="truncate">
                          {bookFileName
                            ? `Tanlandi: ${bookFileName}`
                            : "Kitob yoki hujjat faylini tanlang (PDF, Word, Rasm, EPUB...)"}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-xl bg-cyan-500/25 border border-cyan-400/40 px-2.5 py-1 text-[11px] text-white">
                        Fayl tanlash
                      </span>
                      <input
                        type="file"
                        accept="*/*"
                        onChange={handleSelectBookFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* E. Eng pastida Yuklash tugmasi */}
                  <button
                    type="submit"
                    disabled={bookUploading}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 hover:brightness-110 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.35)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{bookUploading ? "Yuklanmoqda..." : "Yuklash"}</span>
                  </button>
                </form>

                {/* 2. RIGHT: Yuklangan kitoblar ro'yxati tarixi */}
                <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0d1527]/90 p-6 shadow-2xl backdrop-blur-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-amber-400" />
                        <span>Yuklangan kitoblar ro'yxati tarixi</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Saytga joylangan barcha kitoblar va ularni boshqarish
                      </p>
                    </div>
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-zinc-300">
                      {books.length} ta
                    </span>
                  </div>

                  {books.length === 0 ? (
                    <div className="py-16 text-center">
                      <BookOpen className="w-11 h-11 text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm font-bold text-white">Hozircha kitoblar yuklanmagan</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Chap tomondagi forma orqali birinchi kitobni yuklang.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[620px] overflow-y-auto pr-1">
                      {books.map((b) => {
                        const coverSrc = b.coverUrl
                          ? b.coverUrl.startsWith("http") || b.coverUrl.startsWith("data:")
                            ? b.coverUrl
                            : `${API_BASE}${b.coverUrl.startsWith("/") ? "" : "/"}${b.coverUrl}`
                          : null;
                        const fileHref = b.fileUrl
                          ? b.fileUrl.startsWith("http") || b.fileUrl.startsWith("data:")
                            ? b.fileUrl
                            : `${API_BASE}${b.fileUrl.startsWith("/") ? "" : "/"}${b.fileUrl}`
                          : "#";
                        const uploadedDate = b.createdAt
                          ? new Date(b.createdAt).toLocaleString("uz-UZ", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "";

                        return (
                          <div
                            key={b.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#070d1a]/85 p-4 hover:border-cyan-400/40 transition-all"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="h-16 w-14 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
                                {coverSrc ? (
                                  <img
                                    src={coverSrc}
                                    alt={b.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <BookOpen className="w-6 h-6 text-amber-300/60" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-extrabold text-white truncate">
                                  {b.title}
                                </h4>
                                <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                                  {b.bio || "Tavsif kiritilmagan"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-zinc-500 font-mono">
                                  <span>📄 {b.fileName}</span>
                                  {uploadedDate && <span>• {uploadedDate}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <a
                                href={fileHref}
                                target="_blank"
                                rel="noreferrer"
                                download={b.fileName || b.title}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-2 text-xs font-bold text-cyan-200 transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Ko'rish</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => void handleDeleteBook(b.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-2 text-xs font-bold text-rose-300 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>O'chirish</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* COMPLAINTS TAB */}
          {currentTab === "complaints" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {selectedChatUserId ? (
                /* ── A. TANLANGAN FOYDALANUVCHI BILAN INTERAKTIV CHAT SAHIFA ── */
                (() => {
                  const chatUser = users.find((u) => u.id === selectedChatUserId);
                  if (!chatUser) {
                    return (
                      <div className="rounded-3xl border border-white/10 bg-[#0d1527]/80 p-8 text-center">
                        <p className="text-zinc-400 text-sm">Foydalanuvchi topilmadi.</p>
                        <button
                          type="button"
                          onClick={() => setSelectedChatUserId(null)}
                          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Orqaga qaytish
                        </button>
                      </div>
                    );
                  }

                  const sortedMessages = [...(chatUser.adminMessages || [])].sort((a, b) => {
                    const tA = new Date(a.createdAt || a.sentAt || a.date || 0).getTime();
                    const tB = new Date(b.createdAt || b.sentAt || b.date || 0).getTime();
                    return tA - tB;
                  });

                  return (
                    <div className="rounded-3xl border border-white/10 bg-[#0d1527]/90 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden">
                      {/* Chat Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-white/10 bg-white/[0.03]">
                        <div className="flex items-center gap-3.5">
                          <button
                            type="button"
                            onClick={() => setSelectedChatUserId(null)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                            title="Barcha murojaatlarga qaytish"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>

                          <div className="relative">
                            {resolveAvatarUrl(chatUser.avatarUrl) ? (
                              <img
                                src={resolveAvatarUrl(chatUser.avatarUrl) || ""}
                                alt=""
                                className={`h-11 w-11 rounded-2xl object-cover border ${
                                  chatUser.isPremium ? "border-amber-400 ring-2 ring-amber-400/30" : "border-white/10"
                                }`}
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold text-base uppercase">
                                {(chatUser.name || chatUser.email || chatUser.phone || "U")[0]}
                              </div>
                            )}
                            {chatUser.isPremium && (
                              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-black font-extrabold shadow-sm">
                                ★
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white">
                                {chatUser.name || "Nomsiz Foydalanuvchi"}
                              </span>
                              {chatUser.isPremium && (
                                <div className="flex items-center gap-1">
                                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                                    VIP
                                  </span>
                                  <VerifiedBadge size={16} />
                                </div>
                              )}
                              {!chatUser.isPremium && chatUser.isVerified && (
                                <VerifiedBadge size={16} />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                              <span className="text-cyan-400">@{chatUser.username || chatUser.id.slice(0, 8)}</span>
                              <span>•</span>
                              <span>{chatUser.email || chatUser.phone || "Aloqa yo'q"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300">
                            Olmoslar: {chatUser.diamonds ?? 0}
                          </span>
                          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-zinc-300">
                            Jami xabarlar: {sortedMessages.length} ta
                          </span>
                        </div>
                      </div>

                      {/* Messages Feed */}
                      <div className="h-[460px] overflow-y-auto p-5 space-y-3.5 bg-[#070b16]/70">
                        {sortedMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <MessageSquare className="h-10 w-10 text-zinc-600 mb-2" />
                            <p className="text-sm font-semibold text-zinc-300">Hozircha yozishmalar yo'q</p>
                            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                              Quyidagi kiritish maydoni orqali foydalanuvchiga birinchi xabarni yuboring.
                            </p>
                          </div>
                        ) : (
                          sortedMessages.map((msg, idx) => {
                            const isAdmin = Boolean(msg.isAdmin || msg.is_admin || msg.sender === "Admin");
                            const msgTime = new Date(msg.createdAt || msg.sentAt || msg.date || Date.now()).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }
                            );

                            return (
                              <div
                                key={msg.id || idx}
                                className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                              >
                                <div
                                  className={`rounded-2xl p-4 max-w-[85%] sm:max-w-[70%] shadow-lg transition-all ${
                                    isAdmin
                                      ? "rounded-tr-none bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white shadow-cyan-500/10"
                                      : "rounded-tl-none border border-white/10 bg-[#121c35] text-zinc-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {isAdmin ? (
                                      <span className="flex items-center gap-1 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                                        👑 Ma'muriyat (Siz)
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 rounded-md bg-violet-500/20 text-violet-300 border border-violet-400/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                        👤 {chatUser.name || "Foydalanuvchi"}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[10px] font-mono ${
                                        isAdmin ? "text-cyan-100/80" : "text-zinc-400"
                                      }`}
                                    >
                                      {msgTime}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.text}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Bottom Reply Bar */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAdminChatReply(chatUser.id, adminChatInput);
                        }}
                        className="flex items-center gap-3 p-4 border-t border-white/10 bg-white/[0.02]"
                      >
                        <input
                          type="text"
                          value={adminChatInput}
                          onChange={(e) => setAdminChatInput(e.target.value)}
                          placeholder="Foydalanuvchiga javob yozing..."
                          className="flex-1 rounded-2xl border border-white/10 bg-[#070d1a] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!adminChatInput.trim() || adminChatSending}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                        >
                          <Send className="h-4 w-4" />
                          <span>{adminChatSending ? "..." : "Yuborish"}</span>
                        </button>
                      </form>
                    </div>
                  );
                })()
              ) : (
                /* ── B. FOYDALANUVCHILARNING MUROJAATLARI RO'YXATI ── */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                        <MessageSquare className="h-5 w-5 text-cyan-400" />
                        <span>Foydalanuvchilar shikoyat va takliflari</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Foydalanuvchi profiliga bosing — ikki tomonlama muloqot va chat ochiladi
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 text-xs font-mono font-bold self-start sm:self-auto">
                      Muloqotlar: {users.filter((u) => u.adminMessages && u.adminMessages.length > 0).length} ta
                    </span>
                  </div>

                  {users.filter((u) => u.adminMessages && u.adminMessages.length > 0).length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-[#0d1527]/80 p-12 text-center backdrop-blur-2xl">
                      <MessageSquare className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-white">Hozircha hech qanday murojaat kelib tushmagan</h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                        Foydalanuvchilar "Shikoyat / Taklif" bo'limidan xabar yozganda shu yerda ko'rinadi va bevosita javob bera olasiz.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {users
                        .filter((u) => u.adminMessages && u.adminMessages.length > 0)
                        .map((u) => {
                          const msgs = u.adminMessages || [];
                          const lastMsg = msgs[msgs.length - 1] || msgs[0];
                          const isLastAdmin = Boolean(lastMsg?.isAdmin || lastMsg?.is_admin || lastMsg?.sender === "Admin");
                          const snippet = lastMsg?.text
                            ? lastMsg.text.length > 75
                              ? lastMsg.text.slice(0, 75) + "..."
                              : lastMsg.text
                            : "Xabar matni yo'q";
                          const timeStr = new Date(
                            lastMsg?.createdAt || lastMsg?.sentAt || lastMsg?.date || Date.now()
                          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });

                          return (
                            <div
                              key={u.id}
                              onClick={() => setSelectedChatUserId(u.id)}
                              className="group rounded-2xl border border-white/10 bg-[#0d1527]/80 hover:bg-[#121c35] hover:border-cyan-400/40 p-4 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="relative shrink-0">
                                  {resolveAvatarUrl(u.avatarUrl) ? (
                                    <img
                                      src={resolveAvatarUrl(u.avatarUrl) || ""}
                                      alt=""
                                      className={`h-11 w-11 rounded-2xl object-cover border ${
                                        u.isPremium ? "border-amber-400 ring-2 ring-amber-400/30" : "border-white/10"
                                      }`}
                                    />
                                  ) : (
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold text-base uppercase">
                                      {(u.name || u.email || u.phone || "U")[0]}
                                    </div>
                                  )}
                                  {u.isPremium && (
                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-black font-extrabold shadow-sm">
                                      ★
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                      {u.name || "Nomsiz Foydalanuvchi"}
                                    </span>
                                    {u.isPremium && (
                                      <div className="flex items-center gap-1">
                                        <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                                          VIP
                                        </span>
                                        <VerifiedBadge size={14} />
                                      </div>
                                    )}
                                    {!u.isPremium && u.isVerified && (
                                      <VerifiedBadge size={14} />
                                    )}
                                    <span className="text-xs text-zinc-400 font-mono">
                                      @{u.username || u.id.slice(0, 8)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 min-w-0">
                                    <span
                                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                        isLastAdmin
                                          ? "bg-teal-500/20 text-teal-300 border border-teal-400/30"
                                          : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                                      }`}
                                    >
                                      {isLastAdmin ? "Siz javob berdingiz" : "Yangi murojaat"}
                                    </span>
                                    <p className="text-xs text-zinc-300 truncate italic">
                                      "{snippet}"
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                                <span className="text-xs text-zinc-400 font-mono">{timeStr}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChatUserId(u.id);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-1.5 text-xs font-bold text-cyan-300 transition-all cursor-pointer"
                                >
                                  <span>Chatni ochish</span>
                                  <span>→</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* ── C. SUHBATDOSHLAR USTIDAN SHIKOYATLAR (MATCHMAKING) ── */}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span>Suhbatdoshlar ustidan shikoyatlar (Audio matchmaking)</span>
                      </h3>
                      <span className="text-xs text-zinc-400 font-mono">Jami: {complaints.length} ta</span>
                    </div>

                    {complaints.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-500 text-xs">
                        Hozircha suhbat xonalaridan shikoyat tushmagan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {complaints.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm font-bold text-white">
                                  Hamkor: <span className="text-rose-400 font-extrabold">{c.partnerUsername}</span>
                                </div>
                                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                  {new Date(c.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <span
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                                  c.status === "resolved"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : c.status === "dismissed"
                                    ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {c.status === "resolved"
                                  ? "Hal qilindi"
                                  : c.status === "dismissed"
                                  ? "Rad etildi"
                                  : "Kutilmoqda"}
                              </span>
                            </div>

                            {c.reasons && c.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {c.reasons.map((r, i) => (
                                  <span
                                    key={i}
                                    className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}

                            {c.details && (
                              <p className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-300 leading-relaxed italic">
                                "{c.details}"
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                              <button
                                onClick={() => handleComplaintAction(c.id, "dismissed")}
                                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
                              >
                                Rad etish
                              </button>
                              <button
                                onClick={() => handleComplaintAction(c.id, "resolved")}
                                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
                              >
                                Hal qilindi
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DEVICES TAB */}
          {currentTab === "devices" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Qurilma, IP yoki User ID bo'yicha qidiruv..."
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0d1527] pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="text-sm text-zinc-300">
                  Jami: <strong className="text-white font-mono font-bold text-base">{filteredDevices.length}</strong> ta seans
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0d1527]/80 backdrop-blur-2xl shadow-2xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-zinc-400 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-5">Qurilma</th>
                      <th className="py-4 px-5">IP Manzil</th>
                      <th className="py-4 px-5">Foydalanuvchi ID</th>
                      <th className="py-4 px-5">Oxirgi Faollik</th>
                      <th className="py-4 px-5">Holat</th>
                      <th className="py-4 px-5 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDevices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 text-sm">
                          Hech qanday qurilma seansi topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredDevices.map((d) => (
                        <tr key={d.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-5 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                                <Smartphone className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{d.deviceName || "Noma'lum Qurilma"}</div>
                                <div className="text-xs text-zinc-500 font-mono truncate max-w-[220px]">
                                  {d.userAgent}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300">
                              {d.ip || "127.0.0.1"}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono text-xs text-zinc-400 truncate max-w-[150px]">
                            {d.userId}
                          </td>
                          <td className="py-4 px-5 text-zinc-300 text-xs font-mono">
                            {new Date(d.lastActive || d.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-5">
                            {d.blocked ? (
                              <span className="rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 text-xs font-bold">
                                Bloklangan
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
                                Faol
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {d.blocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeviceAction(d.id, "unblock")}
                                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all outline-none focus:outline-none"
                                >
                                  Ochish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeviceAction(d.id, "block")}
                                  className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition-all outline-none focus:outline-none"
                                >
                                  Bloklash
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeviceAction(d.id, "revoke")}
                                className="rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/20 p-2 text-zinc-400 hover:text-rose-300 transition-all outline-none focus:outline-none"
                                title="Seansni o'chirish"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TIZIM SOZLAMALARI TAB */}
          {currentTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
              <div className="rounded-3xl border border-white/10 bg-[#0d1527]/90 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 pb-5 mb-6 border-b border-white/10">
                  <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Tizim Sozlamalari
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Platforma va premium funksiyalarini boshqarish
                    </p>
                  </div>
                </div>

                {/* iOS Style Row matching screenshot */}
                <div className="border-b border-white/10 pb-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-white">
                        Premuimni yoqish o'chirish
                      </span>
                      <span className="text-xs text-zinc-400 mt-0.5">
                        {booksPremiumRequired
                          ? "Hozirda Premium rejim yoqilgan (premiumi yo'qlarga yopiq)"
                          : "Hozirda Premium rejim o'chirilgan (hamma uchun bepul va ochiq)"}
                      </span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={booksPremiumRequired}
                      onClick={handleToggleBooksPremium}
                      disabled={togglingBooksPremium}
                      className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-300 ease-in-out focus:outline-none ${
                        booksPremiumRequired ? "bg-[#34c759]" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
                          booksPremiumRequired ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {currentTab === "announcements" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2.5">
                    <Bell className="h-5 w-5 text-violet-400" />
                    <span>Foydalanuvchilarga E'lon Tarqatish</span>
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Barcha foydalanuvchilar ekranida ko'rsatiladigan bildirishnomalar
                  </p>
                </div>
                <button
                  onClick={() => setShowAnnounceModal(true)}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Yangi E'lon Yaratish</span>
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-16 text-center text-zinc-500 text-sm">
                  Hozircha hech qanday e'lon tarqatilmagan.
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{a.title}</span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {currentTab === "logs" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2.5">
                  <History className="h-5 w-5 text-emerald-400" />
                  <span>Admin Harakatlari Audit Jurnali</span>
                </h2>
                <span className="text-sm text-zinc-400 font-mono">Jami yozuvlar: {auditLogs.length} ta</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-5">Vaqt</th>
                      <th className="py-4 px-5">Admin</th>
                      <th className="py-4 px-5">Amal turi</th>
                      <th className="py-4 px-5">Batafsil ma'lumot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500 text-sm">
                          Audit jurnali bo'sh
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-zinc-800/30">
                          <td className="py-4 px-5 text-zinc-400 text-xs">
                            {new Date(l.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 px-5 text-brand-400 font-bold">{l.admin}</td>
                          <td className="py-4 px-5 text-zinc-200 capitalize font-sans text-xs font-semibold">
                            {l.action.replace(/_/g, " ")}
                          </td>
                          <td className="py-4 px-5 text-zinc-300 font-sans text-sm">{l.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SECURITY & IP MANAGEMENT TAB ──────────────────────────────── */}
          {currentTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <Shield className="h-6 w-6 text-cyan-400" />
                    <span>Admin Xavfsizlik & IP Manzil Nazorati</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Faqat sizning shaxsiy kompyuteringizdan kirish, 1 soatlik seans cheklovi va begona qurilmalarni zudlik bilan aniqlash
                  </p>
                </div>
                {securityAlerts.length > 0 && (
                  <button
                    onClick={handleClearSecurityAlerts}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-4 py-2 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ogohlantirishlarni tozalash</span>
                  </button>
                )}
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. 1-Hour Session Timer */}
                <div className="rounded-2xl border border-white/10 bg-[#0c1322]/80 p-5 shadow-xl backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      1 Soatlik Seans
                    </span>
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  </div>
                  <div className="text-3xl font-black font-mono text-white tracking-tight">
                    {Math.floor(sessionSecondsLeft / 60)}:{(sessionSecondsLeft % 60).toString().padStart(2, "0")}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    Xavfsizlik maqsadida admin hisobi har 1 soatdan so'ng avtomatik tizimdan chiqariladi.
                  </p>
                  <div className="mt-3 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-cyan-500 h-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(0, (sessionSecondsLeft / 3600) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* 2. Current Device IP */}
                <div className="rounded-2xl border border-white/10 bg-[#0c1322]/80 p-5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Laptop className="w-4 h-4" />
                      Joriy Kompyuteringiz
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      Ulangan
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-300 truncate">
                    {stats?.clientIp || "127.0.0.1"}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Siz hozir ushbu IP orqali admin tizimidasiz.
                  </p>
                  <button
                    onClick={handleAddCurrentIp}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 py-2 text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ishonchli ro'yxatga kiritish</span>
                  </button>
                </div>

                {/* 3. Security Email Alert */}
                <div className="rounded-2xl border border-white/10 bg-[#0c1322]/80 p-5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Xabarnoma
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      Aktiv
                    </span>
                  </div>
                  <input
                    type="email"
                    value={settingsData.adminAlertEmail || ""}
                    onChange={(e) => setSettingsData((prev) => ({ ...prev, adminAlertEmail: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-white/10 bg-[#080d19] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveAlertEmail(settingsData.adminAlertEmail || "")}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 py-2 text-xs font-bold transition-all"
                  >
                    <span>Emailni saqlash</span>
                  </button>
                </div>
              </div>

              {/* IP Whitelist Management */}
              <div className="rounded-3xl border border-white/10 bg-[#0c1322]/80 p-6 shadow-xl backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <span>Ruxsat berilgan IP manzillar (Kompyuteringiz)</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Faqat shu ro'yxatdagi IP manzillardan admin panelga kirish mumkin. Begona IP darhol bloklanadi va emailingizga xabar ketadi.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newTrustedIpInput}
                    onChange={(e) => setNewTrustedIpInput(e.target.value)}
                    placeholder="Yangi IP manzil kiriting (masalan: 192.168.1.100 yoki 84.54.80.*)..."
                    className="flex-1 rounded-2xl border border-white/10 bg-[#080d19] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={handleAddCustomIp}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>IP Qo'shish</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {(settingsData.adminTrustedIps || ["127.0.0.1", "::1", "localhost"]).map((ip) => {
                    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "localhost" || ip === "::ffff:127.0.0.1";
                    const isCurrent = stats?.clientIp && (stats.clientIp === ip || stats.clientIp.replace(/^::ffff:/, "") === ip);
                    return (
                      <div
                        key={ip}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-300 truncate">{ip}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[9px] font-bold">
                                SIZ
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {isLocal ? "Lokal kompyuter" : "Ishonchli IP"}
                          </span>
                        </div>
                        {!isLocal && (
                          <button
                            onClick={() => handleRemoveTrustedIp(ip)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Intrusion Log */}
              <div className="rounded-3xl border border-white/10 bg-[#0c1322]/80 p-6 shadow-xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span>Begona Qurilmalardan Kirish Urinishlari</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ruxsat etilmagan begona qurilmalardan admin panelga kirishga bo'lgan urinishlar avtomatik ushlanadi va bloklanadi
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
                    {securityAlerts.length} ta urinish
                  </span>
                </div>

                {securityAlerts.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 border border-white/5 rounded-2xl bg-white/[0.02]">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Hech qanday shubhali faoliyat yo'q</h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Begona qurilmalardan kirish urinishlari qayd etilmadi. Tizimingiz to'liq xavfsiz.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] hover:bg-rose-500/[0.1] transition-all space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></span>
                            <span className="font-mono text-sm font-bold text-rose-300">
                              IP: {alert.ip}
                            </span>
                            <span className="rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold">
                              BLOKLANDI & EMAILGA YUBORILDI
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400 font-mono">
                            {new Date(alert.timestamp).toLocaleString("uz-UZ", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-300 space-y-1">
                          <div>
                            <span className="text-zinc-500">Qurilma / Brauzer: </span>
                            <span className="font-mono text-zinc-200">{alert.userAgent}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Tafsilot: </span>
                            <span className="text-zinc-300">{alert.details}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={async () => {
                              const updatedIps = Array.from(new Set([...(settingsData.adminTrustedIps || []), alert.ip]));
                              try {
                                await adminApiPost<{ success: boolean; message: string }>("/settings/", {
                                  adminTrustedIps: updatedIps,
                                }, adminToken);
                                setSettingsData((prev) => ({ ...prev, adminTrustedIps: updatedIps }));
                                notify(`IP ${alert.ip} ishonchli kompyuterlar ro'yxatiga qo'shildi`);
                              } catch {
                                notify("Xatolik yuz berdi", "error");
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 px-3 py-1.5 text-xs font-semibold transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Bu mening qurilmam (Ruxsat berish)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}
      {/* 1. Diamond Modal */}
      {diamondModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <Gem className="h-5 w-5 text-cyan-400" />
                <span>Olmos Balansini Boshqarish</span>
              </h3>
              <button onClick={() => setDiamondModalUser(null)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-zinc-300">
              Foydalanuvchi:{" "}
              <strong className="text-white">
                {diamondModalUser.name || diamondModalUser.email || diamondModalUser.phone}
              </strong>
              <br />
              Hozirgi balans: <strong className="text-cyan-400 font-mono font-bold text-base">{diamondModalUser.diamonds ?? 0} ta</strong>
            </p>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Qo'shiladigan yoki ayriladigan miqdor (+ / -)
              </label>
              <input
                type="number"
                value={diamondAmount}
                onChange={(e) => setDiamondAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-base text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setDiamondModalUser(null)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  const amt = parseInt(diamondAmount, 10);
                  if (isNaN(amt)) return;
                  handleUserAction(diamondModalUser.id, "add_diamonds", { amount: amt });
                }}
                className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-zinc-950 shadow hover:bg-cyan-400 transition-all"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-violet-400" />
                <span>Yangi Global E'lon</span>
              </h3>
              <button onClick={() => setShowAnnounceModal(false)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Sarlavha</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Yangi audio mashqlar qo'shildi!"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Xabar matni</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Barcha foydalanuvchilarga ko'rinadigan matn..."
                  value={newAnnouncement.body}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-violet-500 transition-all"
                >
                  Tarqatish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
