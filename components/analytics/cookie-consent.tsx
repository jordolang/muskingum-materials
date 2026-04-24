"use client";

import { useEffect, useState } from "react";

const CONSENT_COOKIE = "cookie_consent";

type ConsentChoice = "granted" | "denied";

function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_COOKIE);
  if (v === "granted" || v === "denied") return v;
  return null;
}

function updateGtagConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  if (!w.gtag) return;

  w.gtag("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      updateGtagConsent(stored);
    } else {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_COOKIE, "granted");
    updateGtagConsent("granted");
    setVisible(false);
  }

  function handleDeny() {
    localStorage.setItem(CONSENT_COOKIE, "denied");
    updateGtagConsent("denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t bg-white p-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6"
    >
      <p className="text-sm text-gray-700">
        We use cookies and Google Analytics to understand how visitors interact
        with our site. You can accept or deny non-essential cookies.
      </p>
      <div className="mt-3 flex shrink-0 gap-3 sm:mt-0">
        <button
          onClick={handleDeny}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Deny
        </button>
        <button
          onClick={handleAccept}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
