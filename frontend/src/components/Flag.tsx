import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight inline SVG flags (30x20 viewBox) — no emoji, no network requests.
 * Deliberately simplified: recognisable at 24x16 px, tiny to ship.
 */
const FLAGS: Record<string, ReactNode> = {
  UZ: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.2" fill="#0099b5" />
      <rect y="13.8" width="30" height="6.2" fill="#1eb53a" />
      <rect y="6.2" width="30" height="0.9" fill="#ce1126" />
      <rect y="12.9" width="30" height="0.9" fill="#ce1126" />
    </>
  ),
  GB: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="1.8" />
      <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth="6.5" />
      <path d="M15 0V20M0 10H30" stroke="#c8102e" strokeWidth="3.6" />
    </>
  ),
  RU: (
    <>
      <rect width="30" height="6.67" fill="#fff" />
      <rect y="6.67" width="30" height="6.66" fill="#0039a6" />
      <rect y="13.33" width="30" height="6.67" fill="#d52b1e" />
    </>
  ),
  TR: (
    <>
      <rect width="30" height="20" fill="#e30a17" />
      <circle cx="11.6" cy="10" r="5" fill="#fff" />
      <circle cx="13.4" cy="10" r="4" fill="#e30a17" />
      <polygon
        fill="#fff"
        points="19.5,7.4 20.08,9.2 21.97,9.2 20.44,10.31 21.03,12.1 19.5,10.99 17.97,12.1 18.56,10.31 17.03,9.2 18.92,9.2"
      />
    </>
  ),
  DE: (
    <>
      <rect width="30" height="6.67" fill="#000" />
      <rect y="6.67" width="30" height="6.66" fill="#dd0000" />
      <rect y="13.33" width="30" height="6.67" fill="#ffce00" />
    </>
  ),
  FR: (
    <>
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ed2939" />
    </>
  ),
  ES: (
    <>
      <rect width="30" height="20" fill="#aa151b" />
      <rect y="5" width="30" height="10" fill="#f1bf00" />
    </>
  ),
  IT: (
    <>
      <rect width="10" height="20" fill="#009246" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ce2b37" />
    </>
  ),
  PT: (
    <>
      <rect width="30" height="20" fill="#da291c" />
      <rect width="12" height="20" fill="#046a38" />
      <circle cx="12" cy="10" r="4.2" fill="#ffe000" />
      <circle cx="12" cy="10" r="2.4" fill="#fff" stroke="#003399" strokeWidth="0.9" />
    </>
  ),
  SA: (
    <>
      <rect width="30" height="20" fill="#006c35" />
      <rect x="5" y="7.6" width="19" height="1.6" rx="0.8" fill="#fff" />
      <path d="M7.5 12.6h15" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M22 11.6l2.4 1.6-2.8.7z" fill="#fff" />
    </>
  ),
  IR: (
    <>
      <rect width="30" height="6.67" fill="#239f40" />
      <rect y="6.67" width="30" height="6.66" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#da0000" />
      <path
        d="M15 7.3c-1.5 1.1-1.5 4.3 0 5.4 1.5-1.1 1.5-4.3 0-5.4z"
        fill="#da0000"
      />
    </>
  ),
  CN: (
    <>
      <rect width="30" height="20" fill="#de2910" />
      <polygon
        fill="#ffde00"
        points="6,3 7.1,6.1 10.3,6.2 7.7,8.1 8.7,11.2 6,9.3 3.3,11.2 4.3,8.1 1.7,6.2 4.9,6.1"
      />
      <circle cx="11.4" cy="3.4" r="0.95" fill="#ffde00" />
      <circle cx="13.6" cy="5.4" r="0.95" fill="#ffde00" />
      <circle cx="13.6" cy="8.2" r="0.95" fill="#ffde00" />
      <circle cx="11.4" cy="10.2" r="0.95" fill="#ffde00" />
    </>
  ),
  JP: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="5.3" fill="#bc002d" />
    </>
  ),
  KR: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="4.3" fill="#0047a0" />
      <path
        d="M15 5.7a4.3 4.3 0 0 1 0 8.6 2.15 2.15 0 0 1 0-4.3 2.15 2.15 0 0 0 0-4.3z"
        fill="#cd2e3a"
      />
      <g stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round">
        <path d="M5.6 6.6l3 2.1M5.6 8.7l3 2.1" />
        <path d="M21.4 11.3l3 2.1M21.4 13.4l3 2.1" />
      </g>
    </>
  ),
  IN: (
    <>
      <rect width="30" height="6.67" fill="#ff9933" />
      <rect y="6.67" width="30" height="6.66" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.2" fill="none" stroke="#000080" strokeWidth="0.8" />
      <circle cx="15" cy="10" r="0.55" fill="#000080" />
    </>
  ),
  KZ: (
    <>
      <rect width="30" height="20" fill="#00afca" />
      <circle cx="15" cy="10" r="3" fill="#fec50c" />
      <g stroke="#fec50c" strokeWidth="0.75" strokeLinecap="round">
        <path d="M15 5v-1.4M15 15v1.4M20 10h1.4M8.6 10H10M18.6 6.4l1-1M11.4 13.6l-1 1M18.6 13.6l1 1M11.4 6.4l-1-1" />
      </g>
    </>
  ),
  KG: (
    <>
      <rect width="30" height="20" fill="#e8112d" />
      <circle cx="15" cy="10" r="3.2" fill="#ffe259" />
      <g stroke="#e8112d" strokeWidth="0.7">
        <path d="M15 7.2v5.6M12.4 8.6l5.2 2.8M12.4 11.4l5.2-2.8" />
      </g>
    </>
  ),
  TJ: (
    <>
      <rect width="30" height="20" fill="#cc0000" />
      <rect y="6.9" width="30" height="6.2" fill="#fff" />
      <rect y="13.1" width="30" height="6.9" fill="#006600" />
      <path d="M12.6 9.6h4.8l-.7 1.3h-3.4z" fill="#f8c300" />
      <circle cx="15" cy="8.4" r="0.7" fill="#f8c300" />
    </>
  ),
  TM: (
    <>
      <rect width="30" height="20" fill="#00843d" />
      <circle cx="11.6" cy="7.4" r="2.6" fill="#fff" />
      <circle cx="12.6" cy="7.4" r="2.2" fill="#00843d" />
      <polygon
        fill="#fff"
        points="17.4,5 17.8,6.2 19.1,6.2 18,7 18.4,8.2 17.4,7.4 16.4,8.2 16.8,7 15.7,6.2 17,6.2"
      />
      <rect x="4" y="12.4" width="22" height="3.4" fill="#d22630" />
      <g stroke="#f9e547" strokeWidth="0.5">
        <path d="M6.5 12.4v3.4M9 12.4v3.4M11.5 12.4v3.4M14 12.4v3.4M16.5 12.4v3.4M19 12.4v3.4M21.5 12.4v3.4" />
      </g>
    </>
  ),
  AZ: (
    <>
      <rect width="30" height="6.67" fill="#00b5e2" />
      <rect y="6.67" width="30" height="6.66" fill="#e4002b" />
      <rect y="13.33" width="30" height="6.67" fill="#00a95c" />
      <circle cx="12.8" cy="10" r="2.6" fill="#fff" />
      <circle cx="13.9" cy="10" r="2.2" fill="#e4002b" />
      <polygon
        fill="#fff"
        points="18,7.2 18.4,8.4 19.7,8.4 18.6,9.2 19,10.4 18,9.6 17,10.4 17.4,9.2 16.3,8.4 17.6,8.4"
      />
    </>
  ),
  NL: (
    <>
      <rect width="30" height="6.67" fill="#ae1c28" />
      <rect y="6.67" width="30" height="6.66" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#21468b" />
    </>
  ),
  PL: (
    <>
      <rect width="30" height="10" fill="#fff" />
      <rect y="10" width="30" height="10" fill="#dc143c" />
    </>
  ),
  UA: (
    <>
      <rect width="30" height="10" fill="#0057b7" />
      <rect y="10" width="30" height="10" fill="#ffd700" />
    </>
  ),
  ID: (
    <>
      <rect width="30" height="10" fill="#ce1126" />
      <rect y="10" width="30" height="10" fill="#fff" />
    </>
  ),
};

export default function Flag({
  country,
  className,
}: {
  country: string;
  className?: string;
}) {
  const content = FLAGS[country.toUpperCase()];

  return (
    <span
      className={cn(
        "inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-white/20",
        className
      )}
      aria-hidden
    >
      {content ? (
        /*
         * Inline width/height are required: shadcn's Button applies
         * `[&_svg]:size-*` to every descendant <svg>, which would otherwise
         * squash the flag and leave a gap inside its frame.
         */
        <svg
          viewBox="0 0 30 20"
          preserveAspectRatio="none"
          className="block"
          style={{ width: "100%", height: "100%" }}
        >
          {content}
        </svg>
      ) : (
        <span className="h-full w-full bg-brand-500/40" />
      )}
    </span>
  );
}
