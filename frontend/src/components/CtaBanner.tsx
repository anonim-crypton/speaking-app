import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { IMG } from "@/lib/assets";

/** Hand-drawn arrow used next to the script note. */
function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      <path
        d="M52 7C36 11 17 22 11 45"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 37l6 9 9-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CtaBanner() {
  const { t } = useLanguage();
  const script = [t.cta.scriptA, t.cta.scriptB, t.cta.scriptC, t.cta.scriptD];

  return (
    <section id="about" className="py-10 lg:py-12 scroll-mt-24">
      <div className="container">
        <Reveal direction="zoom">
          <div className="relative overflow-hidden rounded-[26px] border border-brand-500/30 bg-gradient-to-r from-violet-700/35 via-purple-700/25 to-fuchsia-700/20 p-5 sm:p-7">
            <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />

            <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:gap-8">
              <SmartImage
                src={IMG.ctaGroup}
                alt=""
                className="h-32 w-full shrink-0 rounded-2xl object-cover sm:w-60 lg:h-[124px] lg:w-64"
              />

              <div className="min-w-0 flex-1 text-center lg:text-left">
                <h2 className="text-xl font-extrabold tracking-tight sm:text-[1.6rem]">
                  {t.cta.title}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-foreground/80 lg:mx-0">
                  {t.cta.subtitle}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-5 xl:flex-row">
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-purple-700 shadow-xl shadow-black/30 hover:bg-white/90"
                >
                  <Link to="/register">
                    {t.cta.button}
                    <ArrowRight />
                  </Link>
                </Button>

                <div className="relative hidden shrink-0 pl-9 xl:block">
                  <ArrowDoodle className="absolute -left-1 top-3 h-12 w-12 text-white/70" />
                  <p className="rotate-[-4deg] font-script text-[1.4rem] leading-[1.12] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {script.map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
