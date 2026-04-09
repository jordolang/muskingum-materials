"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

class ClerkErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function AccountButtonInner() {
  const { user } = useUser();

  return (
    <>
      <SignedIn>
        <Link href="/account">
          <Button variant="ghost" size="sm" className="gap-2">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
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

function FallbackButton() {
  return (
    <Link href="/sign-in">
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="h-4 w-4" />
        <span className="hidden lg:inline text-xs">Sign In</span>
      </Button>
    </Link>
  );
}

function MobileFallback() {
  return (
    <Link href="/sign-in">
      <Button variant="outline" size="sm" className="w-full gap-2">
        <User className="h-4 w-4" />
        Sign In
      </Button>
    </Link>
  );
}

export function ClerkAccountButton() {
  return (
    <ClerkErrorBoundary fallback={<FallbackButton />}>
      <AccountButtonInner />
    </ClerkErrorBoundary>
  );
}

function MobileAccountInner({ onNavigate }: { onNavigate?: () => void }) {
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

export function ClerkMobileAccount({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ClerkErrorBoundary fallback={<MobileFallback />}>
      <MobileAccountInner onNavigate={onNavigate} />
    </ClerkErrorBoundary>
  );
}
