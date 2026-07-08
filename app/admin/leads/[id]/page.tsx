import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/components/admin/lead-form";
import { requireAdmin } from "@/lib/admin-auth";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    new: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    contacted: { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
    qualified: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    converted: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
    closed: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  const config = variants[status] || { variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    chat: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    contact: { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
    quote: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  };

  const config = variants[source] || { variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={config.className}>
      {source}
    </Badge>
  );
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  // Check admin authentication
  await requireAdmin();

  const { id } = await params;

  let lead;
  try {
    lead = await prisma.lead.findUnique({
      where: { id },
    });
  } catch {
    // DB not ready
  }

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/leads"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Leads
        </Link>
        <h1 className="text-2xl font-bold font-heading">{lead.name}</h1>
        <p className="text-sm text-muted-foreground">
          Created on{" "}
          {new Date(lead.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Status Badges */}
      <div className="flex gap-3">
        <StatusBadge status={lead.status} />
        <SourceBadge source={lead.source} />
      </div>

      {/* Editable Form */}
      <LeadForm
        lead={{
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          message: lead.message,
          source: lead.source,
          status: lead.status,
        }}
      />
    </div>
  );
}
