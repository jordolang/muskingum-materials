"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

type ConsentChoice = "granted" | "denied" | null;

function getStoredConsent(): ConsentChoice {
  try {
    const v = localStorage.getItem("cookie-consent");
    if (v === "granted" || v === "denied") return v;
  } catch {
    /* SSR or storage unavailable */
  }
  return null;
}

function persistConsent(choice: "granted" | "denied") {
  try {
    localStorage.setItem("cookie-consent", choice);
  } catch {
    /* storage unavailable */
  }
}

function updateGtagConsent(choice: "granted" | "denied") {
  if (typeof window.gtag !== "function") return;

  window.gtag("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });
}

const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;

export function CookieConsent() {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (gaId && GA_ID_PATTERN.test(gaId) && getStoredConsent() === null) {
      setVisible(true);
    }
  }, [gaId]);

  if (!visible) return null;

  function accept() {
    persistConsent("granted");
    updateGtagConsent("granted");
    setVisible(false);
  }

  function deny() {
    persistConsent("denied");
    updateGtagConsent("denied");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6"
    >
      <p className="text-sm text-muted-foreground">
        We use cookies to analyze site traffic and improve your experience. You
        can accept or deny non-essential cookies.
      </p>

      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <Button variant="outline" size="sm" onClick={deny}>
          Deny
        </Button>
        <Button size="sm" onClick={accept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
