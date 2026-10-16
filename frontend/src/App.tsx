import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import UserHome from "@/pages/UserHome";
import { useAuth } from "@/context/AuthContext";
import { loaderDuration, measureRtt, routeLoadDuration } from "@/lib/network";

/** Requires a session, and a completed questionnaire. */
function Protected({ children }: { children: ReactNode }) {
  const { isAuthed, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

/** "/" → the landing page for visitors, the personal /u/<slug> page for signed-in users. */
function HomeGate() {
  const { isAuthed, loading, user, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-400" />
      </div>
    );
  }
  if (isAuthed && user) {
    return <Navigate to={needsOnboarding ? "/onboarding" : `/u/${user.slug}`} replace />;
  }
  return <Home />;
}

export default function App() {
  const location = useLocation();
  const isOnboardingRoute = location.pathname === "/onboarding";
  const isUserDashboard = location.pathname.startsWith("/u/");

  /* ── First visit ────────────────────────────────────────────────────────
     The loading animation runs while the real round-trip latency is measured,
     then stays up for a duration derived from that measurement. */
  const [booting, setBooting] = useState(true);
  const bootStartedAt = useRef(
    typeof performance !== "undefined" ? performance.now() : 0
  );

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    measureRtt(2)
      .then((rtt) => {
        if (cancelled) return;
        const target = loaderDuration(rtt, "initial");
        const elapsed =
          (typeof performance !== "undefined" ? performance.now() : 0) -
          bootStartedAt.current;
        timer = window.setTimeout(
          () => {
            if (!cancelled) setBooting(false);
          },
          Math.max(0, target - elapsed)
        );
      })
      .catch(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  /* ── Page-to-page navigation replays the same animation ─────────────── */
  const [routeLoading, setRouteLoading] = useState(false);
  const firstRoute = useRef(true);

  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false; // the boot loader already covers this one
      return;
    }

    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), routeLoadDuration());
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="neon-backdrop" aria-hidden />

      {/* Full-screen pages have no landing navbar */}
      {!isOnboardingRoute && !isUserDashboard ? <Navbar /> : null}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeGate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/u/:slug"
            element={
              <Protected>
                <UserHome />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <LoadingScreen visible={booting || routeLoading} />
    </div>
  );
}
