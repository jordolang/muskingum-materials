import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, FileText, UserPlus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsData {
  ordersThisWeek: number;
  pendingQuotes: number;
  newLeads: number;
  revenue: number;
}

interface MetricsDashboardProps {
  data: MetricsData;
}

export function MetricsDashboard({ data }: MetricsDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Orders This Week"
        value={data.ordersThisWeek}
        icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        description="New orders in the last 7 days"
      />
      <MetricCard
        title="Pending Quotes"
        value={data.pendingQuotes}
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        description="Awaiting response"
      />
      <MetricCard
        title="New Leads"
        value={data.newLeads}
        icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
        description="Uncontacted leads"
      />
      <MetricCard
        title="Total Revenue"
        value={`$${data.revenue.toFixed(2)}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        description="All-time revenue"
      />
    </div>
  );
}
