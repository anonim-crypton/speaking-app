import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  GraduationCap,
  Heart,
  HelpCircle,
  Loader2,
  Sparkles,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react";

import CountrySelect from "@/components/CountrySelect";
import LoadingScreen from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { useMessages } from "@/i18n/messages";
import { useAuth, type OnboardingAnswers } from "@/context/AuthContext";
import { useRegion } from "@/context/RegionContext";
import { getCachedRtt, loaderDuration } from "@/lib/network";
import { cn } from "@/lib/utils";

type Purpose = OnboardingAnswers["purpose"];
type Gender = OnboardingAnswers["gender"];

const TOTAL_STEPS = 5;

function OptionCard({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5",
        selected
          ? "border-brand-400/80 bg-brand-500/20 shadow-glow-sm ring-2 ring-brand-500/30"
          : "border-border/80 bg-white/[0.03] hover:border-brand-500/40 hover:bg-white/[0.06]"
      )}
    >
      <span
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors",
          selected
            ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
            : "bg-white/[0.06] text-brand-200"
        )}
      >
        {icon}
      </span>
      <span className="text-base font-semibold">{label}</span>
    </button>
  );
}

export default function Onboarding() {
  const { t } = useLanguage();
  const { m, errorText } = useMessages();
  const { isAuthed, loading, user, checkUsername, completeOnboarding } = useAuth();
  const { country: detectedCountry } = useRegion();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"questions" | "saving" | "done">("questions");
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Step 0 asks Name for phone & google users (or if user.name is missing);
  // for email/password users who already typed their name at registration, asks Age while keeping their name.
  const askNameInStep0 =
    user?.provider === "phone" || user?.provider === "google" || !user?.name;

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState<string | null>(
    user?.countryCode || detectedCountry
  );
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
    if (user?.username && !username) {
      setUsername(user.username);
    }
  }, [user?.name, user?.username]);

  const cleanUsername = useMemo(
    () => username.trim().replace(/^@+/, "").toLowerCase(),
    [username]
  );

  const canProceed = useMemo(() => {
    if (step === 0) {
      return askNameInStep0
        ? name.trim().length >= 2
        : Number(age) >= 10 && Number(age) <= 120;
    }
    if (step === 1) {
      return cleanUsername.length >= 5 && /^[a-z0-9_.]{5,30}$/.test(cleanUsername);
    }
    if (step === 2) return Boolean(country);
    if (step === 3) return Boolean(purpose);
    return Boolean(gender);
  }, [step, askNameInStep0, name, age, cleanUsername, country, purpose, gender]);

  if (loading) return <LoadingScreen visible label={t.common.loading} />;
  if (!isAuthed) return <Navigate to="/register" replace />;
  if (user?.onboardingCompleted && user?.username && phase === "questions") {
    return <Navigate to="/" replace />;
  }

  async function next() {
    setError("");
    if (!canProceed) {
      if (step === 1 && cleanUsername.length < 5) {
        setError(m("USERNAME_TOO_SHORT"));
        return;
      }
      setError(t.onboarding.required);
      return;
    }

    // Step 1 (Username): Verify uniqueness on backend before advancing to Step 2
    if (step === 1) {
      setCheckingUsername(true);
      try {
        await checkUsername(cleanUsername);
      } catch (err) {
        setError(errorText(err));
        setCheckingUsername(false);
        return;
      }
      setCheckingUsername(false);
    }

    if (step < TOTAL_STEPS - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    /* ── 5-savol yakunlandi: saqlash, loading, so'ngra tabriklash oynasi ── */
    const startedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    setPhase("saving");
    try {
      const finalName = name.trim() || user?.name || "";
      await completeOnboarding({
        name: finalName,
        username: cleanUsername,
        ...(age && Number(age) >= 10 ? { age: Number(age) } : {}),
        countryCode: country as string,
        purpose: purpose as Purpose,
        gender: gender as Gender,
      });

      const target = loaderDuration(getCachedRtt() ?? 250, "route");
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const remaining = Math.max(400, target - (now - startedAt));

      window.setTimeout(() => setPhase("done"), remaining);
    } catch (err) {
      setError(errorText(err));
      setPhase("questions");
    }
  }

  function back() {
    setError("");
    if (step > 0) setStep((prev) => prev - 1);
  }

  const titles = [
    askNameInStep0 ? m("nameQuestion") : t.onboarding.ageTitle,
    m("usernameQuestion"),
    t.onboarding.countryTitle || "Davlatingizni tanlang",
    t.onboarding.purposeTitle || "Bu saytga nima uchun kirdingiz?",
    t.onboarding.genderTitle || "Gender (jinsi)",
  ];

  return (
    <div className="relative min-h-screen w-full bg-night-950 overflow-x-clip">
      <div className="neon-backdrop" aria-hidden />

      {/* Butun ekranni egallovchi to'liq so'rovnoma oynasi */}
      <div className="mx-auto flex min-h-screen w-full max-w-[620px] flex-col justify-center px-6 py-12">
        {/* ── Progress bar ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>
              {t.onboarding.step || "Savol"} {step + 1} {t.onboarding.of || "/"} {TOTAL_STEPS}
            </span>
            <span className="text-brand-300 font-extrabold">
              {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Savol sarlavhasi ── */}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-foreground">
          {titles[step]}
        </h1>

        {/* ── Savol javob tanlash qismi ── */}
        <div className="mt-8 space-y-3">
          {/* 1-savol: Isim (telefon / Google orqali kirganlar) yoki Yosh */}
          {step === 0 && askNameInStep0 ? (
            <Input
              autoFocus
              maxLength={60}
              placeholder={m("namePlaceholder")}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canProceed) void next();
              }}
              className="h-14 text-xl font-bold bg-white/5 border-border/80"
            />
          ) : null}

          {step === 0 && !askNameInStep0 ? (
            <div className="space-y-3">
              <Input
                type="number"
                inputMode="numeric"
                min={10}
                max={120}
                autoFocus
                placeholder={t.onboarding.agePlaceholder || "Yoshingizni kiriting"}
                value={age}
                onChange={(event) => {
                  setAge(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canProceed) void next();
                }}
                className="h-14 max-w-[240px] text-xl font-bold bg-white/5 border-border/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-xs text-muted-foreground">{m("ageExample")}</p>
            </div>
          ) : null}

          {/* 2-savol: Username (kamida 5 ta belgi, har bir foydalanuvchida noyob) */}
          {step === 1 ? (
            <div className="space-y-3">
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-4 flex items-center text-brand-300">
                  <AtSign className="h-5 w-5" />
                </span>
                <Input
                  autoFocus
                  maxLength={30}
                  placeholder={m("usernamePlaceholder")}
                  value={username}
                  onChange={(event) => {
                    const sanitized = event.target.value
                      .replace(/^@+/, "")
                      .replace(/[^a-zA-Z0-9_.]/g, "")
                      .toLowerCase();
                    setUsername(sanitized);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canProceed && !checkingUsername) {
                      void next();
                    }
                  }}
                  className="h-14 pl-11 text-xl font-bold bg-white/5 border-border/80 tracking-wide"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{m("usernameHint")}</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    cleanUsername.length >= 5 ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {cleanUsername.length} / 5+
                </span>
              </div>
            </div>
          ) : null}

          {/* 3-savol: Davlatini tanlash */}
          {step === 2 ? (
            <div className="space-y-2">
              <CountrySelect
                value={country}
                onChange={setCountry}
                placeholder={t.onboarding.countryTitle || "Davlatingizni tanlang"}
                searchPlaceholder={t.onboarding.countryPlaceholder || "Davlat nomini qidiring..."}
              />
            </div>
          ) : null}

          {/* 4-savol: Bu saytga nima uchun kirdingiz? */}
          {step === 3 ? (
            <div className="grid gap-3">
              <OptionCard
                selected={purpose === "friends"}
                onClick={() => setPurpose("friends")}
                icon={<Users className="h-6 w-6" />}
                label={t.onboarding.purposeFriends || "Do'stlar orttirish"}
              />
              <OptionCard
                selected={purpose === "dating"}
                onClick={() => setPurpose("dating")}
                icon={<Heart className="h-6 w-6" />}
                label={t.onboarding.purposeDating || "Tanishish"}
              />
              <OptionCard
                selected={purpose === "language"}
                onClick={() => setPurpose("language")}
                icon={<GraduationCap className="h-6 w-6" />}
                label={t.onboarding.purposeLanguage || "Til o'rganish"}
              />
            </div>
          ) : null}

          {/* 5-savol: Gender yani jinsi */}
          {step === 4 ? (
            <div className="grid gap-3">
              <OptionCard
                selected={gender === "male"}
                onClick={() => setGender("male")}
                icon={<User className="h-6 w-6" />}
                label={t.onboarding.genderMale || "Erkak"}
              />
              <OptionCard
                selected={gender === "female"}
                onClick={() => setGender("female")}
                icon={<UserRound className="h-6 w-6" />}
                label={t.onboarding.genderFemale || "Ayol"}
              />
              <OptionCard
                selected={gender === "unspecified"}
                onClick={() => setGender("unspecified")}
                icon={<HelpCircle className="h-6 w-6" />}
                label={t.onboarding.genderUnspecified || "Taqdim etmayman"}
              />
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-[12.5px] text-red-300">
            {error}
          </p>
        ) : null}

        {/* ── Tugmalar: Orqaga va Next ── */}
        <div className="mt-10 flex items-center gap-3">
          {step > 0 ? (
            <Button
              variant="outline"
              size="xl"
              onClick={back}
              disabled={checkingUsername}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.onboarding.back || "Orqaga"}
            </Button>
          ) : null}
          <Button
            variant="glow"
            size="xl"
            onClick={() => void next()}
            disabled={!canProceed || checkingUsername}
            className="ml-auto min-w-[150px] gap-2"
          >
            {checkingUsername ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.common.loading}</span>
              </>
            ) : (
              <>
                {t.onboarding.next || "Keyingisi"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Biroz Loading animatsiyasi ── */}
      <LoadingScreen visible={phase === "saving"} label={t.onboarding.saving || "Ma'lumotlar saqlanmoqda..."} />

      {/* ── Tabriklash oynasi (Modali) ── */}
      {phase === "done" ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-night-950/85 p-5 backdrop-blur-md">
          <div className="relative w-full max-w-[480px] rounded-3xl border border-brand-500/40 bg-card p-8 text-center shadow-glow-lg sm:p-10 animate-in fade-in zoom-in-95 duration-200">
            {/* X (Yopish) tugmasi */}
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Yopish"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500 shadow-glow">
              <Sparkles className="h-10 w-10 text-white" />
            </span>

            <h2 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              {t.onboarding.thanksTitle || "Tabriklaymiz!"}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {t.onboarding.thanksText || "Savolimizga javob berganingiz uchun rahmat"}
            </p>

            <Button
              variant="glow"
              size="lg"
              className="mt-7 w-full"
              onClick={() => navigate("/")}
            >
              {t.onboarding.close || "Yopish"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
