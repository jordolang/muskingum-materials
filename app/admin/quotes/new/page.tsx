import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { QuoteForm } from "@/components/admin/quote-form";

export const metadata = { title: "New Quote Request" };

export default async function NewQuotePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/quotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Quote Requests
        </Link>
        <h1 className="text-2xl font-bold font-heading">New Quote Request</h1>
        <p className="text-sm text-muted-foreground">
          Manually add a quote request.
        </p>
      </div>

      <QuoteForm />
    </div>
  );
}
