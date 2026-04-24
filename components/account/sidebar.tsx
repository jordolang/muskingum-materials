"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  MapPin,
  FileText,
  LogOut,
  Award,
  Shield,
  Mail,
  Users,
  BarChart,
  Settings,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/account/rewards", label: "Rewards", icon: Award },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/invoices", label: "Invoices", icon: FileText },
];

const ADMIN_NAV_ITEMS = [
  { href: "/account/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/account/admin/campaigns", label: "Email Campaigns", icon: Mail },
  { href: "/account/admin/subscribers", label: "Subscribers", icon: Users },
  { href: "/account/admin/analytics", label: "Analytics", icon: BarChart },
  { href: "/account/admin/settings", label: "Settings", icon: Settings },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <nav className="space-y-1">
      <div className="mb-4">
        <h2 className="text-lg font-bold font-heading">My Account</h2>
        <p className="text-sm text-muted-foreground">Manage your orders and profile</p>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-amber-100 text-amber-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <div className="my-4 border-t border-border" />
          <div className="mb-4">
            <h2 className="text-lg font-bold font-heading">Administration</h2>
            <p className="text-sm text-muted-foreground">Manage site and campaigns</p>
          </div>

          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-100 text-amber-900"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </>
      )}

      <Button
        variant="ghost"
        onClick={() => signOut({ redirectUrl: "/" })}
        className="flex items-center gap-3 justify-start w-full mt-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign Out
      </Button>
    </nav>
  );
}
