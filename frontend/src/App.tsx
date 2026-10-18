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
import AdminDashboard from "@/pages/AdminDashboard";
import Help from "@/pages/Help";
import { useAuth } from "@/context/AuthContext";
import { loaderDuration, measureRtt, routeLoadDuration } from "@/lib/network";
import { cn } from "@/lib/utils";

/** Requires a session, and a completed questionnaire. */
function Protected({ children }: { children: ReactNode }) {
  const { isAuthed, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

/** "/" → the landing page for visitors, the personal /u/<slug> page for signed-in users. */
function HomeGate() {
  const { isAuthed, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-400" />
      </div>
    );
  }
  if (isAuthed && user) {
    return <Navigate to={`/u/${user.slug}`} replace />;
  }
  return <Home />;
}

export default function App() {
  const location = useLocation();
  const isOnboardingRoute = location.pathname === "/onboarding";
  const isUserDashboard =
    location.pathname.startsWith("/u/") ||
    location.pathname.startsWith("/create-room") ||
    location.pathname.startsWith("/chat-room");
  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/speak-admin");

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

    // Skip global route loader when transitioning to /help, /create-room, /chat-room, or admin routes
    if (
      location.pathname.startsWith("/help") ||
      location.pathname.startsWith("/create-room") ||
      location.pathname.startsWith("/chat-room") ||
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/speak-admin")
    ) {
      setRouteLoading(false);
      return;
    }

    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), routeLoadDuration());
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  /* Always reset scroll to the very top when navigating between pages */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="neon-backdrop" aria-hidden />

      {/* Full-screen pages have no landing navbar */}
      {!isOnboardingRoute && !isUserDashboard && !isAdminRoute ? <Navbar /> : null}

      <main
        className={cn(
          "flex-1",
          !isUserDashboard && !isOnboardingRoute && !isAdminRoute && "pb-20 lg:pb-0"
        )}
      >
        <Routes>
          <Route path="/" element={<HomeGate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/help" element={<Help />} />
          <Route path="/speak-admin" element={<AdminDashboard />} />
          <Route path="/speak-admin/*" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/create-room"
            element={
              <Protected>
                <UserHome />
              </Protected>
            }
          />
          <Route
            path="/chat-room"
            element={
              <Protected>
                <UserHome />
              </Protected>
            }
          />
          <Route
            path="/chat-room/:clubRoomId"
            element={
              <Protected>
                <UserHome />
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
