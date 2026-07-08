import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { QuoteForm } from "@/components/admin/quote-form";
import { requireAdmin } from "@/lib/admin-auth";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    contacted: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    quoted: { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
    accepted: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
    rejected: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  const config = variants[status] || { variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  // Check admin authentication
  await requireAdmin();

  const { id } = await params;

  let quote;
  try {
    quote = await prisma.quoteRequest.findUnique({
      where: { id },
    });
  } catch {
    // DB not ready
  }

  if (!quote) notFound();

  const products = quote.products as Array<{ name: string; category?: string }> | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/quotes"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Quote Requests
        </Link>
        <h1 className="text-2xl font-bold font-heading">{quote.name}</h1>
        <p className="text-sm text-muted-foreground">
          Requested on{" "}
          {new Date(quote.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex gap-3">
        <StatusBadge status={quote.status} />
      </div>

      {/* Products Requested (read-only context — not editable here) */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products Requested
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {products.map((product, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {product.name}
                  {product.category && (
                    <span className="ml-1 text-muted-foreground">
                      ({product.category})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No products specified</p>
          )}
        </CardContent>
      </Card>

      {/* Editable Form */}
      <QuoteForm
        quote={{
          id: quote.id,
          name: quote.name,
          email: quote.email,
          phone: quote.phone,
          company: quote.company,
          quantity: quote.quantity,
          deliveryAddr: quote.deliveryAddr,
          notes: quote.notes,
          status: quote.status,
        }}
      />
    </div>
  );
}
