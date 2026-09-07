"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { rememberPublicPage, sendPublicMetric, trackSoundboardReturn } from "@/lib/analytics/client";
import { publicMetricPath } from "@/lib/analytics/contracts";

export function SiteMeasurement({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname();
  const lastRecordedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !publicMetricPath(pathname)) { lastRecordedPath.current = null; return; }
    async function recordVisiblePage() {
      if (document.visibilityState !== "visible" || lastRecordedPath.current === pathname) return;
      lastRecordedPath.current = pathname;
      rememberPublicPage(pathname);
      const counted = await sendPublicMetric("page_view", pathname);
      if (counted && pathname === "/soundboard" && window.location.pathname === pathname) await trackSoundboardReturn();
    }
    void recordVisiblePage();
    document.addEventListener("visibilitychange", recordVisiblePage);
    return () => { document.removeEventListener("visibilitychange", recordVisiblePage); };
  }, [enabled, pathname]);

  return null;
}
