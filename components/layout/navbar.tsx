"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Phone,
  ChevronDown,
  Home,
  Mountain,
  Truck,
  Calculator,
  Images,
  Users,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string; description?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Products", icon: Mountain },
  { href: "/services", label: "Services", icon: Truck },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/about", label: "About", icon: Users },
  { href: "/contact", label: "Contact", icon: Mail },
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

  // Active page gets an amber aura so the current page is obvious at a glance.
  const activePill =
    "bg-primary/10 text-primary ring-1 ring-primary/30 shadow-[0_0_14px_rgba(245,158,11,0.35)]";

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`${pillBase} ${
          active
            ? activePill
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
            ? activePill
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

/**
 * A single entry in the pull-down menu: label dead-center, the page's icon
 * as an insignia on the left edge, and a mirrored ghost of it on the right
 * edge for symmetry. The current page glows with an amber aura and a
 * pulsing "you are here" dot.
 */
function MobileNavItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const active = isItemActive(item, pathname);
  const Icon = item.icon;

  const rowClass = `relative flex w-full items-center justify-center rounded-2xl px-12 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 ${
    active
      ? "bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 text-primary ring-1 ring-amber-500/30 shadow-[0_0_18px_rgba(245,158,11,0.3)]"
      : "text-stone-600 hover:bg-stone-900/5 active:scale-[0.98]"
  }`;

  const insignias = (
    <>
      <Icon
        aria-hidden
        className={`absolute left-4 h-5 w-5 ${
          active ? "text-primary drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" : "text-stone-400"
        }`}
      />
      {active ? (
        <span
          aria-hidden
          className="absolute right-5 h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.9)]"
        />
      ) : (
        <Icon
          aria-hidden
          className="absolute right-4 h-5 w-5 -scale-x-100 text-stone-300/70"
        />
      )}
    </>
  );

  if (!item.children) {
    return (
      <Link href={item.href} className={rowClass} onClick={onClose}>
        {insignias}
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={rowClass}
        onClick={() => setExpanded((p) => !p)}
      >
        {insignias}
        <span className="flex items-center gap-1.5">
          {item.label}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`block rounded-xl px-4 py-2 text-center text-sm transition-colors ${
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

/**
 * iOS-home-indicator-style pull handle shown at the bottom of the mobile
 * navbar. Dragging it downward opens the menu (dragging up closes it); a
 * "Slide down for menu" hint animates in as soon as the drag starts. Tap
 * and keyboard activation still toggle for accessibility.
 */
function MenuPullHandle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const MAX_PULL = 44;
  const OPEN_THRESHOLD = 24;
  const TAP_TOLERANCE = 4;

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    const delta = e.clientY - startY.current;
    // Closed: only pulling down counts. Open: only pushing up counts.
    setDrag(
      open
        ? Math.max(Math.min(delta, 0), -MAX_PULL)
        : Math.min(Math.max(delta, 0), MAX_PULL)
    );
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    // A committed slide past the threshold — or a plain tap — toggles.
    if (Math.abs(drag) >= OPEN_THRESHOLD || Math.abs(drag) <= TAP_TOLERANCE) {
      onToggle();
    }
    setDrag(0);
  }

  const pulling = dragging && Math.abs(drag) > TAP_TOLERANCE;

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? "Close menu — slide up or tap" : "Open menu — slide down or tap"}
      className="flex w-full touch-none select-none flex-col items-center pb-3.5 pt-1 outline-none lg:hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      // Pointer handlers own tap/drag; only keyboard activation (detail 0)
      // should toggle via click, or it would double-fire after pointerup.
      onClick={(e) => {
        if (e.detail === 0) onToggle();
      }}
    >
      {/* Hint sits above the bar so pulling the bar downward reveals it
          instead of dragging the bar over the top of it. */}
      <span
        aria-hidden
        className={`overflow-hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 transition-all duration-200 ${
          pulling ? "mb-1.5 max-h-5 opacity-100" : "mb-0 max-h-0 opacity-0"
        }`}
      >
        {open ? "Slide up to close" : "Slide down for menu"}
      </span>
      <span
        className={`flex items-center gap-2.5 ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
        style={{ transform: `translateY(${drag}px)` }}
      >
        <ChevronDown
          className={`h-4 w-4 text-stone-400/80 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          } ${pulling ? "scale-125 text-amber-600/70" : ""}`}
        />
        {/* Translucent amber so the handle reads as a hint, not a button. */}
        <span
          className={`h-1.5 w-24 rounded-full transition-colors duration-200 ${
            pulling ? "bg-amber-500/60" : "bg-amber-500/30"
          }`}
        />
        <ChevronDown
          className={`h-4 w-4 text-stone-400/80 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          } ${pulling ? "scale-125 text-amber-600/70" : ""}`}
        />
      </span>
    </button>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 print:hidden">
      <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-5 sm:pt-4">
        {/* Floating glass pill — on mobile it stacks a centered logo over the
            pull-down handle; on desktop it's the original single-row pill. */}
        <div className="glass shadow-float relative flex flex-col rounded-[2rem] px-2.5 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:rounded-full lg:pl-5">
          <div className="flex h-14 shrink-0 items-center justify-center lg:h-auto lg:justify-start">
            <Link href="/">
              <Image
                src="/muskingum-materials-logo-red.png"
                alt="Muskingum Materials"
                width={515}
                height={123}
                className="h-11 w-auto"
                priority
              />
            </Link>
          </div>

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

          {/* Mobile menu — lives INSIDE the same glass pill, between the logo
              and the pull handle. The grid-rows trick animates its height
              open/closed without knowing the content height. */}
          <div
            className={`grid transition-all duration-300 ease-out lg:hidden ${
              mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              {/* Separator between the wordmark and the menu entries */}
              <div className="flex items-center gap-3 px-6 pb-2 pt-1" aria-hidden>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-stone-900/15" />
                <span className="h-1.5 w-1.5 rotate-45 bg-amber-500/50" />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-stone-900/15" />
              </div>

              <nav className="flex flex-col px-1.5">
                {NAV_ITEMS.map((item, i) => (
                  <Fragment key={item.label}>
                    {i > 0 && (
                      <span
                        aria-hidden
                        className="mx-12 h-px bg-gradient-to-r from-transparent via-stone-900/10 to-transparent"
                      />
                    )}
                    <MobileNavItem
                      item={item}
                      onClose={() => setMobileOpen(false)}
                    />
                  </Fragment>
                ))}
              </nav>

              <div className="px-1.5 pb-1 pt-3">
                <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                  <Button size="sm" className="w-full gap-2 shadow-glow">
                    <Phone className="h-4 w-4" />
                    Call {BUSINESS_INFO.phone}
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Mobile pull-down handle */}
          <MenuPullHandle
            open={mobileOpen}
            onToggle={() => setMobileOpen((p) => !p)}
          />
        </div>
      </div>
    </header>
  );
}
