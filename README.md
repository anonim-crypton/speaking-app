# 🎙️ Lingo Speek

**Lingo Speek** — jonli suhbat orqali ingliz tilida gapirishni mashq qilish uchun to'liq (full-stack) veb-sayt.
Dizayn: neon-binafsha (violet) landing page, **shadcn/ui** uslubida.

- **Frontend:** React **19** + **TypeScript (.tsx)** + **Vite 6** + **Tailwind CSS 3** + **shadcn/ui** (Radix UI) + `lucide-react`
- **Backend:** Node.js + **Express** (JWT + bcrypt auth)
- **Tillar:** 24 ta til (to'liq tarjima: English / O'zbekcha / Русский, qolganlari ingliz tiliga qaytadi)
- **Rejim:** **Dark** (neon) — tema almashtirish tugmasi olib tashlangan

## ✨ Bo'limlar (landing page)

| Bo'lim | Tavsif |
|---|---|
| **Navbar** | Logo, pill-nav (**Home → Practice → Community → About**), **24 tilli** bayroqli dropdown, **Login** va **Register** "activity" tugmalari |
| **Hero** | "Welcome to **Lingo Speek**" + sarlavha, tavsif, `Start Speaking` / `Join Community`, 3 ta afzallik, va **jonli ilova mockup**'i (sidebar + video + ishtirokchilar + reaksiya pufakchalari) |
| **Feature cards** (`#practice`) | 4 ta karta: Live Speaking Rooms, AI Feedback, Daily Practice, Global Community |
| **Stats bar** (`#stats`) | 10K+ Active Learners · 500+ Speaking Rooms · 24/7 Practice · 4.9/5 Rating |
| **Popular Speaking Rooms** (`#community`) | 4 ta xona kartasi (rasm, LIVE belgisi, ishtirokchilar soni, teglar, avatar stack) |
| **CTA banner** (`#about`) | "Be part of a global community" + rasm + `Create Your Account` + qo'lda yozilgan yozuv |
| **Footer** | Logo, ijtimoiy tarmoqlar, 4 ta link ustuni, newsletter formasi, pastki qator |

> **Login** va **Register** sahifalari: faqat **navbar** + karta + **footer**.
> Sahifa bo'limlari tartibi navbarcha tartibiga **aynan mos** — scroll qilganda aktiv tugma sakramaydi.

## 🔘 Login / Register — bitta pill, bitta "activity" indikator

Ikkala so'z ham **bitta umumiy background** (segmentli pill) ichida turadi va faqat **bitta**
harakatlanuvchi indikator bor:

1. Konteyner — bitta yumaloq, `border`li pill; Login va Register teng ikki bo'lak (`grid-cols-2`),
2. Bosilgan bo'lak ostiga **binafsha gradient indikator** silliq suriladi
   (`transition-all duration-500 ease-out` + `translateX(0% | 100%)`),
3. Indikator borib **1 sekunddan keyin** tegishli sahifaga o'tadi,
4. Indikator qaysi sahifada turganingizga qarab o'sha yerda turadi — Login sahifasida
   **Login** ustida, Register sahifasida **Register** ustida.

