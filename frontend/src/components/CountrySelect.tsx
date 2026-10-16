import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import CountryFlag from "@/components/CountryFlag";
import { COUNTRY_CODES, countryName, matchesQuery } from "@/lib/countries";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string | null;
  onChange: (code: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
}

/** Searchable country picker showing every country with its flag. */
export default function CountrySelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  className,
}: CountrySelectProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  const list = useMemo(
    () => COUNTRY_CODES.filter((code) => matchesQuery(code, query, lang)),
    [query, lang]
  );

  const selectedLabel = value ? countryName(value, lang) : "";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-xl border border-border/80 bg-white/5 px-4 text-left text-sm",
          "transition-colors hover:border-brand-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        )}
      >
        {value ? (
          <>
            <CountryFlag code={value} width={40} />
            <span className="truncate font-medium">{selectedLabel}</span>
          </>
        ) : (
          <span className="text-muted-foreground/70">{placeholder}</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-60" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-popover/97 shadow-glow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder ?? placeholder}
              className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto overscroll-contain p-1.5" role="listbox">
            {list.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">—</p>
            ) : (
              list.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="option"
                  aria-selected={code === value}
                  onClick={() => {
                    onChange(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    code === value
                      ? "bg-brand-500/15 text-brand-200"
                      : "hover:bg-white/5"
                  )}
                >
                  <CountryFlag code={code} width={40} />
                  <span className="truncate">{countryName(code, lang)}</span>
                  {code === value ? <Check className="ml-auto h-4 w-4 shrink-0" /> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
