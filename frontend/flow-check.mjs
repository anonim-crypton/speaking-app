/**
 * Runtime verification of the region-aware auth flow, the Google button,
 * the onboarding route chrome and the account menu.
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SRC = path.join(process.cwd(), "src");
const OUT = path.join(process.cwd(), ".flow-check");
fs.rmSync(OUT, { recursive: true, force: true });

const files = [];
(function walk(d) {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(n) && !n.endsWith(".d.ts")) files.push(p);
  }
})(SRC);

const outOf = (f) => path.join(OUT, path.relative(SRC, f).replace(/\.(ts|tsx)$/, ".js"));

function resolve(spec, from) {
  if (spec.endsWith(".css")) return "./__css.js";
  let base = null;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  if (!base) return null;
  const found = [
    base,
    base + ".ts",
    base + ".tsx",
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ].find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  if (!found) throw new Error(`unresolved "${spec}" in ${from}`);
  let rel = path.relative(path.dirname(outOf(from)), outOf(found)).replace(/\\/g, "/");
  return rel.startsWith(".") ? rel : "./" + rel;
}

for (const f of files) {
  const { outputText } = ts.transpileModule(fs.readFileSync(f, "utf8"), {
    fileName: f,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      isolatedModules: true,
    },
  });
  const code = outputText.replace(
    /(\bfrom\s*)(["'])([^"']+)(\2)|(\bimport\s*)(["'])([^"']+)(\6)/g,
    (m, k1, q1, s1, _a, k2, q2, s2) => {
      const kw = k1 ?? k2;
      const q = q1 ?? q2;
      const r = resolve(s1 ?? s2, f);
      return r ? `${kw}${q}${r}${q}` : m;
    }
  );
  fs.mkdirSync(path.dirname(outOf(f)), { recursive: true });
  fs.writeFileSync(outOf(f), code, "utf8");
}
fs.writeFileSync(path.join(OUT, "package.json"), JSON.stringify({ type: "module" }));
fs.writeFileSync(path.join(OUT, "__css.js"), "export default {};");

const React = (await import("react")).default;
const { renderToStaticMarkup } = await import("react-dom/server");
const { MemoryRouter } = await import("react-router-dom");
const load = (r) => import(pathToFileURL(path.join(OUT, r)).href);

const { LanguageProvider } = await load("context/LanguageContext.js");
const { RegionProvider } = await load("context/RegionContext.js");
const { AuthProvider } = await load("context/AuthContext.js");
const Register = (await load("pages/Register.js")).default;
const Login = (await load("pages/Login.js")).default;
const App = (await load("App.js")).default;
const AccountMenu = (await load("components/AccountMenu.js")).default;
const e = React.createElement;

let failures = 0;
const check = (l, c, x = "") => {
  if (!c) failures++;
  console.log(`  ${c ? "OK  " : "FAIL"} ${l}${x ? "  " + x : ""}`);
};

/** Render with a forced locale + time zone so the region is deterministic. */
function renderWithZone(node, { lang, tz, route = "/register" }) {
  Object.defineProperty(globalThis, "navigator", {
    value: { language: lang, languages: [lang] },
    configurable: true,
    writable: true,
  });
  globalThis.localStorage = {
    _s: {},
    getItem(k) {
      return k in this._s ? this._s[k] : null;
    },
    setItem(k, v) {
      this._s[k] = String(v);
    },
    removeItem(k) {
      delete this._s[k];
    },
  };
  const RealDTF = Intl.DateTimeFormat;
  Object.defineProperty(Intl, "DateTimeFormat", {
    configurable: true,
    writable: true,
    value: function (...args) {
      if (args.length === 0) return { resolvedOptions: () => ({ timeZone: tz }) };
      return new RealDTF(...args);
    },
  });
  try {
    return renderToStaticMarkup(
      e(
        MemoryRouter,
        { initialEntries: [route] },
        e(
          LanguageProvider,
          null,
          e(RegionProvider, null, e(AuthProvider, null, node))
        )
      )
    );
  } finally {
    Object.defineProperty(Intl, "DateTimeFormat", {
      configurable: true,
      writable: true,
      value: RealDTF,
    });
  }
}

