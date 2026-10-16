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
  completeOnboarding: (answers: OnboardingAnswers) => Promise<void>;
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
        if (!cancelled) setUser(data.user);
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
            setUser((prev) => {
              if (!prev) return data.user;
              if (
                prev.diamonds !== data.user.diamonds ||
                prev.name !== data.user.name ||
                prev.username !== data.user.username ||
                prev.onboardingCompleted !== data.user.onboardingCompleted
              ) {
                return data.user;
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
    setUser(nextUser);
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

  const completeOnboarding = async (answers: OnboardingAnswers) => {
    if (!token) throw new Error("Not signed in");
    const data = await apiPost<{ success: boolean; user: AuthUser }>(
      "/api/onboarding",
      answers,
      token
    );
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("ls_token");
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
        completeOnboarding,
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
