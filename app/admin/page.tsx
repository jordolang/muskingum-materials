import { DollarSign, ShoppingCart, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

interface Metrics {
  ordersThisWeek: number;
  totalRevenue: number;
  pendingQuotes: number;
  newLeads: number;
}

export default async function AdminPage() {
  let metrics: Metrics = {
    ordersThisWeek: 0,
    totalRevenue: 0,
    pendingQuotes: 0,
    newLeads: 0,
  };

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [ordersThisWeek, allOrders, pendingQuotes, newLeads] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),
      prisma.order.findMany({
        select: {
          total: true,
        },
      }),
      prisma.quoteRequest.count({
        where: {
          status: "pending",
        },
      }),
      prisma.lead.count({
        where: {
          status: "new",
        },
      }),
    ]);

    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);

    metrics = {
      ordersThisWeek,
      totalRevenue,
      pendingQuotes,
      newLeads,
    };
  } catch {
    // DB not ready
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your business metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Orders This Week
                </p>
                <p className="text-2xl font-bold mt-2">
                  {metrics.ordersThisWeek}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold mt-2">
                  ${metrics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Quotes
                </p>
                <p className="text-2xl font-bold mt-2">
                  {metrics.pendingQuotes}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New Leads
                </p>
                <p className="text-2xl font-bold mt-2">
                  {metrics.newLeads}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
