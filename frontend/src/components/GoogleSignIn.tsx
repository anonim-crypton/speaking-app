import { useState, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";

import GoogleButton from "@/components/GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMessages } from "@/i18n/messages";

interface GoogleSignInProps {
  label: string;
  onSuccess: () => void;
  className?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
        id?: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "511124387227-7jv3fqh6ifdf0co632c1pp4njkaadmkn.apps.googleusercontent.com";

export default function GoogleSignIn({ label, onSuccess, className }: GoogleSignInProps) {
  const { signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const { m, errorText } = useMessages();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Google tugmasi bosilganda:
   * Google Identity Services OAuth 2.0 pop-up oynasini ochadi.
   */
  function handleGoogleClick() {
    setError("");

    if (window.google?.accounts?.oauth2) {
      setLoading(true);
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setLoading(false);
              setError(m("googleCancelled"));
              return;
            }

            if (tokenResponse.access_token) {
              try {
                // Google userinfo API orqali foydalanuvchi ma'lumotlarini olamiz
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();

                if (userInfo?.email) {
                  await signInWithGoogle(userInfo.email, userInfo.name || userInfo.email.split("@")[0]);
                  setLoading(false);
                  onSuccess();
                  return;
                }
              } catch (fetchErr) {
                console.error("Google userinfo fetch failed:", fetchErr);
              }
            }
            setLoading(false);
          },
        });

        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.warn("Google OAuth init error, fallback dialog:", err);
        setLoading(false);
      }
    }

    // Agar Google scripti yuklanmagan bo'lsa, zaxira dialog ochiladi
    setOpen(true);
  }

  async function submitFallback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError(t.common.required);
      return;
    }
    setLoading(true);
    try {
      await signInWithGoogle(email);
      setOpen(false);
      setEmail("");
      onSuccess();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GoogleButton
        label={loading ? t.common.loading : label}
        className={className}
        onClick={handleGoogleClick}
      />

      {error ? (
        <p className="mt-2 text-center text-xs text-red-400 font-medium">
          {error}
        </p>
      ) : null}

      {/* Zaxira (fallback) dialog */}
      {open ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-night-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[380px] rounded-2xl border border-border/80 bg-card p-6 shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">{label}</h2>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  {t.register.emailLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.onboarding.close}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300">
                {error}
              </p>
            ) : null}

            <form onSubmit={submitFallback} className="mt-4 space-y-3">
              <Input
                type="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@gmail.com"
                autoComplete="email"
              />
              <Button type="submit" variant="glow" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.common.loading}
                  </>
                ) : (
                  t.onboarding.next
                )}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
