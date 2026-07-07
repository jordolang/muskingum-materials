"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";

interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string; description?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const pillBase =
  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200";

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.children) {
    return (
      item.children.some((c) => pathname === c.href) ||
      (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
    );
  }
  return item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
}

function DesktopDropdown({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = isItemActive(item, pathname);

  function handleEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }
  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`${pillBase} ${
          active
            ? "bg-primary/10 text-primary"
            : "text-stone-600 hover:bg-stone-900/5 hover:text-foreground"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        className={`${pillBase} flex items-center gap-1 ${
          active
            ? "bg-primary/10 text-primary"
            : "text-stone-600 hover:bg-stone-900/5 hover:text-foreground"
        }`}
        onClick={() => setOpen((p) => !p)}
      >
        {item.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
          <div className="glass shadow-float w-72 rounded-3xl p-2">
            {item.children.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block rounded-2xl px-4 py-2.5 transition-colors ${
                    childActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-stone-900/5"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <div className="text-sm font-semibold">{child.label}</div>
                  {child.description && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {child.description}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const active = isItemActive(item, pathname);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
          active ? "bg-primary/10 text-primary" : "text-stone-600 hover:bg-stone-900/5"
        }`}
        onClick={onClose}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
          active ? "bg-primary/10 text-primary" : "text-stone-600 hover:bg-stone-900/5"
        }`}
        onClick={() => setExpanded((p) => !p)}
      >
        {item.label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="mt-1 space-y-1 pl-3">
          {item.children.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`block rounded-xl px-4 py-2 text-sm transition-colors ${
                  childActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-stone-900/5"
                }`}
                onClick={onClose}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 print:hidden">
      <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-5 sm:pt-4">
        {/* Floating glass pill */}
        <div className="glass shadow-float relative flex h-16 items-center justify-between gap-3 rounded-full pl-5 pr-2.5">
          <Link href="/" className="shrink-0">
            <Image
              src="/muskingum-materials-logo.png"
              alt="Muskingum Materials"
              width={300}
              height={200}
              className="h-11 w-auto"
              priority
            />
          </Link>

          {/* Centered nav pill cluster */}
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <DesktopDropdown key={item.label} item={item} />
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
              <Button size="sm" className="gap-2 shadow-glow">
                <Phone className="h-4 w-4" />
                Call {BUSINESS_INFO.phone}
              </Button>
            </a>
          </div>

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full lg:hidden"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile floating menu panel */}
        {mobileOpen && (
          <div className="glass shadow-float mt-2 rounded-3xl p-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <MobileNavItem
                  key={item.label}
                  item={item}
                  onClose={() => setMobileOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-stone-900/10 pt-3">
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button size="sm" className="w-full gap-2 shadow-glow">
                  <Phone className="h-4 w-4" />
                  Call {BUSINESS_INFO.phone}
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
