export const API_BASE = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, "")
  : "";
const BASE = API_BASE;

export type AuthProviderKind = "password" | "phone" | "google";

export interface AuthUser {
  id: string;
  /** Unguessable per-user URL segment, e.g. /u/<slug>. */
  slug: string;
  name: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  email: string | null;
  phone: string | null;
  provider: AuthProviderKind;
  countryCode: string | null;
  region: string | null;
  diamonds: number;
  isPremium?: boolean;
  isVerified?: boolean;
  isBanned?: boolean;
  diamondHistory?: Array<{ amount: number; type: string; date: string }>;
  adminMessages?: Array<{ id: string; text: string; sender?: string; isAdmin?: boolean; createdAt?: string }>;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
  created?: boolean;
}

export interface GeoResponse {
  success: boolean;
  country: string | null;
  region?: string | null;
  phoneOnly?: boolean;
  source?: string;
}

export class ApiError extends Error {
  code?: string;
  retryAfter?: number;
  detail?: string;

  constructor(message: string, code?: string, retryAfter?: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.retryAfter = retryAfter;
    this.detail = detail;
  }
}

async function handle<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const body = data as
      | { message?: string; code?: string; retryAfter?: number; detail?: string }
      | null;
    throw new ApiError(
      body?.message || "Something went wrong",
      body?.code,
      body?.retryAfter,
      body?.detail
    );
  }
  return data as T;
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handle<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export const DJANGO_BASE = import.meta.env.VITE_DJANGO_API_URL
  ? String(import.meta.env.VITE_DJANGO_API_URL).trim().replace(/\/+$/, "")
  : (BASE ? `${BASE}/api/admin` : "http://localhost:8000/api/admin");

export async function adminApiGet<T>(endpoint: string, token?: string | null): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${DJANGO_BASE}${cleanEndpoint}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handle<T>(res);
}

export async function adminApiPost<T>(
  endpoint: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${DJANGO_BASE}${cleanEndpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

