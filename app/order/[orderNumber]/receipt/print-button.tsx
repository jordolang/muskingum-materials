"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      Print / Save as PDF
    </Button>
  );
}
