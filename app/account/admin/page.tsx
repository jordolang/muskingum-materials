import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Users,
  Send,
  Clock,
  CheckCircle,
  ArrowRight,
  BarChart3,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = await currentUser();

  // Check admin access
  if (!session?.userId || user?.publicMetadata?.role !== "admin") {
    redirect("/account");
  }

  let campaigns: Array<{
    id: string;
    name: string;
    subject: string;
    status: string;
    recipientCount: number;
    sentAt: Date | null;
    createdAt: Date;
  }> = [];
  let campaignStats = { total: 0, draft: 0, sent: 0, scheduled: 0 };
  let subscriberStats = { total: 0, active: 0, inactive: 0 };

  try {
    // Fetch recent campaigns
    campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        recipientCount: true,
        sentAt: true,
        createdAt: true,
      },
    });

    // Get campaign status counts
    const statusCounts = await prisma.campaign.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    campaignStats = {
      total: statusCounts.reduce((sum, item) => sum + item._count.status, 0),
      draft: statusCounts.find((item) => item.status === "draft")?._count.status ?? 0,
      sent: statusCounts.find((item) => item.status === "sent")?._count.status ?? 0,
      scheduled: statusCounts.find((item) => item.status === "scheduled")?._count.status ?? 0,
    };

    // Get subscriber stats
    const activeSubscribers = await prisma.newsletterSubscriber.count({
      where: { active: true },
    });
    const inactiveSubscribers = await prisma.newsletterSubscriber.count({
      where: { active: false },
    });

    subscriberStats = {
      total: activeSubscribers + inactiveSubscribers,
      active: activeSubscribers,
      inactive: inactiveSubscribers,
    };
  } catch {
    // DB not ready or error
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage email campaigns and newsletter subscribers.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Mail className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{campaignStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Campaigns</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{subscriberStats.active}</p>
            <p className="text-xs text-muted-foreground">Active Subscribers</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Send className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{campaignStats.sent}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{campaignStats.draft + campaignStats.scheduled}</p>
            <p className="text-xs text-muted-foreground">Draft/Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
          <Link href="/account/admin/campaigns">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No campaigns yet</p>
              <Link href="/account/admin/campaigns/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create First Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/account/admin/campaigns/${campaign.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {campaign.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {campaign.sentAt
                        ? `Sent ${new Date(campaign.sentAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : `Created ${new Date(campaign.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <CampaignStatusBadge status={campaign.status} />
                      {campaign.recipientCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {campaign.recipientCount} recipients
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/account/admin/campaigns/new">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <PlusCircle className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-semibold text-sm">New Campaign</p>
                <p className="text-xs text-muted-foreground">Create email campaign</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/account/admin/campaigns">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Campaigns</p>
                <p className="text-xs text-muted-foreground">View all campaigns</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/account/admin/subscribers">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Subscribers</p>
                <p className="text-xs text-muted-foreground">Manage subscriber list</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    draft: { label: "Draft", variant: "outline" },
    scheduled: { label: "Scheduled", variant: "secondary" },
    sending: { label: "Sending", variant: "default" },
    sent: { label: "Sent", variant: "default" },
    failed: { label: "Failed", variant: "outline" },
  };
  const { label, variant } = config[status] || { label: status, variant: "outline" as const };
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}
