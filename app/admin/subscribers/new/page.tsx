import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { SubscriberForm } from "@/components/admin/subscriber-form";

export const metadata = { title: "New Subscriber" };

export default async function NewSubscriberPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/subscribers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Subscribers
        </Link>
        <h1 className="text-2xl font-bold font-heading">New Subscriber</h1>
        <p className="text-sm text-muted-foreground">
          Manually add a newsletter subscriber.
        </p>
      </div>

      <SubscriberForm />
    </div>
  );
}
