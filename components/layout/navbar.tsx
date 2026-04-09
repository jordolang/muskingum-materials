"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, Mountain } from "lucide-react";
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

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Mountain className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-foreground">
              Muskingum
            </span>
            <span className="text-xs font-medium leading-tight text-muted-foreground">
              Materials
            </span>
          </div>
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

        <div className="hidden md:flex items-center gap-3">
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
