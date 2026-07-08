import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { LeadForm } from "@/components/admin/lead-form";

export const metadata = { title: "New Lead" };

export default async function NewLeadPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <h1 className="text-2xl font-bold font-heading">New Lead</h1>
        <p className="text-sm text-muted-foreground">
          Manually add a lead to the pipeline.
        </p>
      </div>

      <LeadForm />
    </div>
  );
}
