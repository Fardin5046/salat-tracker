"use client";

import { useEffect } from "react";

export default function PwaInstaller() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        } catch (e) {
          // noop
        }
      };
      // Delay a tick to avoid blocking hydration
      setTimeout(register, 0);
    }
  }, []);

  return null;
}