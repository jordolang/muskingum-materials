"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  FileText,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/chats", label: "Chats", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <nav className="space-y-1">
      <div className="mb-4">
        <h2 className="text-lg font-bold font-heading">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">Manage your business operations</p>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
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
