import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { FileText, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

const ITEMS_PER_PAGE = 10;

interface InvoicesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const session = await auth();
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  let orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    createdAt: Date;
    items: unknown;
    name: string;
  }> = [];
  let totalCount = 0;

  try {
    const where = { userId: session?.userId ?? undefined };

    [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: ITEMS_PER_PAGE,
        skip,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
          items: true,
          name: true,
        },
      }),
      prisma.order.count({ where }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and download invoices for your orders
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No invoices yet</h2>
            <p className="text-muted-foreground mb-6">
              Invoices are generated when you place an order.
            </p>
            <Link href="/order">
              <Button>Place an Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              All Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-5 py-3 font-semibold">Invoice #</th>
                    <th className="text-left px-5 py-3 font-semibold">Date</th>
                    <th className="text-right px-5 py-3 font-semibold">Amount</th>
                    <th className="text-center px-5 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {order.paymentStatus === "paid" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                        ) : (
                          <Badge variant="outline">Unpaid</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/account/orders/${order.orderNumber}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {skip + 1} to {Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} invoices
                </p>
                <div className="flex items-center gap-2">
                  <Link href={`/account/invoices?page=${currentPage - 1}`}>
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
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Link href={`/account/invoices?page=${currentPage + 1}`}>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
