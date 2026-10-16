import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiGet } from "@/lib/api";
import { DIAL_CODES, PHONE_ONLY_COUNTRIES } from "@/lib/countries";

export type RegionSource = "server" | "timezone" | "locale" | "unknown";

interface RegionContextValue {
  /** ISO 3166-1 alpha-2 of the visitor, or null when it cannot be determined. */
  country: string | null;
  /** How the country was determined. */
  source: RegionSource;
  /** True while the server-side lookup is still in flight. */
  loading: boolean;
  /** Uzbekistan + Kazakhstan sign up with a phone number only. */
  phoneOnly: boolean;
  /** Dialling prefix for the phone-only flow ("+998" / "+7"). */
  dialCode: string;
  /** Manually override the detected region (used by tests / manual switch). */
  setCountry: (code: string | null) => void;
}

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

/* ── Offline signals ──────────────────────────────────────────────────────
   The server lookup is the accurate one, but it takes a round trip. These
   give an instant first guess so the register form renders correctly at once. */

const TZ_CITY_TO_COUNTRY: Record<string, string> = {
  // Uzbekistan
  Tashkent: "UZ", Samarkand: "UZ",
  // Kazakhstan
  Almaty: "KZ", Aqtobe: "KZ", Aktobe: "KZ", Atyrau: "KZ", Qostanay: "KZ",
  Kostanay: "KZ", Qyzylorda: "KZ", Kyzylorda: "KZ", Oral: "KZ", Ural: "KZ",
  // neighbours / common origins
  Bishkek: "KG", Dushanbe: "TJ", Ashgabat: "TM", Kabul: "AF",
  Moscow: "RU", Minsk: "BY", Kyiv: "UA", Kiev: "UA", Chisinau: "MD",
  Tbilisi: "GE", Yerevan: "AM", Baku: "AZ",
  Istanbul: "TR", Ankara: "TR", Nicosia: "CY",
  Berlin: "DE", Vienna: "AT", Zurich: "CH", Amsterdam: "NL", Brussels: "BE",
  Paris: "FR", Madrid: "ES", Lisbon: "PT", Rome: "IT", Warsaw: "PL",
  Prague: "CZ", Budapest: "HU", Bucharest: "RO", Sofia: "BG", Athens: "GR",
  Stockholm: "SE", Oslo: "NO", Copenhagen: "DK", Helsinki: "FI", Dublin: "IE",
  London: "GB", Reykjavik: "IS", Riga: "LV", Vilnius: "LT", Tallinn: "EE",
  Belgrade: "RS", Zagreb: "HR", Sarajevo: "BA", Skopje: "MK", Tirana: "AL",
  Riyadh: "SA", Jeddah: "SA", Dubai: "AE", Abu_Dhabi: "AE", Doha: "QA",
  Kuwait_City: "KW", Manama: "BH", Muscat: "OM", Cairo: "EG", Alexandria: "EG",
  Baghdad: "IQ", Amman: "JO", Beirut: "LB", Damascus: "SY", Sanaa: "YE",
  Khartoum: "SD", Tripoli: "LY", Tunis: "TN", Algiers: "DZ", Casablanca: "MA",
  Tehran: "IR", Jerusalem: "IL", Tel_Aviv: "IL",
  Karachi: "PK", Lahore: "PK", Islamabad: "PK", Delhi: "IN", Kolkata: "IN",
  Calcutta: "IN", Mumbai: "IN", Dhaka: "BD", Kathmandu: "NP", Colombo: "LK",
  Shanghai: "CN", Beijing: "CN", Chongqing: "CN", Hong_Kong: "HK",
  Taipei: "TW", Macau: "MO", Ulaanbaatar: "MN",
  Tokyo: "JP", Osaka: "JP", Seoul: "KR", Pyongyang: "KP",
  Bangkok: "TH", Hanoi: "VN", Ho_Chi_Minh: "VN", Jakarta: "ID",
  Kuala_Lumpur: "MY", Singapore: "SG", Manila: "PH", Phnom_Penh: "KH",
  Vientiane: "LA", Yangon: "MM", Almaty_Region: "KZ",
  Sydney: "AU", Melbourne: "AU", Brisbane: "AU", Perth: "AU", Auckland: "NZ",
  New_York: "US", Chicago: "US", Denver: "US", Los_Angeles: "US",
  Phoenix: "US", Anchorage: "US", Honolulu: "US", Toronto: "CA",
  Vancouver: "CA", Montreal: "CA", Mexico_City: "MX", Bogota: "CO",
  Lima: "PE", Santiago: "CL", Buenos_Aires: "AR", Sao_Paulo: "BR",
  Rio_de_Janeiro: "BR", Montevideo: "UY", Caracas: "VE", Havana: "CU",
  Lagos: "NG", Accra: "GH", Nairobi: "KE", Addis_Ababa: "ET",
  Johannesburg: "ZA", Cape_Town: "ZA", Kinshasa: "CD",
};

function fromTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const city = tz.split("/").pop() || "";
    return TZ_CITY_TO_COUNTRY[city] ?? null;
  } catch {
    return null;
  }
}

function fromLocale(): string | null {
  try {
    const tag = navigator.language || (navigator.languages && navigator.languages[0]) || "";
    const parts = String(tag).replace(/_/g, "-").split("-");
    const region = parts
      .slice(1)
      .find((p) => /^[A-Za-z]{2}$/.test(p) && !/^[a-z]{2}$/.test(p));
    return region ? region.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const guess = useMemo(() => {
    const tz = fromTimeZone();
    if (tz) return { country: tz, source: "timezone" as RegionSource };
    const locale = fromLocale();
    if (locale) return { country: locale, source: "locale" as RegionSource };
    return { country: null, source: "unknown" as RegionSource };
  }, []);

  const [country, setCountry] = useState<string | null>(guess.country);
  const [source, setSource] = useState<RegionSource>(guess.source);
  const [loading, setLoading] = useState(true);

  /* Refine with the server-side (IP based) lookup. */
  useEffect(() => {
    let cancelled = false;
    apiGet<{ success: boolean; country: string | null }>("/api/geo")
      .then((data) => {
        if (cancelled) return;
        if (data && data.country) {
          setCountry(data.country.toUpperCase());
          setSource("server");
        }
      })
      .catch(() => {
        /* keep the offline guess */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value: RegionContextValue = {
    country,
    source,
    loading,
    phoneOnly: country ? PHONE_ONLY_COUNTRIES.has(country) : false,
    dialCode: country ? DIAL_CODES[country] ?? "" : "",
    setCountry,
  };

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used inside <RegionProvider>");
  return ctx;
}
