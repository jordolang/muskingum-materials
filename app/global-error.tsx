"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console with context for debugging
    console.error("Global error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center px-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Application Error</CardTitle>
              <CardDescription>
                We encountered a critical error. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {error.message || "An unexpected error occurred. Please try again."}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                Go home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}
