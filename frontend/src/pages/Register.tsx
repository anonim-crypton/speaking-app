import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Phone, ShieldCheck, UserPlus } from "lucide-react";

import AuthShell from "@/components/AuthShell";
import GoogleSignIn from "@/components/GoogleSignIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useMessages } from "@/i18n/messages";
import { useAuth } from "@/context/AuthContext";
import { useRegion } from "@/context/RegionContext";
import { cn } from "@/lib/utils";

const RESEND_SECONDS = 20;

/** "901234567" → "90-123-45-67" (the +998 prefix is shown separately). */
function formatUzPhone(digits: string): string {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)];
  return parts.filter(Boolean).join("-");
}

export default function Register() {
  const { t } = useLanguage();
  const { m, errorText } = useMessages();
  const { register, registerPhone, sendOtp, verifyOtp } = useAuth();
  const { country } = useRegion();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"phone" | "email">("phone");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* phone flow */
  const [phoneDigits, setPhoneDigits] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* resend countdown */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  /** Everyone goes to the questionnaire after signing up. */
  function goAfterSignup() {
    navigate("/onboarding");
  }

  async function requestCode() {
    setError("");
    if (phoneDigits.length !== 9) {
      setError(m("phoneIncomplete"));
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp(`998${phoneDigits}`);
      setDevCode(res.devCode ?? null);
      setCooldown(res.resendIn || RESEND_SECONDS);
      setCode("");
      setStep("otp");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    /* ── Option 1: Telefon raqam orqali ro'yxatdan o'tish ── */
    if (mode === "phone") {
      if (step === "phone") {
        if (phoneDigits.length !== 9) {
          setError(m("phoneIncomplete"));
          return;
        }
        setLoading(true);
        try {
          await registerPhone(`998${phoneDigits}`, country);
          goAfterSignup();
        } catch (err) {
          if (err instanceof ApiError && err.code === "OTP_REQUIRED") {
            setLoading(false);
            await requestCode();
            return;
          }
          setError(errorText(err));
        } finally {
          setLoading(false);
        }
        return;
      }
      if (code.length !== 4) {
        setError(m("otpIncomplete"));
        return;
      }
      setLoading(true);
      try {
        await verifyOtp(`998${phoneDigits}`, code, country);
        goAfterSignup();
      } catch (err) {
        setError(errorText(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    /* ── Option 2: Ism / Email / Parol orqali ro'yxatdan o'tish ── */
    if (!name.trim() || !email.trim() || !password) {
      setError(t.common.required);
      return;
    }
    if (password.length < 6) {
      setError(m("PASSWORD_SHORT"));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, country);
      goAfterSignup();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = loading ? (
    t.common.loading
  ) : mode === "phone" ? (
    step === "phone" ? (
      <>
        <Phone className="mr-2 h-4 w-4" />
        {t.register.submit}
      </>
    ) : (
      <>
        <ShieldCheck className="mr-2 h-4 w-4" />
        {m("confirm")}
      </>
    )
  ) : (
    <>
      <UserPlus className="mr-2 h-4 w-4" />
      {t.register.submit}
    </>
  );

  return (
    <AuthShell
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSubtitle}
      error={error}
      footer={
        <>
          {t.register.haveAccount}{" "}
          <Link to="/login" className="font-bold text-brand-300 hover:text-brand-200">
            {t.register.loginLink}
          </Link>
        </>
      }
    >
      {/* ── Ro'yxatdan o'tish usulini tanlash (Telefon raqam yoki Ism/Email/Parol) ── */}
      <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl border border-border/80 bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("phone");
            setStep("phone");
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
        {mode === "phone" && step === "phone" ? (
          /* ── Phone number, +998 99-999-99-99 ── */
          <div className="space-y-2">
            <label htmlFor="reg-phone" className="text-[12.5px] font-semibold">
              {t.register.phoneLabel || "Telefon raqamingiz"}
            </label>
            <div className="flex items-stretch gap-2">
              <span className="grid h-11 min-w-[74px] place-items-center rounded-xl border border-border/80 bg-white/5 text-sm font-bold text-brand-200">
                +998
              </span>
              <Input
                id="reg-phone"
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
        ) : null}

        {mode === "phone" && step === "otp" ? (
          /* ── OTP: 4-digit code from the Telegram verification bot ── */
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError("");
              }}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              +998 {formatUzPhone(phoneDigits)}
            </button>

            <label htmlFor="reg-otp" className="block text-[12.5px] font-semibold">
              {m("otpLabel")}
            </label>
            <Input
              id="reg-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={4}
              placeholder="0000"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              className="h-14 text-center text-2xl font-extrabold tracking-[0.6em]"
            />

            {devCode ? (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-300">
                {m("otpTestMode", { code: devCode })}
              </p>
            ) : null}

            <div className="text-[12.5px] text-muted-foreground">
              {cooldown > 0 ? (
                <>{m("otpResendIn", { n: cooldown })}</>
              ) : (
                <button
                  type="button"
                  onClick={() => void requestCode()}
                  disabled={loading}
                  className="font-bold text-brand-300 hover:text-brand-200 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : m("otpResend")}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {mode === "email" ? (
          /* ── Name, Email, Password ── */
          <>
            <div className="space-y-2">
              <label htmlFor="reg-name" className="text-[12.5px] font-semibold">
                {t.register.nameLabel}
              </label>
              <Input
                id="reg-name"
                autoComplete="name"
                placeholder={t.auth.name}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reg-email" className="text-[12.5px] font-semibold">
                {t.register.emailLabel}
              </label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reg-password" className="text-[12.5px] font-semibold">
                {t.register.passwordLabel}
              </label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </>
        ) : null}

        <Button type="submit" variant="glow" size="lg" className="w-full" disabled={loading}>
          {submitLabel}
        </Button>
      </form>

      <hr className="my-5 border-border/60" />
      <GoogleSignIn label={t.register.google} onSuccess={goAfterSignup} />
    </AuthShell>
  );
}
