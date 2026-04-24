import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Building2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { StatusUpdater } from "@/components/admin/status-updater";
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
    lost: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
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
  const user = await requireAdmin();
  if (!user) {
    redirect("/admin");
  }

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

  const STATUS_OPTIONS = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
  ];

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

      {/* Status Updater */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusUpdater
            currentStatus={lead.status}
            statusOptions={STATUS_OPTIONS}
            resourceId={lead.id}
            resourceType="leads"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </p>
              <p className="font-medium mt-1">{lead.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <p className="font-medium mt-1">{lead.email}</p>
            </div>
            {lead.phone && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </p>
                <p className="font-medium mt-1">{lead.phone}</p>
              </div>
            )}
            {lead.company && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </p>
                <p className="font-medium mt-1">{lead.company}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message */}
        {lead.message && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{lead.message}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
