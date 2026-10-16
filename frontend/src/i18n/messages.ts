import { ApiError } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Error / status messages shown in forms, in the language the visitor picked.
 *
 * Backend errors arrive as an English `message` plus a machine-readable `code`;
 * the code is looked up here. Languages without their own block fall back to
 * English (same policy as the rest of the site's translations).
 */
const en = {
  /* ── API error codes ── */
  NAME_REQUIRED: "Please enter your name",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_SHORT: "Password must be at least 6 characters",
  EMAIL_TAKEN: "This email is already registered",
  REGISTER_FAILED: "Registration failed. Please try again",
  PHONE_INVALID: "Please enter a valid phone number",
  PHONE_TAKEN: "This phone number is already registered",
  GOOGLE_EMAIL_INVALID: "A valid Google email is required",
  GOOGLE_CREDENTIAL_INVALID: "Google sign-in could not be verified",
  GOOGLE_TOKEN_UNVERIFIED: "Could not verify your Google account",
  GOOGLE_FAILED: "Google sign-in failed. Please try again",
  CREDENTIALS_REQUIRED: "Please enter your email and password",
  EMAIL_WRONG: "Incorrect email",
  PASSWORD_WRONG: "Incorrect password",
  GOOGLE_ACCOUNT: "This account was created with Google. Please sign in with Google",
  LOGIN_FAILED: "Sign-in failed. Please try again",
  OTP_WAIT: "Please wait {n} seconds before requesting a new code",
  OTP_SEND_FAILED: "Could not send the code. Please try again",
  OTP_NO_BALANCE: "The code service is temporarily unavailable. Please try again later",
  OTP_NOT_ON_TELEGRAM: "This phone number is not registered on Telegram, so the code cannot be sent",
  OTP_EXPIRED: "The code has expired. Please request a new one",
  OTP_TOO_MANY: "Too many attempts. Please request a new code",
  OTP_WRONG: "Incorrect code",
  VERIFY_FAILED: "Verification failed. Please try again",
  AGE_INVALID: "Please enter a valid age",
  NAME_INVALID: "Please enter your name",
  USERNAME_TOO_SHORT: "Username must be at least 5 characters",
  USERNAME_INVALID: "Username can only contain letters, numbers, _ and .",
  USERNAME_TAKEN: "This username is already taken, please choose another one",
  PHONE_NOT_REGISTERED: "This phone number is not registered",
  COUNTRY_REQUIRED: "Please select a country",
  PURPOSE_REQUIRED: "Please choose an option",
  GENDER_REQUIRED: "Please choose an option",
  ONBOARDING_FAILED: "Could not save your answers. Please try again",
  AUTH_REQUIRED: "Please sign in to continue",
  NOT_FOUND: "Not found",
  SERVER_ERROR: "Something went wrong. Please try again",
  NETWORK_ERROR: "No connection to the server. Please check your internet",

  /* ── form texts ── */
  phoneIncomplete: "Please enter the full phone number",
  otpIncomplete: "Please enter the 4-digit code",
  confirm: "Confirm",
  otpLabel: "Enter the 4-digit code sent by the Telegram Verification Codes bot",
  otpResend: "Resend code",
  otpResendIn: "You can request a new code in {n} seconds",
  otpTestMode: "Test mode (no Telegram Gateway token): code {code}",
  nameQuestion: "What is your name?",
  namePlaceholder: "Enter your name",
  usernameQuestion: "Choose a unique username",
  usernamePlaceholder: "username (at least 5 characters)",
  usernameHint: "Minimum 5 characters. Letters, numbers, _ and . are allowed.",
  ageExample: "For example: 18, 22, 25",
  googleCancelled: "Google sign-in was cancelled or failed",
};

type MsgKey = keyof typeof en;
type Dict = Record<MsgKey, string>;

const uz: Dict = {
  NAME_REQUIRED: "Iltimos, ismingizni kiriting",
  EMAIL_INVALID: "Iltimos, to'g'ri email manzil kiriting",
  PASSWORD_SHORT: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
  EMAIL_TAKEN: "Bu email allaqachon ro'yxatdan o'tgan",
  REGISTER_FAILED: "Ro'yxatdan o'tishda xatolik. Qaytadan urinib ko'ring",
  PHONE_INVALID: "Iltimos, to'g'ri telefon raqam kiriting",
  PHONE_TAKEN: "Bu telefon raqam allaqachon ro'yxatdan o'tgan",
  GOOGLE_EMAIL_INVALID: "To'g'ri Google email kerak",
  GOOGLE_CREDENTIAL_INVALID: "Google orqali kirishni tasdiqlab bo'lmadi",
  GOOGLE_TOKEN_UNVERIFIED: "Google hisobingizni tekshirib bo'lmadi",
  GOOGLE_FAILED: "Google orqali kirishda xatolik. Qaytadan urinib ko'ring",
  CREDENTIALS_REQUIRED: "Iltimos, email va parolni kiriting",
  EMAIL_WRONG: "Email xato",
  PASSWORD_WRONG: "Parol xato",
  GOOGLE_ACCOUNT: "Bu hisob Google orqali ochilgan. Google orqali kiring",
  LOGIN_FAILED: "Kirishda xatolik. Qaytadan urinib ko'ring",
  OTP_WAIT: "Yangi kodni so'rash uchun {n} soniya kuting",
  OTP_SEND_FAILED: "Kodni yuborib bo'lmadi. Qaytadan urinib ko'ring",
  OTP_NO_BALANCE: "Kod yuborish xizmati vaqtincha ishlamayapti. Keyinroq urinib ko'ring",
  OTP_NOT_ON_TELEGRAM:
    "Bu raqam Telegramda ro'yxatdan o'tmagan, shuning uchun kod yuborib bo'lmaydi",
  OTP_EXPIRED: "Kod muddati tugagan. Yangi kod so'rang",
  OTP_TOO_MANY: "Juda ko'p urinish. Yangi kod so'rang",
  OTP_WRONG: "Kod noto'g'ri",
  VERIFY_FAILED: "Tasdiqlashda xatolik. Qaytadan urinib ko'ring",
  AGE_INVALID: "Iltimos, to'g'ri yosh kiriting",
  NAME_INVALID: "Iltimos, ismingizni kiriting",
  USERNAME_TOO_SHORT: "Username kamida 5 ta belgidan iborat bo'lishi kerak",
  USERNAME_INVALID: "Username faqat harflar, raqamlar, _ va . dan iborat bo'lishi mumkin",
  USERNAME_TAKEN: "Bu username allaqachon band qilingan, boshqa username tanlang",
  PHONE_NOT_REGISTERED: "Bu telefon raqam ro'yxatdan o'tmagan",
  COUNTRY_REQUIRED: "Iltimos, davlatni tanlang",
  PURPOSE_REQUIRED: "Iltimos, variantlardan birini tanlang",
  GENDER_REQUIRED: "Iltimos, variantlardan birini tanlang",
  ONBOARDING_FAILED: "Javoblarni saqlab bo'lmadi. Qaytadan urinib ko'ring",
  AUTH_REQUIRED: "Davom etish uchun hisobingizga kiring",
  NOT_FOUND: "Topilmadi",
  SERVER_ERROR: "Xatolik yuz berdi. Qaytadan urinib ko'ring",
  NETWORK_ERROR: "Serverga ulanib bo'lmadi. Internetni tekshiring",

  phoneIncomplete: "Telefon raqamini to'liq kiriting",
  otpIncomplete: "4 xonali kodni kiriting",
  confirm: "Tasdiqlash",
  otpLabel: "Telegramdagi Verification Codes botidan kelgan 4 xonali kodni kiriting",
  otpResend: "Kodni qayta yuborish",
  otpResendIn: "Yangi kodni {n} soniyadan keyin yuborish mumkin",
  otpTestMode: "Test rejimi (Telegram Gateway token yo'q): kod {code}",
  nameQuestion: "Ismingiz nima?",
  namePlaceholder: "Ismingizni kiriting",
  usernameQuestion: "O'zingizga username tanlang",
  usernamePlaceholder: "username (kamida 5 ta belgi)",
  usernameHint: "Kamida 5 ta belgi. Faqat lotin harflari, raqamlar, _ va . ishlatilishi mumkin.",
  ageExample: "Misol uchun: 18, 22, 25",
  googleCancelled: "Google orqali kirish bekor qilindi yoki xatolik yuz berdi",
};

const ru: Dict = {
  NAME_REQUIRED: "Пожалуйста, введите ваше имя",
  EMAIL_INVALID: "Пожалуйста, введите корректный email",
  PASSWORD_SHORT: "Пароль должен содержать не менее 6 символов",
  EMAIL_TAKEN: "Этот email уже зарегистрирован",
  REGISTER_FAILED: "Не удалось зарегистрироваться. Попробуйте ещё раз",
  PHONE_INVALID: "Пожалуйста, введите корректный номер телефона",
  PHONE_TAKEN: "Этот номер телефона уже зарегистрирован",
  GOOGLE_EMAIL_INVALID: "Требуется корректный Google email",
  GOOGLE_CREDENTIAL_INVALID: "Не удалось подтвердить вход через Google",
  GOOGLE_TOKEN_UNVERIFIED: "Не удалось проверить ваш аккаунт Google",
  GOOGLE_FAILED: "Ошибка входа через Google. Попробуйте ещё раз",
  CREDENTIALS_REQUIRED: "Пожалуйста, введите email и пароль",
  EMAIL_WRONG: "Неверный email",
  PASSWORD_WRONG: "Неверный пароль",
  GOOGLE_ACCOUNT: "Этот аккаунт создан через Google. Войдите через Google",
  LOGIN_FAILED: "Не удалось войти. Попробуйте ещё раз",
  OTP_WAIT: "Подождите {n} сек. перед запросом нового кода",
  OTP_SEND_FAILED: "Не удалось отправить код. Попробуйте ещё раз",
  OTP_NO_BALANCE: "Сервис отправки кодов временно недоступен. Попробуйте позже",
  OTP_NOT_ON_TELEGRAM: "Этот номер не зарегистрирован в Telegram, код отправить нельзя",
  OTP_EXPIRED: "Срок действия кода истёк. Запросите новый",
  OTP_TOO_MANY: "Слишком много попыток. Запросите новый код",
  OTP_WRONG: "Неверный код",
  VERIFY_FAILED: "Ошибка подтверждения. Попробуйте ещё раз",
  AGE_INVALID: "Пожалуйста, введите корректный возраст",
  NAME_INVALID: "Пожалуйста, введите ваше имя",
  USERNAME_TOO_SHORT: "Имя пользователя должно содержать минимум 5 символов",
  USERNAME_INVALID: "Имя пользователя может содержать только буквы, цифры, _ и .",
  USERNAME_TAKEN: "Это имя пользователя уже занято, выберите другое",
  PHONE_NOT_REGISTERED: "Этот номер телефона не зарегистрирован",
  COUNTRY_REQUIRED: "Пожалуйста, выберите страну",
  PURPOSE_REQUIRED: "Пожалуйста, выберите вариант",
  GENDER_REQUIRED: "Пожалуйста, выберите вариант",
  ONBOARDING_FAILED: "Не удалось сохранить ответы. Попробуйте ещё раз",
  AUTH_REQUIRED: "Войдите, чтобы продолжить",
  NOT_FOUND: "Не найдено",
  SERVER_ERROR: "Что-то пошло не так. Попробуйте ещё раз",
  NETWORK_ERROR: "Нет соединения с сервером. Проверьте интернет",

  phoneIncomplete: "Введите номер телефона полностью",
  otpIncomplete: "Введите 4-значный код",
  confirm: "Подтвердить",
  otpLabel: "Введите 4-значный код от бота Telegram Verification Codes",
  otpResend: "Отправить код ещё раз",
  otpResendIn: "Новый код можно запросить через {n} сек.",
  otpTestMode: "Тестовый режим (нет токена Telegram Gateway): код {code}",
  nameQuestion: "Как вас зовут?",
  namePlaceholder: "Введите ваше имя",
  usernameQuestion: "Выберите уникальное имя пользователя (username)",
  usernamePlaceholder: "username (минимум 5 символов)",
  usernameHint: "Минимум 5 символов. Разрешены латинские буквы, цифры, _ и .",
  ageExample: "Например: 18, 22, 25",
  googleCancelled: "Вход через Google отменён или произошла ошибка",
};

const MESSAGES: Record<string, Dict> = { en, uz, ru };

export type { MsgKey };

/** Translation helpers bound to the language currently selected on the site. */
export function useMessages() {
  const { lang } = useLanguage();
  const dict = MESSAGES[lang] ?? en;

  /** Plain message, with `{name}` placeholders filled from `vars`. */
  function m(key: MsgKey, vars?: Record<string, string | number>): string {
    let text = dict[key] ?? en[key];
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  }

  /** Turns anything thrown by an API call into text in the selected language. */
  function errorText(err: unknown): string {
    if (err instanceof ApiError) {
      const code = err.code as MsgKey | undefined;
      let text: string;
      if (code && code in en) {
        text = m(code, err.retryAfter != null ? { n: err.retryAfter } : undefined);
      } else {
        text = m("SERVER_ERROR");
      }
      /* In development, also show the raw reason (e.g. from Telegram Gateway). */
      if (import.meta.env.DEV && err.detail) text += ` [${err.detail}]`;
      return text;
    }
    if (err instanceof TypeError) return m("NETWORK_ERROR"); // fetch failed
    return m("SERVER_ERROR");
  }

  return { m, errorText };
}
