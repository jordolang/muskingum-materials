"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products & Pricing" },
  { href: "/order", label: "Order Online" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const ClerkAccountButton = lazy(() =>
  import("@/components/layout/clerk-account-button").then((mod) => ({
    default: mod.ClerkAccountButton,
  }))
);

function AccountButtonFallback() {
  return (
    <Link href="/sign-in">
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="h-4 w-4" />
        <span className="hidden lg:inline text-xs">Sign In</span>
      </Button>
    </Link>
  );
}

function MobileAccountFallback() {
  return (
    <Link href="/sign-in">
      <Button variant="outline" size="sm" className="w-full gap-2">
        <User className="h-4 w-4" />
        Sign In
      </Button>
    </Link>
  );
}

const ClerkMobileAccount = lazy(() =>
  import("@/components/layout/clerk-account-button").then((mod) => ({
    default: mod.ClerkMobileAccount,
  }))
);

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.svg"
            alt="Muskingum Materials"
            width={200}
            height={60}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Suspense fallback={<AccountButtonFallback />}>
            <ClerkAccountButton />
          </Suspense>
          <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4" />
              {BUSINESS_INFO.phone}
            </Button>
          </a>
          <Link href="/contact">
            <Button size="sm">Get a Quote</Button>
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium py-2 text-muted-foreground hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t">
              <Suspense fallback={<MobileAccountFallback />}>
                <ClerkMobileAccount onNavigate={() => setMobileOpen(false)} />
              </Suspense>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  {BUSINESS_INFO.phone}
                </Button>
              </a>
              <Link href="/contact" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Get a Quote</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
