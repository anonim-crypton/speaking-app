import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost, type AuthResponse, type AuthUser } from "@/lib/api";

export interface OnboardingAnswers {
  /** Asked for email / Google sign-ups (optional). */
  age?: number;
  /** User's display name. */
  name?: string;
  /** Unique username (minimum 5 characters). */
  username: string;
  /** User profile picture URL (mandatory). */
  avatarUrl: string;
  countryCode: string;
  purpose: "friends" | "dating" | "language";
  gender: "male" | "female" | "gay" | "unspecified";
}

export interface OtpSendResult {
  success: boolean;
  resendIn: number;
  devCode?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthed: boolean;
  /** Signed in, but the questionnaire has not been answered yet. */
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithPhone: (phone: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
    countryCode?: string | null
  ) => Promise<AuthResponse>;
  /** Phone sign-up without a code (used while OTP is switched off on the server). */
  registerPhone: (phone: string, countryCode?: string | null) => Promise<AuthResponse>;
  sendOtp: (phone: string) => Promise<OtpSendResult>;
  verifyOtp: (
    phone: string,
    code: string,
    countryCode?: string | null
  ) => Promise<AuthResponse>;
  signInWithGoogle: (email: string, name?: string) => Promise<AuthResponse>;
  checkUsername: (username: string) => Promise<{ available: boolean; username: string }>;
  uploadAvatar: (base64Image: string) => Promise<{ success: boolean; avatarUrl: string }>;
  updateProfile: (patch: {
    name?: string;
    username?: string;
    avatarUrl?: string | null;
    deleteAvatar?: boolean;
  }) => Promise<AuthUser>;
  completeOnboarding: (answers: OnboardingAnswers) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
  try {
    return localStorage.getItem("ls_token");
  } catch {
    return null;
  }
}

