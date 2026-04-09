import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function InvoicesPage() {
  const session = await auth();

  let orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    createdAt: Date;
    items: unknown;
    name: string;
  }> = [];

  try {
    orders = await prisma.order.findMany({
      where: { userId: session?.userId ?? undefined },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        createdAt: true,
        items: true,
        name: true,
      },
    });
  } catch {
    // DB not ready
  }

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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
