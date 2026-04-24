import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  products: unknown;
  quantity: string | null;
  deliveryAddr: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QuotesTableProps {
  quotes: QuoteRequest[];
}

export function QuotesTable({ quotes }: QuotesTableProps) {
  if (quotes.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No quote requests found</h2>
          <p className="text-muted-foreground">
            Quote requests will appear here as customers submit them.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const products = quote.products as Array<{ name: string }>;
        const productNames = products.map((p) => p.name).join(", ");
        return (
          <Link key={quote.id} href={`/admin/quotes/${quote.id}`}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold font-mono text-sm">
                        {quote.id.slice(0, 8).toUpperCase()}
                      </p>
                      <StatusBadge status={quote.status} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <div>
                        <p className="text-sm font-medium">{quote.name}</p>
                        {quote.company && (
                          <p className="text-xs text-muted-foreground font-medium">{quote.company}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{quote.email}</p>
                        {quote.phone && (
                          <p className="text-xs text-muted-foreground">{quote.phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(quote.createdAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {productNames}
                        </p>
                        {quote.quantity && (
                          <p className="text-xs text-muted-foreground">
                            Qty: {quote.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {quote.deliveryAddr ? (
                        <p className="text-xs text-muted-foreground">Delivery</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pickup</p>
                      )}
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
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewing: "bg-blue-100 text-blue-800",
    quoted: "bg-purple-100 text-purple-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
