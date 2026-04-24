"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/lib/use-toast";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";
import { Loader2, AlertCircle, CheckCircle, WifiOff } from "lucide-react";

export default function TestToastNotificationsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [retryLog, setRetryLog] = useState<string[]>([]);

  // Test 1: API Error with Invalid Input (400 Bad Request)
  async function testInvalidInputError() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Invalid data - missing required fields
          items: [],
          total: -100, // Invalid negative amount
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid request");
      }
    } catch (error) {
      // This should trigger the toast notification
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please call (740) 319-0183 to place your order.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Test 2: Network Error Simulation
  async function testNetworkError() {
    setIsLoading(true);
    try {
      // Try to fetch from a non-existent endpoint to simulate network error
      await fetch("https://this-domain-definitely-does-not-exist-12345.com/api/test");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to connect. Please check your internet connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Test 3: Server Error (500 Internal Server Error)
  async function testServerError() {
    setIsLoading(true);
    try {
      // This endpoint doesn't exist, will return 404
      const response = await fetch("/api/test-error-500", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Server error occurred");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Server Error",
        description: "Something went wrong on our end. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Test 4: Retry Logic with GET Request
  async function testRetryLogic() {
    setIsLoading(true);
    setRetryLog([]);
    const logs: string[] = [];

    try {
      // Monitor fetch calls to count retries
      const originalFetch = window.fetch;
      let attemptCount = 0;

      window.fetch = async (...args) => {
        attemptCount++;
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `Attempt ${attemptCount} at ${timestamp}`;
        logs.push(logEntry);
        setRetryLog([...logs]);

        // Simulate a failing endpoint
        if (attemptCount < 3) {
          // Fail first 2 attempts
          throw new Error("Network timeout");
        }

        // Restore original fetch and succeed on 3rd attempt
        window.fetch = originalFetch;
        return originalFetch(...args);
      };

      // Use fetchWithRetry which should retry GET requests
      await fetchWithRetry("/api/contact", {
        method: "GET",
        maxRetries: 3,
      });

      logs.push("✅ Request succeeded after retries");
      setRetryLog([...logs]);

      toast({
        title: "Success!",
        description: `Request succeeded after ${attemptCount} attempts`,
      });

      // Restore original fetch
      window.fetch = originalFetch;
    } catch (error) {
      logs.push("❌ All retries exhausted");
      setRetryLog([...logs]);

      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Failed after 3 retry attempts",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Test 5: Success Toast
  function testSuccessToast() {
    toast({
      title: "Message sent!",
      description: "Thank you for reaching out. We'll get back to you as soon as possible.",
    });
  }

  // Test 6: Contact Form Submission Error
  async function testContactFormError() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Invalid data
          name: "",
          email: "not-an-email",
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. We'll get back to you as soon as possible.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "Something went wrong. Please try again or call us directly.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Card className="mb-8 border-t-4 border-t-amber-500">
        <CardHeader>
          <CardTitle className="text-2xl">Toast Notification Testing</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            This page tests toast notifications for various API error scenarios. Open your browser's
            DevTools (Network tab) to monitor API calls.
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {/* Test 1: Invalid Input Error */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="destructive">Test 1</Badge>
              Invalid Input Error (400 Bad Request)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Simulates submitting invalid data to the order checkout API
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testInvalidInputError}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Trigger Invalid Input Error
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Expected: Destructive toast with "Checkout failed" title
            </p>
          </CardContent>
        </Card>

        {/* Test 2: Network Error */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="destructive">Test 2</Badge>
              Network Error Simulation
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Attempts to fetch from a non-existent domain to trigger network error
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testNetworkError}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  Trigger Network Error
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Expected: Destructive toast with "Network Error" title
            </p>
          </CardContent>
        </Card>

        {/* Test 3: Server Error */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="destructive">Test 3</Badge>
              Server Error (500)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Simulates a server error by calling a non-existent API endpoint
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testServerError}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Trigger Server Error
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Expected: Destructive toast with "Server Error" title
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Test 4: Retry Logic */}
        <Card className="border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge className="bg-amber-600">Test 4</Badge>
              Retry Logic Test (GET Request)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tests fetchWithRetry utility with automatic retry for GET requests (up to 3 attempts)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testRetryLogic}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing Retries...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Test Retry Logic
                </>
              )}
            </Button>

            {retryLog.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold">Retry Log:</p>
                {retryLog.map((log, index) => (
                  <p key={index} className="text-xs font-mono text-muted-foreground">
                    {log}
                  </p>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Expected: Should see 3 retry attempts in the log, then either success or failure toast
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Test 5: Success Toast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="secondary">Test 5</Badge>
              Success Toast
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Displays a success toast notification (non-destructive variant)
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={testSuccessToast} variant="outline" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Show Success Toast
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Expected: Default (success) toast with "Message sent!" title
            </p>
          </CardContent>
        </Card>

        {/* Test 6: Contact Form Error */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="destructive">Test 6</Badge>
              Contact Form Submission Error
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Simulates contact form submission with invalid data
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testContactFormError}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Trigger Contact Form Error
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Expected: Destructive toast with "Submission failed" title
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Manual Testing Steps:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click each test button and verify the toast notification appears</li>
              <li>Check that error toasts use the destructive (red) variant</li>
              <li>Check that success toasts use the default variant</li>
              <li>Verify toast messages are user-friendly (not technical error messages)</li>
              <li>For the retry test, verify the log shows 3 attempts with exponential backoff</li>
            </ol>
          </div>

          <Separator />

          <div>
            <p className="font-semibold mb-2">Browser DevTools Testing:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Open DevTools → Network tab</li>
              <li>Click "Offline" checkbox to simulate network failure</li>
              <li>Trigger any API call (e.g., contact form, order checkout)</li>
              <li>Verify toast appears with appropriate network error message</li>
              <li>Uncheck "Offline" and retry to verify recovery</li>
            </ol>
          </div>

          <Separator />

          <div>
            <p className="font-semibold mb-2">Production Components to Test:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Order Form (/order) - Invalid checkout data</li>
              <li>Contact Form (/contact) - Invalid submission</li>
              <li>Chat Widget - API failures</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
