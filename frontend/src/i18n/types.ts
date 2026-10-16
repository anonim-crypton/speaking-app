/**
 * Shared i18n types.
 *
 * `Translation` is defined in ./translations and re-exported here so that the
 * per-language locale files can import it without creating a runtime cycle
 * (locale files import the type only, which is erased at compile time).
 */
export type { Translation, LangCode, LangOption } from "./translations";
