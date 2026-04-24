import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    pending: { label: "Pending", variant: "outline" },
    confirmed: { label: "Confirmed", variant: "default" },
    processing: { label: "Processing", variant: "secondary" },
    ready: { label: "Ready", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    canceled: { label: "Canceled", variant: "outline" },
  };
  const { label, variant } =
    config[status] || { label: status, variant: "outline" as const };
  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}