Komponent: [`src/components/AuthToggle.tsx`](<frontend/src/components/AuthToggle.tsx>) — `block` propi bilan
mobil menyuda ham ishlatiladi (to'liq kenglikda).

> Eski "sweep + progress chizig'i" dizayni (`NavActionButton`) butunlay olib tashlandi.

## 🎵 Logo animatsiyasi

Logodagi oq to'lqin ikonkasi (lucide `AudioLines`) **aynan o'sha ko'rinishda** qoldirilgan —
6 ta vertikal chiziq (x = 2, 6, 10, 14, 18, 22), xuddi shu stroke va yumaloq uchlari bilan.
Faqat endi har bir chiziq **alohida** harakatlanadi:

- `AnimatedWaveIcon` — 6 ta chiziqni alohida `<path>` qilib chizadi (ikonka dizayni o'zgarmagan),
- har biri o'z markazi atrofida `scaleY` bilan **tepa-pastga** tebranadi — xuddi gapirgandek,
- har biriga alohida **davomiylik** va **manfiy kechikish** berilgan, shuning uchun ular bir xilda emas, tabiiy to'lqin hosil qilib harakatlanadi,
- `prefers-reduced-motion` yoqilgan bo'lsa animatsiya o'chadi.

CSS: `src/index.css` dagi `.wave-bar` klassi + `@keyframes waveBar`
(`transform-box: fill-box` tufayli har bir chiziq o'z markazi atrofida aylanadi).

## ⏳ Yuklash animatsiyasi (tarmoqqa moslashuvchi)

Saytga kirganda **va har bir sahifadan sahifaga o'tishda** yuklash animatsiyasi ko'rsatiladi.

**Dizayn** — siz bergan `.webm` faylning **o'zi** ishlatiladi (`frontend/public/loading.webm`),
shuning uchun ko'rinish 100% bir xil:

- VP8 · **150 × 150** · **shaffof fon** (`AlphaMode=1`) → neon fon bilan mukammal qo'shiladi
- 4 sekundlik loop, atigi **80 KB**
- `<video autoPlay loop muted playsInline>` bilan o'ynatiladi
- VP8 alpha'ni qo'llab-quvvatlamaydigan brauzerlar uchun **CSS zaxira** bor — xuddi shu to'lqin chiziqlar

**Vaqti tarmoq tezligiga bog'liq** — oddiy qat'iy taymer emas:

1. Sahifa ochilishi bilan haqiqiy **ping (RTT)** o'lchanadi: `/api/health` va `/favicon.svg` ga
   `cache: "no-store"` so'rov yuborilib, vaqt o'lchanadi (2 namuna → **median**, tasodifiy
   sekinlashuvlarni tashlab yuboradi).
2. So'rovlar ishlamasa — `navigator.connection.rtt` (Network Information API), keyin
   `performance` navigation timing, aks holda neytral 250 ms.
3. Ko'rsatish vaqti shu RTT dan hisoblanadi:

| Ping (RTT) | Birinchi kirish | Sahifa almashish |
|---|---|---|
| 40 ms | ~850 ms | ~420 ms |
| 250 ms | ~1075 ms | ~450 ms |
| 900 ms | ~2180 ms | ~840 ms |
| 3000 ms | ~2600 ms (chegara) | ~1100 ms (chegara) |

```
initial = clamp(650 + rtt × 1.7, 850, 2600)   // ms
route   = clamp(300 + rtt × 0.6, 420, 1100)   // ms
```

Ya'ni **sekin internetda animatsiya uzoqroq davom etadi**, tez internetda deyarli sezilmaydi.
Animatsiya yo'qolishdan oldin 550 ms davomida sekin so'nadi (keskin yo'qolmaydi).

Fayllar: [`src/lib/network.ts`](<frontend/src/lib/network.ts>) ·
[`src/components/LoadingScreen.tsx`](<frontend/src/components/LoadingScreen.tsx>) ·
ulanish: [`src/App.tsx`](<frontend/src/App.tsx>)

## 🚩 Tillar (24 ta — hammasi to'liq tarjima qilingan)

Dropdownda **24 ta til** bor va **har biri uchun saytning barcha matni tarjima qilingan**
(nav, hero, ilova mockup'i, feature kartalar, statistika, xonalar, CTA, footer,
login/register sahifalari, kabinet). Har bir til **inline SVG bayroq** bilan ko'rsatiladi — emoji yo'q.

| Kod | Til | Kod | Til | Kod | Til |
|---|---|---|---|---|---|
| `uz` | O'zbekcha | `tr` | Türkçe | `ar` | العربية |
| `en` | English | `de` | Deutsch | `fa` | فارسی |
| `ru` | Русский | `fr` | Français | `zh` | 中文 |
| `es` | Español | `it` | Italiano | `ja` | 日本語 |
| `pt` | Português | `nl` | Nederlands | `ko` | 한국어 |
| `pl` | Polski | `uk` | Українська | `hi` | हिन्दी |
| `az` | Azərbaycan | `kk` | Қазақша | `ky` | Кыргызча |
| `tg` | Тоҷикӣ | `tk` | Türkmençe | `id` | Bahasa Indonesia |

Tuzilish: `src/i18n/locales/*.ts` — har bir til uchun bitta fayl; `en`/`uz`/`ru` esa
`src/i18n/translations.ts` ichida. Har bir fayl `Translation` tipiga bog'langan
(`const xx: Translation = {...}`), shuning uchun biror kalit yetishmasa yoki ortiqcha bo'lsa
**TypeScript compile xatosi beradi**.

Til tugmasidagi ikonka — lucide `Languages` (globus emas).
Bayroq SVG'siga inline `width/height` berilgan, chunki shadcn `Button`'ning
`[&_svg]:size-*` qoidasi aks holda bayroqni siqib, ramkada bo'sh joy qoldirardi.

## 🌍 Til qurilma joylashuviga qarab avtomatik tanlanadi

Sayt ochilishida til **foydalanuvchi hech narsa qilmasidan oldin** — birinchi renderda
(`useState` ichida, effektda emas) aniqlanadi. Shuning uchun noto'g'ri til "miltillab"
ko'rinmaydi va til saytga kirishdan oldin tanlangan bo'ladi.

Aniqlash tartibi:

1. **Foydalanuvchi tanlagan til** (`localStorage`) — avval qo'lda tanlagan bo'lsa, o'sha ustuvor.
2. **Qurilma tili** — `navigator.languages` / `navigator.language`
   (masalan `en-US` → English, `uz-UZ` → O'zbekcha, `de-AT` → Deutsch).
   Bu eng ishonchli signal va **hech qanday ruxsat so'ramaydi**.
3. **Qurilma vaqt zonasi** — `Intl.DateTimeFormat().resolvedOptions().timeZone`
   (masalan `America/New_York` → English, `Asia/Tashkent` → O'zbekcha, `Europe/Berlin` → Deutsch).
4. Aks holda — **English**.

`<html lang="...">` ham tanlangan tilga moslanadi (ekran o'quvchilar, defis va shriftlar uchun).
Butun mantiq: [`src/i18n/detect.ts`](<frontend/src/i18n/detect.ts>).

## 🎬 Animatsiyalar

Har bir bo'lim `IntersectionObserver` (`useReveal` hook + `<Reveal>` komponenti) orqali:

- pastga scroll qilganda **sekin ochiladi** (fade + slide/zoom),
- tepaga qaytganda **yana sekin yashirinadi**.

`prefers-reduced-motion` qo'llab-quvvatlanadi.

## 📁 Tuzilish

```
Speaking-app/
├── backend/                    # Express API
│   ├── server.js
│   ├── routes/auth.js          # register / login / me
│   ├── middleware/auth.js      # JWT himoyasi
│   ├── utils/store.js          # foydalanuvchilar (JSON fayl + bcrypt)
│   └── .env
├── frontend/                   # React 19 + TS + shadcn/ui
│   ├── components.json         # shadcn sozlamasi
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts          # "@" -> ./src  +  /api proxy
│   ├── preview/                # statik HTML ko'rinishlar
│   └── src/
│       ├── components/
│       │   ├── ui/             # shadcn: button, card, badge, input,
│       │   │                   #   avatar, separator, dropdown-menu, sheet
│       │   ├── Navbar.tsx      AuthToggle.tsx        LanguageSwitcher.tsx
│       │   ├── Flag.tsx        AnimatedWaveIcon.tsx  LoadingScreen.tsx
│       │   ├── Hero.tsx        AppMockup.tsx         FeatureGrid.tsx
│       │   ├── StatsBar.tsx    PopularRooms.tsx      CtaBanner.tsx
│       │   └── SiteFooter.tsx  Reveal.tsx  Logo.tsx  SmartImage.tsx  AuthShell.tsx
│       ├── context/            # Language, Auth
│       ├── hooks/useReveal.ts
│       ├── i18n/
│       │   ├── translations.ts # Translation tipi + en/uz/ru + LANGS (24 til) + BRAND
│       │   ├── detect.ts       # tilni qurilma tili/vaqt zonasidan aniqlash
│       │   ├── types.ts        # umumiy tiplar
│       │   └── locales/        # 21 ta til fayli: de/fr/es/it/pt/nl/pl/uk/az/
│       │                       #   tr/kk/ky/tg/tk/id/ar/fa/hi/zh/ja/ko
│       ├── lib/                # utils.ts, api.ts, assets.ts, network.ts
│       └── pages/              # Home, Login, Register, Dashboard
└── package.json                # ikkalasini birga ishga tushirish
```

## 🚀 Ishga tushirish

```bash
npm run install:all   # backend + frontend bog'liqliklari
npm run dev           # ikkalasini birga
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

Alohida:

```bash
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

## 🔑 API

| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/api/auth/register` | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | Kirish |
| GET | `/api/auth/me` | Joriy foydalanuvchi (JWT) |
| GET | `/api/health` | Server holati |

Foydalanuvchilar `backend/data/users.json` da saqlanadi (parollar **bcrypt** bilan xeshlangan).

## 🖼️ Rasmlar

Rasmlar internetdan (Unsplash CDN) olinadi va `<SmartImage />` orqali ko'rsatiladi —
agar rasm yuklanmasa, avtomatik binafsha gradient bilan almashtiriladi.
Bayroqlar esa **inline SVG** — hech qanday tashqi so'rov qilmaydi.

## 🎨 Ranglar

- Asosiy: `#7c3aed` → `#a855f7` → `#d946ef` gradient (neon binafsha)
- Fon: `#0d0820` / `#08040f`
- Barcha ranglar `src/index.css` dagi CSS o'zgaruvchilar orqali boshqariladi (shadcn/ui tokenlari).

## ➕ Yangi shadcn komponent qo'shish

```bash
cd frontend
npx shadcn@latest add <component>
```

`components.json` allaqachon sozlangan (`@/components/ui` aliasi bilan).
