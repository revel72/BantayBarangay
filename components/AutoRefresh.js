"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-fetches the dashboard every 30 seconds so new reports show up without a manual reload.
export default function AutoRefresh({ seconds = 30 }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
