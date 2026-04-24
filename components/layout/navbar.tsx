"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, Phone, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";

interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string; description?: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  {
    href: "/catalog",
    label: "Materials",
    children: [
      {
        href: "/catalog",
        label: "Material Guide",
        description: "Browse all products with detailed specs",
      },
      {
        href: "/products",
        label: "Products & Pricing",
        description: "Current Muskingum Materials pricing",
      },
      {
        href: "/costs",
        label: "Cost Guides",
        description: "Understand pricing by project type",
      },
      {
        href: "/costs/delivery-cost",
        label: "Delivery Costs",
        description: "Delivery pricing and truck capacities",
      },
      {
        href: "/costs/driveway-cost",
        label: "Driveway Costs",
        description: "Full driveway cost breakdown",
      },
    ],
  },
  {
    href: "/calculators",
    label: "Calculators",
    children: [
      {
        href: "/calculators",
        label: "All Calculators",
        description: "View all gravel calculators",
      },
      {
        href: "/calculators/gravel-calculator",
        label: "Gravel Calculator",
        description: "Calculate tons, yards, and cost",
      },
      {
        href: "/calculators/tons-to-yards",
        label: "Tons ↔ Yards Converter",
        description: "Convert between tons and cubic yards",
      },
      {
        href: "/calculators/coverage-chart",
        label: "Coverage Chart",
        description: "Coverage at different depths",
      },
      {
        href: "/planner",
        label: "Gravel Planner",
        description: "Draw on satellite map for exact estimates",
      },
    ],
  },
  { href: "/order", label: "Order Online" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

function DesktopDropdown({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Determine if this item or any of its children are active
  const isActive = item.children
    ? item.children.some((child) => pathname === child.href) ||
      (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
    : item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`text-sm font-medium transition-colors ${
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-primary"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center gap-1 px-2 ${
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-primary"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {item.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div className="absolute top-full left-0 pt-2 z-50">
          <div className="w-72 rounded-lg border bg-background shadow-lg p-2">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block rounded-md px-3 py-2.5 transition-colors ${
                    isChildActive
                      ? "bg-amber-100 text-amber-900"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <div className="text-sm font-medium">{child.label}</div>
                  {child.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
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

function MobileNavItem({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="text-sm font-medium py-2 text-muted-foreground hover:text-primary"
        onClick={onClose}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-primary px-0"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {item.label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </Button>
      {expanded && (
        <div className="pl-4 pb-2 space-y-1">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block py-1.5 text-sm text-muted-foreground hover:text-primary"
              onClick={onClose}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
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
          {NAV_ITEMS.map((item) => (
            <DesktopDropdown key={item.label} item={item} />
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden lg:inline text-xs">Account</span>
            </Button>
          </Link>
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

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <MobileNavItem
                key={item.label}
                item={item}
                onClose={() => setMobileOpen(false)}
              />
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t mt-2">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
              >
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <User className="h-4 w-4" />
                  My Account
                </Button>
              </Link>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  {BUSINESS_INFO.phone}
                </Button>
              </a>
              <Link href="/contact" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  Get a Quote
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
