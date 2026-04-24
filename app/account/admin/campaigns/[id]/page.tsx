import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();

  // Check if user is admin
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/account");
  }

  const { id } = await params;

  let campaign;
  try {
    campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });
  } catch {
    // DB not ready
  }

  if (!campaign) notFound();

  const metrics = campaign.metrics as {
    successCount?: number;
    failureCount?: number;
    errors?: string[];
  } | null;

  const canEdit = campaign.status === "draft";
  const canSend = campaign.status === "draft" || campaign.status === "scheduled";
  const isSent = campaign.status === "sent";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/account/admin/campaigns"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Campaigns
          </Link>
          <h1 className="text-2xl font-bold font-heading">
            {campaign.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created on{" "}
            {new Date(campaign.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <form action={`/api/admin/campaigns/${campaign.id}/send`} method="POST">
              <Button className="gap-1">
                <Send className="h-4 w-4" />
                Send Campaign
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-3">
        <StatusBadge status={campaign.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Details */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-stone-800 text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Campaign Details</CardTitle>
                  <p className="text-sm text-stone-300">{campaign.subject}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Subject */}
              <div className="mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Subject Line
                </p>
                <p className="font-semibold">{campaign.subject}</p>
              </div>

              {/* Template */}
              {campaign.template && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Template
                  </p>
                  <p className="text-sm">
                    {campaign.template.name}{" "}
                    <span className="text-muted-foreground">
                      ({campaign.template.category})
                    </span>
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Email Content
                </p>
                <div className="border rounded-md p-4 bg-muted/20 max-h-96 overflow-y-auto">
                  {campaign.htmlContent ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: campaign.htmlContent }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {campaign.textContent || "No content"}
                    </p>
                  )}
                </div>
              </div>

              {/* Metrics for sent campaigns */}
              {isSent && metrics && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Delivery Metrics
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">
                            {metrics.successCount || 0} Delivered
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Successfully sent
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium">
                            {metrics.failureCount || 0} Failed
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Delivery errors
                          </p>
                        </div>
                      </div>
                    </div>
                    {metrics.errors && metrics.errors.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs font-medium text-red-800 mb-2">
                          Errors:
                        </p>
                        <ul className="text-xs text-red-700 space-y-1">
                          {metrics.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                          {metrics.errors.length > 5 && (
                            <li className="text-red-600">
                              ... and {metrics.errors.length - 5} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Info */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-600" />
                Campaign Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <StatusBadge status={campaign.status} />
              </div>

              {campaign.scheduledAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Scheduled For
                  </p>
                  <div className="flex items-center gap-1 text-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm">
                      {new Date(campaign.scheduledAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )}

              {campaign.sentAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sent At</p>
                  <div className="flex items-center gap-1 text-foreground">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-sm">
                      {new Date(campaign.sentAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-600" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {campaign.recipientCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {campaign.recipientCount === 1 ? "Recipient" : "Recipients"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {canEdit && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/account/admin/campaigns/${campaign.id}/edit`}>
                  <Button variant="outline" className="w-full gap-2">
                    <Calendar className="h-4 w-4" />
                    Edit Campaign
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  Make changes before sending
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; icon: typeof Mail }> = {
    draft: { bg: "bg-gray-100 text-gray-800", icon: Mail },
    scheduled: { bg: "bg-blue-100 text-blue-800", icon: Clock },
    sending: { bg: "bg-purple-100 text-purple-800", icon: Send },
    sent: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
    failed: { bg: "bg-red-100 text-red-800", icon: AlertCircle },
  };

  const config = map[status] || map.draft;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${config.bg}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
