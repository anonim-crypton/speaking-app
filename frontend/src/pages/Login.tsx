import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Phone } from "lucide-react";

import AuthShell from "@/components/AuthShell";
import GoogleSignIn from "@/components/GoogleSignIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { useMessages } from "@/i18n/messages";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/** "901234567" → "90-123-45-67" (the +998 prefix is shown separately). */
function formatUzPhone(digits: string): string {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)];
  return parts.filter(Boolean).join("-");
}

export default function Login() {
  const { t } = useLanguage();
  const { m, errorText } = useMessages();
  const { login, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "phone") {
      if (phoneDigits.length !== 9) {
        setError(m("phoneIncomplete"));
        return;
      }
      setLoading(true);
      try {
        const data = await loginWithPhone(`998${phoneDigits}`);
        navigate(data.user.onboardingCompleted ? "/" : "/onboarding");
      } catch (err) {
        setError(errorText(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setError(t.common.required);
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      navigate(data.user.onboardingCompleted ? "/" : "/onboarding");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      error={error}
      footer={
        <>
          {t.login.noAccount}{" "}
          <Link to="/register" className="font-bold text-brand-300 hover:text-brand-200">
            {t.login.registerLink}
          </Link>
        </>
      }
    >
      {/* ── Kirish usulini tanlash (Telefon raqam yoki Email/Parol) ── */}
      <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl border border-border/80 bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("phone");
            setError("");
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
            mode === "phone"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Telefon raqam</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("email");
            setError("");
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
            mode === "email"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Email va parol</span>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "phone" ? (
          <div className="space-y-2">
            <label htmlFor="login-phone" className="text-[12.5px] font-semibold">
              {t.register.phoneLabel || "Telefon raqamingiz"}
            </label>
            <div className="flex items-stretch gap-2">
              <span className="grid h-11 min-w-[74px] place-items-center rounded-xl border border-border/80 bg-white/5 text-sm font-bold text-brand-200">
                +998
              </span>
              <Input
                id="login-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="99-999-99-99"
                value={formatUzPhone(phoneDigits)}
                onChange={(event) =>
                  setPhoneDigits(event.target.value.replace(/\D/g, "").slice(0, 9))
                }
                className="h-11 tracking-wide"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-[12.5px] font-semibold">
                {t.register.emailLabel}
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="text-[12.5px] font-semibold">
                {t.register.passwordLabel}
              </label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </>
        )}

        <Button type="submit" variant="glow" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            t.common.loading
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              {t.login.submit}
            </>
          )}
        </Button>
      </form>

      <hr className="my-5 border-border/60" />

      <GoogleSignIn label={t.login.google} onSuccess={() => navigate("/")} />
    </AuthShell>
  );
}
