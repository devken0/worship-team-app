"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (`public/sw.js`) after load. Production
 * only: in dev the SW would cache Turbopack's per-reload chunks and break HMR,
 * so test offline behaviour with `npm run build && npm start`.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app works online regardless.
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
