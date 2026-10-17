import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Camera,
  CheckCircle2,
  Gem,
  GraduationCap,
  Heart,
  HelpCircle,
  Loader2,
  Sparkles,
  UploadCloud,
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
import { apiPost } from "@/lib/api";
import { getCachedRtt, loaderDuration } from "@/lib/network";
import { cn } from "@/lib/utils";

type Purpose = OnboardingAnswers["purpose"];
type Gender = OnboardingAnswers["gender"];

const TOTAL_STEPS = 6;

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
  const { isAuthed, loading, user, token, checkUsername, uploadAvatar, completeOnboarding, refreshUser } = useAuth();
  const { country: detectedCountry } = useRegion();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"questions" | "saving" | "done">("questions");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  const handleClaimOnboardingBonus = async () => {
    if (claimingBonus) return;
    setClaimingBonus(true);
    try {
      await apiPost("/api/auth/claim-onboarding-bonus", {}, token);
      await refreshUser();
    } catch (err) {
      console.error("Failed to claim onboarding bonus:", err);
    } finally {
      setClaimingBonus(false);
      navigate("/");
    }
  };

  // Step 0 asks Name for phone & google users (or if user.name is missing);
  // for email/password users who already typed their name at registration, asks Age while keeping their name.
  const askNameInStep0 =
    user?.provider === "phone" || user?.provider === "google" || !user?.name;

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
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
    if (user?.avatarUrl && !avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.name, user?.username, user?.avatarUrl]);

  const cleanUsername = useMemo(
    () => username.trim().replace(/^@+/, "").toLowerCase(),
    [username]
  );

  const handleAvatarFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayllarini yuklash mumkin (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Rasm hajmi 10 MB dan oshmasligi kerak");
      return;
    }
    setError("");
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const res = await uploadAvatar(base64);
          if (res.avatarUrl) {
            setAvatarUrl(res.avatarUrl);
          }
        } catch (err) {
          setError(errorText(err));
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.onerror = () => {
        setError("Faylni o'qishda xatolik yuz berdi");
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(errorText(err));
      setUploadingAvatar(false);
    }
  };

  const canProceed = useMemo(() => {
    if (step === 0) {
      return askNameInStep0
        ? name.trim().length >= 2
        : Number(age) >= 10 && Number(age) <= 120;
    }
    if (step === 1) {
      return cleanUsername.length >= 5 && /^[a-z0-9_.]{5,30}$/.test(cleanUsername);
    }
    if (step === 2) return Boolean(avatarUrl && avatarUrl.trim());
    if (step === 3) return Boolean(country);
    if (step === 4) return Boolean(purpose);
    return Boolean(gender);
  }, [step, askNameInStep0, name, age, cleanUsername, avatarUrl, country, purpose, gender]);

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
      if (step === 2 && !avatarUrl) {
        setError("Iltimos, davom etish uchun profil rasmingizni yuklang (majburiy)");
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

    /* ── 6-savol yakunlandi: saqlash, loading, so'ngra tabriklash oynasi ── */
    const startedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    setPhase("saving");
    try {
      const finalName = name.trim() || user?.name || "";
      await completeOnboarding({
        name: finalName,
        username: cleanUsername,
        avatarUrl,
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
    "Profil rasmingizni yuklang",
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

          {/* 3-savol: Profil rasmini yuklash (majburiy) */}
          {step === 2 ? (
            <div className="flex flex-col items-center gap-6 py-2">
              <div className="relative group">
                <div
                  className={cn(
                    "relative flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-full p-1.5 transition-all duration-300",
                    avatarUrl
                      ? "bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.5)]"
                      : "bg-gradient-to-tr from-violet-500 via-purple-500 to-fuchsia-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                  )}
                >
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0d0822]">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profil rasmi"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-400">
                        <Camera className="h-12 w-12 text-violet-300/80 mb-1" />
                        <span className="text-[11px] font-semibold text-zinc-400">Rasm yo'q</span>
                      </div>
                    )}

                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs">
                        <Loader2 className="h-8 w-8 text-amber-300 animate-spin mb-1" />
                        <span className="text-xs font-bold text-amber-200">Yuklanmoqda...</span>
                      </div>
                    )}
                  </div>
                </div>

                {avatarUrl && (
                  <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-[#0d0822]">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatarFile(file);
                }}
              />

              <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                <Button
                  type="button"
                  size="lg"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "h-12 px-6 rounded-2xl font-bold gap-2 text-sm transition-all duration-200 cursor-pointer",
                    avatarUrl
                      ? "border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      : "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white hover:opacity-95 shadow-glow"
                  )}
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Yuklanmoqda...</span>
                    </>
                  ) : avatarUrl ? (
                    <>
                      <Camera className="h-4 w-4" />
                      <span>Rasmni almashtirish</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-5 w-5" />
                      <span>Rasmni tanlash (Majburiy)</span>
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {avatarUrl
                    ? "Rasm muvaffaqiyatli yuklandi! Keyingi savolga o'tishingiz mumkin."
                    : "Suhbatdoshlaringiz va boshqa foydalanuvchilar sizni ko'rishi uchun rasmingizni yuklang (majburiy)"}
                </p>
              </div>
            </div>
          ) : null}

          {/* 4-savol: Davlatini tanlash */}
          {step === 3 ? (
            <div className="space-y-2">
              <CountrySelect
                value={country}
                onChange={setCountry}
                placeholder={t.onboarding.countryTitle || "Davlatingizni tanlang"}
                searchPlaceholder={t.onboarding.countryPlaceholder || "Davlat nomini qidiring..."}
              />
            </div>
          ) : null}

          {/* 5-savol: Bu saytga nima uchun kirdingiz? */}
          {step === 4 ? (
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

          {/* 6-savol: Gender yani jinsi */}
          {step === 5 ? (
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

      {/* ── Tabriklash va 10+ Olmos Hadya oynasi (Modali) ── */}
      {phase === "done" ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-night-950/85 p-5 backdrop-blur-md">
          <div className="relative w-full max-w-[480px] rounded-3xl border border-amber-400/40 bg-card p-8 text-center shadow-glow-lg sm:p-10 animate-in fade-in zoom-in-95 duration-200">
            {/* X (Yopish) tugmasi */}
            <button
              type="button"
              onClick={() => void handleClaimOnboardingBonus()}
              aria-label="Yopish"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 shadow-[0_0_35px_rgba(245,158,11,0.45)]">
              <Gem className="h-12 w-12 text-white drop-shadow" />
              <span className="absolute -bottom-2 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md">
                +10 OLMOS
              </span>
            </div>

            <h2 className="mt-7 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              Tabriklaymiz!
            </h2>
            <p className="mt-3 text-base font-medium leading-relaxed text-slate-200">
              Ro'yxatdan o'tib savollarga javob berganingiz uchun sizga{" "}
              <span className="font-extrabold text-amber-400">10+ ta olmos</span> hadya qilindi!
            </p>

            <Button
              variant="glow"
              size="lg"
              disabled={claimingBonus}
              className="mt-7 w-full gap-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 text-base font-bold text-white shadow-[0_10px_28px_-6px_rgba(245,158,11,0.55)] hover:opacity-95"
              onClick={() => void handleClaimOnboardingBonus()}
            >
              {claimingBonus ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Olmos olinmoqda...</span>
                </>
              ) : (
                <>
                  <Gem className="h-5 w-5" />
                  <span>Olmosni olish</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
