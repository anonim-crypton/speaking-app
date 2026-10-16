import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import StatsBar from "@/components/StatsBar";
import CtaBanner from "@/components/CtaBanner";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  const location = useLocation();

  /* Deep-link support: /with state { scrollTo } scrolls to a section. */
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;
    const id = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    window.history.replaceState({}, "");
    return () => window.clearTimeout(id);
  }, [location.state]);

  return (
    <>
      <Hero />
      <FeatureGrid />
      <StatsBar />
      <CtaBanner />
      <SiteFooter />
    </>
  );
}
