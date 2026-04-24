import { Badge } from "@/components/ui/badge";

interface PaymentBadgeProps {
  status: string;
}

export function PaymentBadge({ status }: PaymentBadgeProps) {
  if (status === "paid") {
    return <Badge variant="default" className="text-xs bg-green-600">Paid</Badge>;
  }
  if (status === "unpaid") {
    return <Badge variant="outline" className="text-xs">Unpaid</Badge>;
  }
  return null;
}
