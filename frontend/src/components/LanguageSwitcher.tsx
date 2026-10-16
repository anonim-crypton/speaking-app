import { Check, ChevronDown, Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Flag from "@/components/Flag";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

/** Language picker: 24 languages, each with its own SVG flag. */
export default function LanguageSwitcher() {
  const { lang, current, changeLanguage, LANGS, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 px-3"
          aria-label={t.nav.language}
          title={t.nav.language}
        >
          <Languages className="!size-4 shrink-0 text-brand-300" />
          <Flag country={current.country} />
          <span className="font-bold tracking-wide">{current.short}</span>
          <ChevronDown className="!size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="max-h-[min(60vh,360px)] w-[248px] overflow-y-auto overscroll-contain"
      >
        <DropdownMenuLabel className="sticky top-0 z-10 bg-popover/95 backdrop-blur">
          {t.nav.language}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => changeLanguage(l.code)}
            className={cn("gap-2.5", l.code === lang && "text-brand-300")}
          >
            <Flag country={l.country} />
            <span className="truncate">{l.label}</span>
            {l.code === lang && <Check className="ml-auto !size-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
