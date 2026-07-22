"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { observeWebVitals } from "@/lib/web-vitals";
import { reportWebVital } from "@/services/portal-observability-api";

/**
 * Portal-only client boundary for anonymous Core Web Vitals reporting.
 */
export function WebVitalsReporter() {
  const pathname = usePathname();

  useEffect(() => observeWebVitals(reportWebVital, pathname), [pathname]);

  return null;
}
