import { LANGS } from "./translations";

/**
 * Detects the best UI language for this device, before the first paint.
 *
 * Signals, in order of confidence:
 *   1. the device/browser locale  (`navigator.languages`, `navigator.language`)
 *   2. the device time zone       (→ country → language)
 *   3. English
 *
 * No permission prompt and no network request are involved, so the language is
 * already correct on the very first render — the user never sees a flash of the
 * wrong language.
 */

/** Country (ISO 3166-1 alpha-2) → one of our supported language codes. */
const COUNTRY_TO_LANG: Record<string, string> = {
  // Uzbek
  UZ: "uz",
  // English
  GB: "en", US: "en", AU: "en", CA: "en", NZ: "en", IE: "en", SG: "en", ZA: "en",
  NG: "en", KE: "en", PH: "en", PK: "en",
  // Russian
  RU: "ru", BY: "ru",
  // Turkish
  TR: "tr", CY: "tr",
  // German
  DE: "de", AT: "de", CH: "de", LI: "de",
  // French
  FR: "fr", BE: "fr", MC: "fr", SN: "fr", CI: "fr", CM: "fr",
  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", UY: "es",
  // Italian
  IT: "it", SM: "it",
  // Portuguese
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  // Arabic
  SA: "ar", AE: "ar", EG: "ar", DZ: "ar", MA: "ar", TN: "ar", LY: "ar", IQ: "ar",
  JO: "ar", KW: "ar", QA: "ar", BH: "ar", OM: "ar", YE: "ar", SY: "ar", LB: "ar",
  SD: "ar",
  // Persian
  IR: "fa", AF: "fa",
  // Chinese
  CN: "zh", TW: "zh", HK: "zh", MO: "zh",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko", KP: "ko",
  // Hindi
  IN: "hi", NP: "hi",
  // Kazakh
  KZ: "kk",
  // Kyrgyz
  KG: "ky",
  // Tajik
  TJ: "tg",
  // Turkmen
  TM: "tk",
  // Azerbaijani
  AZ: "az",
  // Dutch
  NL: "nl", SR: "nl",
  // Polish
  PL: "pl",
  // Ukrainian
  UA: "uk",
  // Indonesian
  ID: "id", MY: "id",
};

/** Time-zone city → country, used when the locale is not conclusive. */
const TZ_CITY_TO_COUNTRY: Record<string, string> = {
  Tashkent: "UZ", Samarkand: "UZ",
  London: "GB", Dublin: "IE", Lisbon: "PT",
  Moscow: "RU", Minsk: "RU",
  Istanbul: "TR", Baku: "AZ",
  Berlin: "DE", Vienna: "DE", Zurich: "DE", Amsterdam: "NL", Brussels: "FR",
  Paris: "FR", Madrid: "ES", Rome: "IT", Warsaw: "PL",
  Riyadh: "SA", Dubai: "AE", Cairo: "EG", Tehran: "IR",
  Shanghai: "CN", Chongqing: "CN", Hong_Kong: "CN", Taipei: "CN", Macau: "CN",
  Tokyo: "JP", Seoul: "KR", Pyongyang: "KR",
  Kolkata: "IN", Calcutta: "IN", Kathmandu: "IN",
  Almaty: "KZ", Bishkek: "KY", Dushanbe: "TJ", Ashgabat: "TM",
  Jakarta: "ID", Kuala_Lumpur: "ID",
  Sao_Paulo: "BR", Buenos_Aires: "ES", Mexico_City: "ES",
  New_York: "US", Chicago: "US", Denver: "US", Los_Angeles: "US", Phoenix: "US",
};

const SUPPORTED = new Set(LANGS.map((l) => l.code));

function isSupported(code?: string | null): code is string {
  return !!code && SUPPORTED.has(code);
}

/** "zh-Hans-CN" → { lang: "zh", region: "CN" } */
function splitTag(tag: string): { lang: string; region?: string } {
  const parts = tag.replace(/_/g, "-").split("-");
  const lang = (parts[0] || "").toLowerCase();
  const region = parts
    .slice(1)
    .find((p) => /^[A-Za-z]{2}$/.test(p))
    ?.toUpperCase();
  return { lang, region };
}

function fromLocale(): string | null {
  const tags: string[] = [];
  try {
    if (typeof navigator === "undefined") return null;
    if (Array.isArray(navigator.languages)) tags.push(...navigator.languages);
    if (navigator.language) tags.push(navigator.language);
  } catch {
    return null;
  }

  for (const tag of tags) {
    const { lang, region } = splitTag(tag);
    if (isSupported(lang)) return lang;
    const byRegion = region ? COUNTRY_TO_LANG[region] : undefined;
    if (isSupported(byRegion)) return byRegion;
  }
  return null;
}

function fromTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const city = tz.split("/").pop() || "";
    const country = TZ_CITY_TO_COUNTRY[city];
    const byCountry = country ? COUNTRY_TO_LANG[country] : undefined;
    return isSupported(byCountry) ? byCountry : null;
  } catch {
    return null;
  }
}

/** Best supported language code for this device. Never throws. */
export function detectLanguage(): string {
  return fromLocale() ?? fromTimeZone() ?? "en";
}

/** True when the language is written right-to-left. */
export function isRtl(code: string): boolean {
  return code === "ar" || code === "fa";
}
