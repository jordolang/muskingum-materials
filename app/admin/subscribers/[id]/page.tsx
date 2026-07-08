import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { SubscriberForm } from "@/components/admin/subscriber-form";
import { requireAdmin } from "@/lib/admin-auth";

interface SubscriberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubscriberDetailPage({ params }: SubscriberDetailPageProps) {
  // Check admin authentication
  await requireAdmin();

  const { id } = await params;

  let subscriber;
  try {
    subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });
  } catch {
    // DB not ready
  }

  if (!subscriber) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/subscribers"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Subscribers
        </Link>
        <h1 className="text-2xl font-bold font-heading">{subscriber.email}</h1>
        <p className="text-sm text-muted-foreground">
          Subscribed on{" "}
          {new Date(subscriber.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex gap-3">
        {subscriber.active ? (
          <Badge variant="default" className="bg-green-600">Active</Badge>
        ) : (
          <Badge variant="outline" className="text-gray-600">Unsubscribed</Badge>
        )}
      </div>

      {/* Editable Form */}
      <SubscriberForm
        subscriber={{
          id: subscriber.id,
          email: subscriber.email,
          name: subscriber.name,
          active: subscriber.active,
        }}
      />
    </div>
  );
}
