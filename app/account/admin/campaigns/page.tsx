import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Mail, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const CAMPAIGNS_PER_PAGE = 10;

interface CampaignsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  const user = await currentUser();

  // Check if user is admin
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/account");
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  let campaigns: Array<{
    id: string;
    name: string;
    subject: string;
    status: string;
    recipientCount: number;
    sentAt: Date | null;
    scheduledAt: Date | null;
    createdAt: Date;
  }> = [];
  let totalCampaigns = 0;

  try {
    const skip = (currentPage - 1) * CAMPAIGNS_PER_PAGE;

    [campaigns, totalCampaigns] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: CAMPAIGNS_PER_PAGE,
        skip,
        select: {
          id: true,
          name: true,
          subject: true,
          status: true,
          recipientCount: true,
          sentAt: true,
          scheduledAt: true,
          createdAt: true,
        },
      }),
      prisma.campaign.count(),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalCampaigns / CAMPAIGNS_PER_PAGE);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Email Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage email marketing campaigns
          </p>
        </div>
        <Link href="/account/admin/campaigns/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Mail className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No campaigns yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first email campaign to engage with your subscribers.
            </p>
            <Link href="/account/admin/campaigns/new">
              <Button>Create Your First Campaign</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              return (
                <Link key={campaign.id} href={`/account/admin/campaigns/${campaign.id}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-sm">
                              {campaign.name}
                            </p>
                            <StatusBadge status={campaign.status} />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium mb-1">
                            {campaign.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {campaign.sentAt && (
                              <> • Sent {new Date(campaign.sentAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}</>
                            )}
                            {campaign.scheduledAt && !campaign.sentAt && (
                              <> • Scheduled for {new Date(campaign.scheduledAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold">{campaign.recipientCount}</p>
                            <p className="text-xs text-muted-foreground">
                              {campaign.recipientCount === 1 ? "recipient" : "recipients"}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * CAMPAIGNS_PER_PAGE) + 1} to {Math.min(currentPage * CAMPAIGNS_PER_PAGE, totalCampaigns)} of {totalCampaigns} campaigns
              </p>
              <div className="flex gap-2">
                <Link href={`/account/admin/campaigns?page=${currentPage - 1}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrevPage}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Link href={`/account/admin/campaigns?page=${currentPage + 1}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    sending: "bg-purple-100 text-purple-800",
    sent: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
