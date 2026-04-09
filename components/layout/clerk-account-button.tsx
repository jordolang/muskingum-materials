"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function ClerkAccountButton() {
  const { user } = useUser();

  return (
    <>
      <SignedIn>
        <Link href="/account">
          <Button variant="ghost" size="sm" className="gap-2">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="h-5 w-5 rounded-full" />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="hidden lg:inline text-xs">Account</span>
          </Button>
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href="/sign-in">
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden lg:inline text-xs">Sign In</span>
          </Button>
        </Link>
      </SignedOut>
    </>
  );
}

export function ClerkMobileAccount({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <SignedIn>
        <Link href="/account" onClick={onNavigate}>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <User className="h-4 w-4" />
            My Account
          </Button>
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href="/sign-in" onClick={onNavigate}>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <User className="h-4 w-4" />
            Sign In
          </Button>
        </Link>
      </SignedOut>
    </>
  );
}
