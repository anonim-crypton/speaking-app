/**
 * Network-aware loading.
 *
 * The loading animation is not a fixed timer: the real round-trip latency to
 * the server is measured first, and the animation stays on screen for a
 * duration derived from that measurement. A fast connection barely shows it,
 * a slow one keeps it running.
 */

export type LoadKind = "initial" | "route";

/** Last measured round-trip time in ms (null until the first measurement). */
let cachedRtt: number | null = null;

export function getCachedRtt(): number | null {
  return cachedRtt;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** RTT reported by the Network Information API (Chromium browsers). */
function connectionRtt(): number | null {
  try {
    const nav = navigator as Navigator & {
      connection?: { rtt?: number };
      mozConnection?: { rtt?: number };
      webkitConnection?: { rtt?: number };
    };
    const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
    if (conn && typeof conn.rtt === "number" && conn.rtt > 0) return conn.rtt;
  } catch {
    /* ignore */
  }
  return null;
}

/** RTT implied by this page's own navigation timing. */
function navigationRtt(): number | null {
  try {
    const entries = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    const nav = entries[0];
    if (nav && nav.requestStart > 0 && nav.responseStart > nav.requestStart) {
      return nav.responseStart - nav.requestStart;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Measures real round-trip latency by timing cache-busted requests.
 *
 * The API probe is tried first (it also tells the backend somebody is there);
 * a static file is the fallback so this still works with the API offline.
 */
export async function measureRtt(samples = 2): Promise<number> {
  const probes = ["/api/health", "/favicon.svg"];
  const times: number[] = [];

  for (let i = 0; i < samples; i++) {
    for (const probe of probes) {
      const url = `${probe}?ping=${Date.now()}-${i}`;
      const started = performance.now();
      try {
        const res = await fetch(url, { cache: "no-store" });
        // Drain the body so the whole round trip is counted.
        await res.arrayBuffer().catch(() => undefined);
        times.push(performance.now() - started);
        break; // one working probe per sample is enough
      } catch {
        /* probe unreachable — try the next one */
      }
    }
  }

  let rtt: number;
  if (times.length) {
    times.sort((a, b) => a - b);
    rtt = times[Math.floor(times.length / 2)]; // median, ignores one-off spikes
  } else {
    rtt = connectionRtt() ?? navigationRtt() ?? 250;
  }

  cachedRtt = Math.round(clamp(rtt, 1, 5000));
  return cachedRtt;
}

/**
 * How long to keep the loading animation visible.
 *
 * initial — first visit:  ~0.85 s on a fast link, up to ~2.6 s on a slow one
 * route   — in-app navigation: quicker, but still latency-driven
 */
export function loaderDuration(rtt: number, kind: LoadKind = "initial"): number {
  const r = clamp(rtt, 0, 5000);
  if (kind === "initial") return Math.round(clamp(650 + r * 1.7, 850, 2600));
  return Math.round(clamp(300 + r * 0.6, 420, 1100));
}

/** Route-change duration, reusing the cached measurement when available. */
export function routeLoadDuration(): number {
  return loaderDuration(cachedRtt ?? 250, "route");
}