/* ── 1. Phone-only regions ── */
console.log("\n[Uzbekistan / Kazakhstan → phone number only]");
for (const [label, opts] of [
  ["UZ (Asia/Tashkent)", { lang: "uz-UZ", tz: "Asia/Tashkent" }],
  ["KZ (Asia/Almaty)", { lang: "kk-KZ", tz: "Asia/Almaty" }],
]) {
  const html = renderWithZone(e(Register), opts);
  const phoneOnlyFields =
    html.includes('id="reg-phone"') &&
    !html.includes('id="reg-name"') &&
    !html.includes('id="reg-email"') &&
    !html.includes('id="reg-password"');
  check(`${label}: only the phone input is shown`, phoneOnlyFields);
  check(`${label}: dial code rendered`, html.includes("+998") || html.includes("+7"));
  check(`${label}: hr + Google button present`, html.includes("<hr") || html.includes("Continue with Google"));
  check(`${label}: "or" divider present`, html.includes(">yoki<") || html.includes(">or<"));
}

/* ── 2. Everywhere else ── */
console.log("\n[other regions → name / email / password]");
for (const [label, opts] of [
  ["US (America/New_York)", { lang: "en-US", tz: "America/New_York" }],
  ["DE (Europe/Berlin)", { lang: "de-DE", tz: "Europe/Berlin" }],
]) {
  const html = renderWithZone(e(Register), opts);
  const fullForm =
    html.includes('id="reg-name"') &&
    html.includes('id="reg-email"') &&
    html.includes('id="reg-password"') &&
    !html.includes('id="reg-phone"');
  check(`${label}: name, email and password are shown`, fullForm);
  check(`${label}: hr + Google button present`, html.includes("Continue with Google"));
}

/* ── 3. Auth pages cleaned up ── */
console.log("\n[login / register chrome]");
const regHtml = renderWithZone(e(Register), { lang: "en-US", tz: "America/New_York" });
const loginHtml = renderWithZone(e(Login), { lang: "en-US", tz: "America/New_York" });
for (const [label, html] of [["register", regHtml], ["login", loginHtml]]) {
  check(`${label}: no "Back to home" link`, !html.includes("Back to home") && !html.includes("auth-back"));
  check(`${label}: no logo inside the card`, !html.includes("lucide-audio-lines"));
}

/* ── 4. Onboarding route hides the site chrome ── */
console.log("\n[onboarding route]");
const onboardingApp = renderWithZone(e(App), {
  lang: "en-US",
  tz: "America/New_York",
  route: "/onboarding",
});
check("no navbar on /onboarding", !onboardingApp.includes(">Practice<"));
check("no footer on /onboarding", !onboardingApp.includes("Speak. Learn. Connect. Grow."));

const homeApp = renderWithZone(e(App), {
  lang: "en-US",
  tz: "America/New_York",
  route: "/",
});
check("navbar still present on /", homeApp.includes(">Practice<"));

/* ── 5. Account menu ── */
console.log("\n[account menu]");
const menu = renderWithZone(e(AccountMenu), { lang: "en-US", tz: "America/New_York" });
check("renders a trigger", menu.includes("<button"));
check("shows the default speaker avatar", menu.includes("<svg"));
const menuSrc = fs.readFileSync(path.join(SRC, "components/AccountMenu.tsx"), "utf8");
for (const key of [
  "diamonds",
  "profile",
  "friends",
  "history",
  "help",
  "settings",
  "complaints",
  "contactAdmin",
]) {
  check(`menu includes "${key}"`, menuSrc.includes(`t.account.${key}`));
}
check("menu includes logout", menuSrc.includes("logout"));

/* ── 6. Navbar swaps the pill for the account chip ── */
console.log("\n[navbar]");
const navSrc = fs.readFileSync(path.join(SRC, "components", "Navbar.tsx"), "utf8");
check("uses AccountMenu when signed in", navSrc.includes("<AccountMenu />"));
check("uses AuthToggle when signed out", navSrc.includes("<AuthToggle"));

console.log(failures === 0 ? "\nAUTH FLOW: ALL CHECKS PASSED" : `\nAUTH FLOW: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
