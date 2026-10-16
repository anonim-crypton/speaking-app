import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Shield,
  Smartphone,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  PlusCircle,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Gem,
  Activity,
  Server,
  Layers,
  Sparkles,
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

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem("lingo_admin_token");
  });

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard view state
  const [currentTab, setCurrentTab] = useState<"overview" | "users" | "complaints" | "devices">("overview");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);

  // Diamond modal state
  const [diamondModalUser, setDiamondModalUser] = useState<UserItem | null>(null);
  const [diamondAmount, setDiamondAmount] = useState<string>("50");

  const notify = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await adminApiPost<{
        success: boolean;
        token: string;
        message?: string;
      }>("/login/", { username, password });

      if (res.success && res.token) {
        localStorage.setItem("lingo_admin_token", res.token);
        setAdminToken(res.token);
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
  };

  const loadData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [statsRes, usersRes, complaintsRes, devicesRes] = await Promise.allSettled([
        adminApiGet<{ success: boolean; stats: AdminStats }>("/stats/", adminToken),
        adminApiGet<{ success: boolean; users: UserItem[] }>("/users/", adminToken),
        adminApiGet<{ success: boolean; complaints: ComplaintItem[] }>("/complaints/", adminToken),
        adminApiGet<{ success: boolean; devices: DeviceItem[] }>("/devices/", adminToken),
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
    } catch {
      notify("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadData();
    }
  }, [adminToken]);

  // User Actions
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Amalni bajarishda xatolik";
      notify(msg, "error");
    }
  };

  // Complaint Actions
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      notify(msg, "error");
    }
  };

  // Device Actions
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      notify(msg, "error");
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

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Lingo Speek Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              Django REST Framework Backend
            </p>
          </div>

          {loginError && (
            <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Foydalanuvchi
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Parol
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {loggingIn ? "Tekshirilmoqda..." : "Tizimga Kirish"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Lingo Speek
              </span>
              <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300 border border-brand-500/30">
                ADMIN
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 flex items-center gap-1 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Django REST
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Boshqaruv Paneli & Tizim Xavfsizligi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 active:scale-95 transition-all"
            title="Yangilash"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand-400" : ""}`} />
            <span>Yangilash</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Chiqish</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-sm shadow-2xl flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-rose-950/90 text-rose-200 border-rose-500/30"
          } backdrop-blur-lg animate-in fade-in slide-in-from-bottom-2 duration-200`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="border-b border-white/5 bg-slate-900/40 px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentTab("overview")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              currentTab === "overview"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Umumiy Ko'rsatkichlar</span>
          </button>
          <button
            onClick={() => setCurrentTab("users")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              currentTab === "users"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Foydalanuvchilar ({users.length})</span>
          </button>
          <button
            onClick={() => setCurrentTab("complaints")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              currentTab === "complaints"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Shikoyatlar ({complaints.length})</span>
            {stats && stats.pendingComplaints > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                {stats.pendingComplaints}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab("devices")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              currentTab === "devices"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Qurilmalar ({devices.length})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {/* OVERVIEW TAB */}
        {currentTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Jami Userlar</span>
                  <Users className="h-4 w-4 text-brand-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
                <div className="text-[11px] text-slate-500 mt-1">Ro'yxatdan o'tganlar</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Bloklangan</span>
                  <Lock className="h-4 w-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400">{stats.bannedUsers}</div>
                <div className="text-[11px] text-slate-500 mt-1">Taqiqlangan hisoblar</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Jami Olmoslar</span>
                  <Gem className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-400">{stats.totalDiamonds}</div>
                <div className="text-[11px] text-slate-500 mt-1">Muomalada bo'lgan</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Qurilmalar</span>
                  <Smartphone className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-300">{stats.totalSessions}</div>
                <div className="text-[11px] text-slate-500 mt-1">Tizimga ulangan</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Blok Qurilmalar</span>
                  <Shield className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{stats.blockedDevices}</div>
                <div className="text-[11px] text-slate-500 mt-1">Kirishi to'silgan</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Shikoyatlar</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="text-2xl font-black text-yellow-400">
                  {stats.pendingComplaints}
                  <span className="text-xs text-slate-500 font-normal ml-1">/ {stats.totalComplaints}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Ko'rib chiqilmagan</div>
              </div>
            </div>

            {/* Platform breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Layers className="h-4 w-4 text-brand-400" />
                  Ro'yxatdan O'tish Usullari (Auth Providers)
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.providers).map(([provider, count]) => {
                    const pct = Math.round((count / (stats.totalUsers || 1)) * 100);
                    return (
                      <div key={provider}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="capitalize text-slate-300">{provider}</span>
                          <span className="text-slate-400">{count} ta ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-brand-400" />
                    Django REST & Python Backend Ma'lumotlari
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ushbu boshqaruv paneli backend/django_admin ichidagi Python Django REST Framework
                    APIlari bilan to'g'ridan-to'g'ri integratsiyalashgan. Foydalanuvchilar, qurilma
                    seanslari va shikoyatlar markazlashtirilgan backend/data ma'lumotlar ombori
                    orqali doimiy sinxron holatda turadi.
                  </p>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>API holati: Faol (200 OK)</span>
                  <span className="text-emerald-400 font-semibold">Tizim xavfsiz</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {currentTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ism, email, tel yoki ID bo'yicha qidiruv..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div className="text-xs text-slate-400">
                Jami: <strong className="text-white">{filteredUsers.length}</strong> ta foydalanuvchi
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Foydalanuvchi</th>
                    <th className="py-3 px-4">Aloqa (Email / Tel)</th>
                    <th className="py-3 px-4">Provayder</th>
                    <th className="py-3 px-4">Olmoslar</th>
                    <th className="py-3 px-4">Holat</th>
                    <th className="py-3 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Foydalanuvchi topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs uppercase">
                              {(u.name || u.email || u.phone || "U")[0]}
                            </div>
                            <div>
                              <div>{u.name || "Nomsiz"}</div>
                              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                                {u.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {u.email || u.phone || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300 capitalize">
                            {u.provider}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-cyan-300">
                          💎 {u.diamonds ?? 0}
                        </td>
                        <td className="py-3.5 px-4">
                          {u.isBanned ? (
                            <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                              Bloklangan
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                              Faol
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDiamondModalUser(u)}
                              title="Olmos qo'shish"
                              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-1.5 text-cyan-300 hover:bg-cyan-500/20 transition-all"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </button>
                            {u.isBanned ? (
                              <button
                                onClick={() => handleUserAction(u.id, "unban")}
                                title="Blokdan chiqarish"
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500/20 transition-all"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(u.id, "ban")}
                                title="Bloklash"
                                className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20 transition-all"
                              >
                                <Lock className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Rostdan ham ushbu foydalanuvchini o'chirmoqchimisiz?`)) {
                                  handleUserAction(u.id, "delete");
                                }
                              }}
                              title="O'chirish"
                              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Kelib tushgan shikoyat va takliflar
            </h2>
            {complaints.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-12 text-center text-slate-500 text-xs">
                Hozircha hech qanday shikoyat kelib tushmagan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">
                          Shikoyat qilingan:{" "}
                          <span className="text-rose-400 font-extrabold">{c.partnerUsername}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Sana: {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          c.status === "resolved"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : c.status === "dismissed"
                            ? "bg-slate-500/20 text-slate-400 border-white/10"
                            : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
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
                            className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-300"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {c.details && (
                      <p className="rounded-xl bg-white/5 border border-white/5 p-3 text-xs text-slate-300 italic">
                        "{c.details}"
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => handleComplaintAction(c.id, "dismissed")}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-all"
                      >
                        Rad etish
                      </button>
                      <button
                        onClick={() => handleComplaintAction(c.id, "resolved")}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                      >
                        Hal qilindi deb belgilash
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
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-400" />
              Ulangan Qurilmalar va Xavfsizlik Seanslari
            </h2>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Qurilma Nomi</th>
                    <th className="py-3 px-4">IP Manzil</th>
                    <th className="py-3 px-4">Foydalanuvchi ID</th>
                    <th className="py-3 px-4">Oxirgi Faollik</th>
                    <th className="py-3 px-4">Holat</th>
                    <th className="py-3 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {devices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Hech qanday qurilma seansi qayd etilmagan
                      </td>
                    </tr>
                  ) : (
                    devices.map((d) => (
                      <tr key={d.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{d.deviceName || "Noma'lum Qurilma"}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                            {d.userAgent}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {d.ip || "127.0.0.1"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                          {d.userId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(d.lastActive || d.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {d.blocked ? (
                            <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                              Bloklangan
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                              Faol
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {d.blocked ? (
                              <button
                                onClick={() => handleDeviceAction(d.id, "unblock")}
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                              >
                                Blokdan chiqarish
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeviceAction(d.id, "block")}
                                className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-all"
                              >
                                Bloklash
                              </button>
                            )}
                            <button
                              onClick={() => handleDeviceAction(d.id, "revoke")}
                              title="Seansni o'chirish"
                              className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
      </main>

      {/* Give Diamonds Modal */}
      {diamondModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gem className="h-4 w-4 text-cyan-400" />
                Olmos Balansini Boshqarish
              </h3>
              <button
                onClick={() => setDiamondModalUser(null)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Foydalanuvchi: <strong className="text-white">{diamondModalUser.name || diamondModalUser.email || diamondModalUser.phone}</strong>
              <br />
              Hozirgi balans: <strong className="text-cyan-400 font-mono">💎 {diamondModalUser.diamonds ?? 0}</strong>
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Qo'shiladigan yoki kamaytiriladigan miqdor (+ / -)
              </label>
              <input
                type="number"
                value={diamondAmount}
                onChange={(e) => setDiamondAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDiamondModalUser(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  const amt = parseInt(diamondAmount, 10);
                  if (isNaN(amt)) return;
                  handleUserAction(diamondModalUser.id, "add_diamonds", { amount: amt });
                }}
                className="rounded-xl bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
