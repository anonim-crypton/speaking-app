import type { Translation } from "@/i18n/types";

import ar from "./ar";
import az from "./az";
import de from "./de";
import es from "./es";
import fa from "./fa";
import fr from "./fr";
import hi from "./hi";
import id from "./id";
import it from "./it";
import ja from "./ja";
import kk from "./kk";
import ko from "./ko";
import ky from "./ky";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import tg from "./tg";
import tk from "./tk";
import tr from "./tr";
import uk from "./uk";
import zh from "./zh";

/**
 * Languages added on top of the three built-in ones (en/uz/ru) that live in
 * `../translations`. Every entry is a full translation of the same shape.
 */
const locales: Record<string, Translation> = {
  ar,
  az,
  de,
  es,
  fa,
  fr,
  hi,
  id,
  it,
  ja,
  kk,
  ko,
  ky,
  nl,
  pl,
  pt,
  tg,
  tk,
  tr,
  uk,
  zh,
};

export default locales;
