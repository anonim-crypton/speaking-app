import { useEffect, useState, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { adminApiGet, adminApiPost } from "@/lib/api";

interface AdminStats {
  totalUsers: number;
  bannedUsers: number;
  totalDiamonds: number;
  totalSessions: number;
  blockedDevices: number;
  totalComplaints: number;
  pendingComplaints: number;
  providers: Record<string, number>;
  maintenanceMode?: boolean;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  provider: string;
  diamonds?: number;
  isBanned?: boolean;
  bannedAt?: string;
  isVerified?: boolean;
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
    "overview" | "users" | "complaints" | "devices" | "settings" | "announcements" | "logs"
  >("overview");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
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
  });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Modals
  const [diamondModalUser, setDiamondModalUser] = useState<UserItem | null>(null);
  const [diamondAmount, setDiamondAmount] = useState<string>("50");
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", body: "", priority: "info" });

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

  const loadData = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [statsRes, usersRes, complaintsRes, devicesRes, settingsRes, annRes, logsRes] =
        await Promise.allSettled([
          adminApiGet<{ success: boolean; stats: AdminStats }>("/stats/", adminToken),
          adminApiGet<{ success: boolean; users: UserItem[] }>("/users/", adminToken),
          adminApiGet<{ success: boolean; complaints: ComplaintItem[] }>("/complaints/", adminToken),
          adminApiGet<{ success: boolean; devices: DeviceItem[] }>("/devices/", adminToken),
          adminApiGet<{ success: boolean; settings: PlatformSettings }>("/settings/", adminToken),
          adminApiGet<{ success: boolean; announcements: AnnouncementItem[] }>("/announcements/", adminToken),
          adminApiGet<{ success: boolean; logs: AuditLogItem[] }>("/logs/", adminToken),
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
    } catch {
      notify("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      loadData();
    }
  }, [adminToken, loadData]);

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
        setAdminToken(res.token);
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
      const msg = err instanceof Error ? err.message : "Serverga ulanishda xatolik";
      setLoginError(msg);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lingo_admin_token");
    setAdminToken(null);
    updateEncryptedUrl("auth-gate", csrfData.token, csrfData.sig);
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

  // ── 1. LOGIN SCREEN ───────────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white font-sans">
        <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900/90 p-10 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/10 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Lingo Speek Admin</h1>
            <p className="text-sm text-zinc-400 mt-1.5">Boshqaruv Tizimi va Xavfsizlik Portali</p>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3.5 py-1 text-xs font-mono text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>CSRF: {csrfData.token ? `${csrfData.token.slice(0, 16)}...` : "Active"}</span>
            </div>
          </div>

          {loginError && (
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-2">
                Admin Foydalanuvchi
              </label>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder-zinc-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-2">Parol</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder-zinc-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full mt-3 rounded-xl bg-zinc-100 py-3.5 text-base font-bold text-zinc-950 shadow transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              <KeyRound className="h-5 w-5" />
              <span>{loggingIn ? "Tekshirilmoqda..." : "Tizimga Kirish"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 2. MAIN DASHBOARD WITH ROOMY LEFT SIDEBAR ────────────────────────────
  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans antialiased text-[15px]">
      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <aside className="w-72 border-r border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0 select-none z-30">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-zinc-800/60 flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Lingo Speek</span>
                <span className="rounded bg-brand-500/15 text-brand-400 border border-brand-500/30 px-2 py-0.5 text-[10px] font-bold">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate max-w-[150px]">
                CSRF: {csrfData.token.slice(0, 10)}...
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3.5 space-y-1.5">
            <div className="px-3.5 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Asosiy Bo'limlar
            </div>

            <button
              onClick={() => setCurrentTab("overview")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === "overview"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <LayoutDashboard className={`h-5 w-5 ${currentTab === "overview" ? "text-brand-400" : ""}`} />
              <span>Umumiy Ko'rsatkichlar</span>
            </button>

            <button
              onClick={() => setCurrentTab("users")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === "users"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Users className={`h-5 w-5 ${currentTab === "users" ? "text-brand-400" : ""}`} />
                <span>Foydalanuvchilar</span>
              </div>
              <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 font-mono font-bold">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab("complaints")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === "complaints"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <AlertTriangle className={`h-5 w-5 ${currentTab === "complaints" ? "text-amber-400" : ""}`} />
                <span>Shikoyatlar</span>
              </div>
              {stats && stats.pendingComplaints > 0 && (
                <span className="rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-xs font-bold font-mono">
                  {stats.pendingComplaints}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("devices")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === "devices"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Smartphone className={`h-5 w-5 ${currentTab === "devices" ? "text-indigo-400" : ""}`} />
                <span>Qurilmalar</span>
              </div>
              <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 font-mono font-bold">
                {devices.length}
              </span>
            </button>

            <div className="pt-4 px-3.5 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Platforma Boshqaruvi
            </div>

            <button
              onClick={() => setCurrentTab("settings")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === "settings"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Settings className={`h-5 w-5 ${currentTab === "settings" ? "text-cyan-400" : ""}`} />
              <span>Tizim Sozlamalari</span>
            </button>

            <button
              onClick={() => setCurrentTab("announcements")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === "announcements"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Bell className={`h-5 w-5 ${currentTab === "announcements" ? "text-violet-400" : ""}`} />
              <span>E'lonlar</span>
            </button>

            <button
              onClick={() => setCurrentTab("logs")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === "logs"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <History className={`h-5 w-5 ${currentTab === "logs" ? "text-emerald-400" : ""}`} />
              <span>Audit Jurnali</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="p-4 border-t border-zinc-800/60 space-y-3">
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xs">
                SA
              </div>
              <div>
                <div className="text-sm font-bold text-white">Super Admin</div>
                <div className="text-xs text-zinc-500 font-mono">Role: Owner</div>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/20 active:scale-98 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-zinc-400 font-medium">Boshqaruv</span>
            <span className="text-zinc-600">/</span>
            <span className="text-white font-bold capitalize text-base">{currentTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-500"></span>
              <span>Encrypted Gateway Active</span>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-850 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
              <span>Yangilash</span>
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-zinc-800 bg-zinc-900/95 px-5 py-3.5 text-sm shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-in fade-in duration-200">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-zinc-100 font-semibold">{toast.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <main className="p-8 max-w-6xl w-full mx-auto space-y-7">
          {/* OVERVIEW TAB */}
          {currentTab === "overview" && stats && (
            <div className="space-y-7 animate-in fade-in duration-200">
              {stats.maintenanceMode && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200 flex items-center gap-3.5">
                  <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
                  <div>
                    <strong className="font-bold">Texnik Tanaffus Rejimi Yoqilgan:</strong> Foydalanuvchilar suhbat xizmatlaridan vaqtinchalik foydalana olmaydi.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center justify-between text-zinc-400 mb-2.5">
                    <span className="text-sm font-semibold">Jami Userlar</span>
                    <Users className="h-5 w-5 text-brand-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">{stats.totalUsers}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium">Ro'yxatdan o'tganlar</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center justify-between text-zinc-400 mb-2.5">
                    <span className="text-sm font-semibold">Bloklangan</span>
                    <Lock className="h-5 w-5 text-rose-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-rose-400">{stats.bannedUsers}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium">Taqiqlangan hisoblar</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center justify-between text-zinc-400 mb-2.5">
                    <span className="text-sm font-semibold">Jami Olmoslar</span>
                    <Gem className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono">{stats.totalDiamonds}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium">Muomalada bo'lgan</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center justify-between text-zinc-400 mb-2.5">
                    <span className="text-sm font-semibold">Qurilmalar</span>
                    <Smartphone className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-300 font-mono">{stats.totalSessions}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium">Tizimga ulangan</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center justify-between text-zinc-400 mb-2.5">
                    <span className="text-sm font-semibold">Blok Qurilmalar</span>
                    <Shield className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-400 font-mono">{stats.blockedDevices}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium">Kirishi to'silgan</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-center justify-between text-zinc-400 mb-2.5">
                    <span className="text-sm font-semibold">Shikoyatlar</span>
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-yellow-400">
                    {stats.pendingComplaints}
                    <span className="text-sm text-zinc-500 font-normal ml-1">/ {stats.totalComplaints}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium">Ko'rib chiqilmagan</div>
                </div>
              </div>

              {/* Providers Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-5 flex items-center gap-2.5">
                    <Users className="h-5 w-5 text-brand-400" />
                    <span>Ro'yxatdan O'tish Provayderlari</span>
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(stats.providers || {}).map(([provider, count]) => {
                      const pct = Math.round((count / (stats.totalUsers || 1)) * 100);
                      return (
                        <div key={provider}>
                          <div className="flex justify-between text-sm font-semibold mb-1.5">
                            <span className="capitalize text-zinc-200">{provider}</span>
                            <span className="text-zinc-400 font-mono">{count} ta ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-2.5">
                      <Server className="h-5 w-5 text-indigo-400" />
                      <span>Tizim Xavfsizlik Holati</span>
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Admin panel Django REST Framework orqali ishlamoqda. CSRF va HMAC imzoli xavfsiz URL manzillar
                      yordamida sessiya doimiy himoyalangan.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between text-sm font-mono text-zinc-400">
                    <span>Backend: Django 5.2</span>
                    <span className="text-emerald-400 font-bold">Protected (200 OK)</span>
                  </div>
                </div>
              </div>
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

              <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-5">Foydalanuvchi</th>
                      <th className="py-4 px-5">Aloqa</th>
                      <th className="py-4 px-5">Provayder</th>
                      <th className="py-4 px-5">Olmoslar</th>
                      <th className="py-4 px-5">Holat</th>
                      <th className="py-4 px-5 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 text-sm">
                          Foydalanuvchi topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-5 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm uppercase">
                                {(u.name || u.email || u.phone || "U")[0]}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{u.name || "Nomsiz"}</div>
                                <div className="text-xs text-zinc-500 font-mono truncate max-w-[140px]">
                                  {u.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-zinc-200 font-medium">{u.email || u.phone || "—"}</td>
                          <td className="py-4 px-5">
                            <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 capitalize">
                              {u.provider}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono font-bold text-cyan-300 text-sm">
                            {u.diamonds ?? 0}
                          </td>
                          <td className="py-4 px-5">
                            {u.isBanned ? (
                              <span className="rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 text-xs font-bold">
                                Bloklangan
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-bold">
                                Faol
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setDiamondModalUser(u)}
                                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold transition-all"
                              >
                                + Olmos
                              </button>
                              {u.isBanned ? (
                                <button
                                  onClick={() => handleUserAction(u.id, "unban")}
                                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                                >
                                  Ochish
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(u.id, "ban")}
                                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all"
                                >
                                  Ban
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm("Ushbu foydalanuvchini o'chirmoqchimisiz?")) {
                                    handleUserAction(u.id, "delete");
                                  }
                                }}
                                className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                                title="O'chirish"
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

          {/* COMPLAINTS TAB */}
          {currentTab === "complaints" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <span>Kelib tushgan shikoyatlar</span>
                </h2>
                <span className="text-sm text-zinc-400 font-mono">Jami: {complaints.length} ta</span>
              </div>

              {complaints.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-16 text-center text-zinc-500 text-sm">
                  Hozircha hech qanday shikoyat kelib tushmagan.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">
                            Hamkor: <span className="text-rose-400 font-extrabold">{c.partnerUsername}</span>
                          </div>
                          <div className="text-xs text-zinc-500 font-mono mt-1">
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
                        <div className="flex flex-wrap gap-2">
                          {c.reasons.map((r, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-300"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {c.details && (
                        <p className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-300 leading-relaxed italic">
                          "{c.details}"
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                        <button
                          onClick={() => handleComplaintAction(c.id, "dismissed")}
                          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-all"
                        >
                          Rad etish
                        </button>
                        <button
                          onClick={() => handleComplaintAction(c.id, "resolved")}
                          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                        >
                          Hal qilindi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEVICES TAB */}
          {currentTab === "devices" && (
            <div className="space-y-5 smooth-fade">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2.5">
                  <Smartphone className="h-5 w-5 text-indigo-400" />
                  <span>Ulangan Qurilmalar va Xavfsizlik Seanslari</span>
                </h2>
                <span className="text-sm text-zinc-400 font-mono">Jami: {devices.length} ta seans</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider text-xs">
                      <th className="py-4 px-5">Qurilma</th>
                      <th className="py-4 px-5">IP Manzil</th>
                      <th className="py-4 px-5">Foydalanuvchi ID</th>
                      <th className="py-4 px-5">Oxirgi Faollik</th>
                      <th className="py-4 px-5">Holat</th>
                      <th className="py-4 px-5 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {devices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 text-sm">
                          Hech qanday qurilma seansi qayd etilmagan
                        </td>
                      </tr>
                    ) : (
                      devices.map((d) => (
                        <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-5 font-semibold text-white">
                            <div className="text-sm font-bold">{d.deviceName || "Noma'lum Qurilma"}</div>
                            <div className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">
                              {d.userAgent}
                            </div>
                          </td>
                          <td className="py-4 px-5 font-mono text-zinc-200 font-semibold">{d.ip || "127.0.0.1"}</td>
                          <td className="py-4 px-5 font-mono text-xs text-zinc-400 truncate max-w-[150px]">
                            {d.userId}
                          </td>
                          <td className="py-4 px-5 text-zinc-300 text-xs font-mono">
                            {new Date(d.lastActive || d.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-5">
                            {d.blocked ? (
                              <span className="rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 text-xs font-bold">
                                Bloklangan
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-bold">
                                Faol
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {d.blocked ? (
                                <button
                                  onClick={() => handleDeviceAction(d.id, "unblock")}
                                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                                >
                                  Ochish
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeviceAction(d.id, "block")}
                                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
                                >
                                  Bloklash
                                </button>
                              )}
                              <button
                                onClick={() => handleDeviceAction(d.id, "revoke")}
                                className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-rose-400 transition-all"
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

          {/* SETTINGS TAB */}
          {currentTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  <span>Platforma Sozlamalari</span>
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Foydalanuvchilar qoidalari, olmoslar narxi va sayt holati
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Texnik Tanaffus Rejimi (Maintenance Mode)</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Yoqilganda oddiy foydalanuvchilar audio matchmaking qila olmaydi
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.maintenanceMode}
                      onChange={(e) => setSettingsData({ ...settingsData, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Ro'yxatdan o'tganda beriladigan olmoslar (boshlang'ich bonus)
                  </label>
                  <input
                    type="number"
                    value={settingsData.defaultSignupDiamonds}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, defaultSignupDiamonds: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Har bir suhbat uchun olinadigan olmos narxi (0 = bepul)
                  </label>
                  <input
                    type="number"
                    value={settingsData.matchCostDiamonds}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, matchCostDiamonds: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Kunlik kirish uchun mukofot (Daily reward diamonds)
                  </label>
                  <input
                    type="number"
                    value={settingsData.dailyRewardDiamonds}
                    onChange={(e) =>
                      setSettingsData({ ...settingsData, dailyRewardDiamonds: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Bosh sahifada ko'rinadigan global bildirishnoma matni
                  </label>
                  <textarea
                    rows={3}
                    value={settingsData.platformNotice}
                    onChange={(e) => setSettingsData({ ...settingsData, platformNotice: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-zinc-100 px-6 py-3 text-sm font-bold text-zinc-950 shadow hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Sozlamalarni Saqlash
                </button>
              </form>
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
