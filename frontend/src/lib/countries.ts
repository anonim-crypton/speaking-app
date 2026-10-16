/**
 * Country data for the region picker.
 *
 * Names come from the built-in `Intl.DisplayNames`, so they are automatically
 * localised into whichever of the 24 UI languages is active — no giant
 * translation table needed.
 */

/** ISO 3166-1 alpha-2 codes. */
export const COUNTRY_CODES: string[] =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " "
  );

/** Countries whose sign-up flow is a phone number only (only Uzbekistan). */
export const PHONE_ONLY_COUNTRIES = new Set(["UZ"]);

/** Dialling codes used by the phone-only flow. */
export const DIAL_CODES: Record<string, string> = {
  UZ: "+998",
};

const nameCache = new Map<string, Intl.DisplayNames | null>();

/**
 * Localised country name, e.g. countryName("UZ", "uz") → "Oʻzbekiston".
 * Falls back to the raw code when the runtime has no Intl.DisplayNames.
 */
export function countryName(code: string, locale = "en"): string {
  const upper = code.toUpperCase();
  try {
    let display = nameCache.get(locale);
    if (display === undefined) {
      display = new Intl.DisplayNames([locale], { type: "region" });
      nameCache.set(locale, display);
    }
    return display?.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

/** Flag image URL (flagcdn). Rendered through <CountryFlag /> so a failure degrades gracefully. */
export function flagUrl(code: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

/** Case- and accent-insensitive search across code + localised + English name. */
export function matchesQuery(code: string, query: string, locale: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (code.toLowerCase().includes(q)) return true;
  if (countryName(code, locale).toLowerCase().includes(q)) return true;
  if (countryName(code, "en").toLowerCase().includes(q)) return true;
  return false;
}