function withCachedAvatar(u: AuthUser | null, token?: string | null): AuthUser | null {
  if (!u) return null;
  try {
    const userKey = `ls_user_avatar_${u.id}`;
    const cachedForUser = localStorage.getItem(userKey);
    const cachedLast = localStorage.getItem("ls_user_avatar");

    if (u.avatarUrl && u.avatarUrl.startsWith("data:image/")) {
      localStorage.setItem(userKey, u.avatarUrl);
      localStorage.setItem("ls_user_avatar", u.avatarUrl);
      return u;
    }

    const bestCached =
      (cachedForUser && cachedForUser.startsWith("data:image/") ? cachedForUser : null) ||
      (cachedLast && cachedLast.startsWith("data:image/") ? cachedLast : null);

    // If server returned null or a broken relative /media/ path, restore the cached data URL and sync to backend
    if (bestCached && (!u.avatarUrl || u.avatarUrl.startsWith("/media/"))) {
      if (token) {
        void apiPost("/api/auth/upload-avatar", { image: bestCached }, token).catch(() => {});
      }
      return { ...u, avatarUrl: bestCached };
    }

    if (u.avatarUrl) {
      localStorage.setItem(userKey, u.avatarUrl);
      localStorage.setItem("ls_user_avatar", u.avatarUrl);
    }
  } catch {
    /* ignore storage errors */
  }
  return u;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiGet<{ success: boolean; user: AuthUser }>("/api/auth/me", token)
      .then((data) => {
        if (!cancelled) setUser(withCachedAvatar(data.user, token));
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setToken(null);
        try {
          localStorage.removeItem("ls_token");
        } catch {
          /* ignore */
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Silent background reload every 1 second without disrupting user UI
  useEffect(() => {
    if (!token) return;
    const bgSync = setInterval(() => {
      apiGet<{ success: boolean; user: AuthUser }>("/api/auth/me", token)
        .then((data) => {
          if (data?.user) {
            const hydrated = withCachedAvatar(data.user, token);
            if (!hydrated) return;
            setUser((prev) => {
              if (!prev) return hydrated;
              if (
                prev.diamonds !== hydrated.diamonds ||
                prev.name !== hydrated.name ||
                prev.username !== hydrated.username ||
                prev.avatarUrl !== hydrated.avatarUrl ||
                prev.xp !== hydrated.xp ||
                prev.isPremium !== hydrated.isPremium ||
                prev.onboardingCompleted !== hydrated.onboardingCompleted
              ) {
                return hydrated;
              }
              return prev;
            });
          }
        })
        .catch((err) => {
          if (
            err?.code === "SESSION_TERMINATED" ||
            err?.code === "DEVICE_BLOCKED" ||
            err?.message?.includes("Seans") ||
            err?.message?.includes("bloklangan")
          ) {
            logout();
          }
        });
    }, 1000);

    return () => clearInterval(bgSync);
  }, [token]);

  function persist(nextToken: string, nextUser: AuthUser) {
    setToken(nextToken);
    setUser(withCachedAvatar(nextUser, nextToken));
    try {
      localStorage.setItem("ls_token", nextToken);
    } catch {
      /* ignore */
    }
  }

  const login = async (email: string, password: string) => {
    const data = await apiPost<AuthResponse>("/api/auth/login", { email, password });
    persist(data.token, data.user);
    return data;
  };

  const loginWithPhone = async (phone: string) => {
    const data = await apiPost<AuthResponse>("/api/auth/login", { phone });
    persist(data.token, data.user);
    return data;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    countryCode?: string | null
  ) => {
    const data = await apiPost<AuthResponse>("/api/auth/register", {
      name,
      email,
      password,
      countryCode: countryCode ?? null,
    });
    persist(data.token, data.user);
    return data;
  };

  const registerPhone = async (phone: string, countryCode?: string | null) => {
    const data = await apiPost<AuthResponse>("/api/auth/register-phone", {
      phone,
      countryCode: countryCode ?? "UZ",
    });
    persist(data.token, data.user);
    return data;
  };

  const sendOtp = async (phone: string) =>
    apiPost<OtpSendResult>("/api/auth/send-otp", { phone });

  const verifyOtp = async (
    phone: string,
    code: string,
    countryCode?: string | null
  ) => {
    const data = await apiPost<AuthResponse>("/api/auth/verify-otp", {
      phone,
      code,
      countryCode: countryCode ?? "UZ",
    });
    persist(data.token, data.user);
    return data;
  };

  const signInWithGoogle = async (credentialOrEmail: string, name?: string) => {
    const isToken = credentialOrEmail.includes(".") && credentialOrEmail.length > 50;
    const body = isToken
      ? { credential: credentialOrEmail }
      : { email: credentialOrEmail, name };
    const data = await apiPost<AuthResponse>("/api/auth/google", body);
    persist(data.token, data.user);
    return data;
  };

  const checkUsername = async (username: string) => {
    if (!token) throw new Error("Not signed in");
    return apiGet<{ success: boolean; available: boolean; username: string }>(
      `/api/onboarding/check-username?username=${encodeURIComponent(username)}`,
      token
    );
  };

  const uploadAvatar = async (base64Image: string) => {
    if (!token) throw new Error("Not signed in");
    try {
      if (base64Image && base64Image.startsWith("data:image/")) {
        localStorage.setItem("ls_user_avatar", base64Image);
        if (user?.id) {
          localStorage.setItem(`ls_user_avatar_${user.id}`, base64Image);
        }
      }
    } catch {
      /* ignore */
    }
    const data = await apiPost<{ success: boolean; avatarUrl: string; message: string }>(
      "/api/auth/upload-avatar",
      { image: base64Image },
      token
    );
    const finalAvatar =
      data.avatarUrl && data.avatarUrl.startsWith("data:image/")
        ? data.avatarUrl
        : base64Image || data.avatarUrl;
    if (finalAvatar) {
      setUser((prev) => (prev ? withCachedAvatar({ ...prev, avatarUrl: finalAvatar }, token) : prev));
    }
    return { ...data, avatarUrl: finalAvatar };
  };

  const completeOnboarding = async (answers: OnboardingAnswers) => {
    if (!token) throw new Error("Not signed in");
    try {
      if (answers.avatarUrl) {
        localStorage.setItem("ls_user_avatar", answers.avatarUrl);
        if (user?.id) {
          localStorage.setItem(`ls_user_avatar_${user.id}`, answers.avatarUrl);
        }
      }
    } catch {
      /* ignore */
    }
    const data = await apiPost<{ success: boolean; user: AuthUser }>(
      "/api/onboarding",
      answers,
      token
    );
    setUser(withCachedAvatar({ ...data.user, avatarUrl: data.user.avatarUrl || answers.avatarUrl }, token));
  };

  const updateProfile = async (patch: {
    name?: string;
    username?: string;
    avatarUrl?: string | null;
    deleteAvatar?: boolean;
  }) => {
    if (!token) throw new Error("Not signed in");
    const data = await apiPost<{ success: boolean; user: AuthUser; message?: string }>(
      "/api/auth/profile",
      patch,
      token
    );
    if (data?.user) {
      if (patch.deleteAvatar) {
        try {
          localStorage.removeItem("ls_user_avatar");
          if (user?.id) localStorage.removeItem(`ls_user_avatar_${user.id}`);
        } catch {
          /* ignore */
        }
      } else if (patch.avatarUrl && patch.avatarUrl.startsWith("data:image/")) {
        try {
          localStorage.setItem("ls_user_avatar", patch.avatarUrl);
          if (user?.id) localStorage.setItem(`ls_user_avatar_${user.id}`, patch.avatarUrl);
        } catch {
          /* ignore */
        }
      }
      const updatedUser = withCachedAvatar(data.user, token);
      setUser(updatedUser);
      return updatedUser || data.user;
    }
    throw new Error(data?.message || "Profilni yangilashda xatolik");
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await apiGet<{ success: boolean; user: AuthUser }>("/api/auth/me", token);
      if (data?.user) {
        setUser(withCachedAvatar(data.user, token));
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!token) return;
    // Silent background polling every 2.5s for real-time user updates (VIP, diamonds, ban, etc.)
    const timer = setInterval(() => {
      void refreshUser();
    }, 2500);
    return () => clearInterval(timer);
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("ls_token");
      localStorage.removeItem("ls_user_avatar");
    } catch {
      /* ignore */
    }
  };

  const needsOnboarding = Boolean(user && (!user.onboardingCompleted || !user.username));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthed: Boolean(user),
        needsOnboarding,
        login,
        loginWithPhone,
        register,
        registerPhone,
        sendOtp,
        verifyOtp,
        signInWithGoogle,
        checkUsername,
        uploadAvatar,
        updateProfile,
        completeOnboarding,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
