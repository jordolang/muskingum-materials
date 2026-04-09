"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <SignIn />
    </div>
  );
}
