"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Test component to trigger errors for error boundary testing
 * Only for development/testing purposes
 */
export function ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("Test error triggered by ErrorTrigger component");
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Error Boundary Test</CardTitle>
        <CardDescription>
          Click the button below to trigger a component error and test the error boundary
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => setShouldThrow(true)}
          variant="destructive"
        >
          Trigger Test Error
        </Button>
      </CardContent>
    </Card>
  );
}
