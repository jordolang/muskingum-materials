import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { CreditCard, FileText, Eye, AlertCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { prisma } from "@/lib/prisma";

export default async function BillingPage() {
  const session = await auth();
  const userId = session?.userId ?? null;

  let userProfile: {
    netTermsApproved: boolean;
    netTermsCreditLimit: number | null;
    netTermsBalance: number;
    netTermsLength: number | null;
  } | null = null;
  let openInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    status: string;
    order: {
      orderNumber: string;
    };
  }> = [];

  try {
    // Fetch user profile with net terms info
    userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId ?? undefined },
      select: {
        netTermsApproved: true,
        netTermsCreditLimit: true,
        netTermsBalance: true,
        netTermsLength: true,
      },
    });

    // Fetch open invoices if user is approved
    if (userProfile?.netTermsApproved) {
      const invoices = await prisma.invoice.findMany({
        where: {
          order: {
            userId: userId ?? undefined,
          },
          status: {
            in: ["pending", "overdue"],
          },
        },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          dueDate: true,
          status: true,
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
      });
      openInvoices = invoices;
    }
  } catch {
    // DB not ready
  }

  // If user is not approved for net terms, show informational message
  if (!userProfile?.netTermsApproved) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your credit terms and invoices
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Net Terms Not Enabled</AlertTitle>
          <AlertDescription>
            Your account is not currently approved for net terms billing. Contact us to
            inquire about contractor account terms and credit limits.
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Contractor Billing</h2>
            <p className="text-muted-foreground mb-6">
              Approved contractors can view credit limits, balances, and open invoices
              here.
            </p>
            <Link href="/contact">
              <Button>Contact Us</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const creditLimit = userProfile.netTermsCreditLimit ?? 0;
  const balance = userProfile.netTermsBalance;
  const availableCredit = Math.max(0, creditLimit - balance);
  const termsLength = userProfile.netTermsLength ?? 30;

  // Check for overdue invoices
  const now = new Date();
  const hasOverdueInvoices = openInvoices.some(
    (invoice) => new Date(invoice.dueDate) < now && invoice.status !== "paid"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Billing</h1>
        <p className="text-sm text-muted-foreground">
          View your credit limit, balance, and open invoices
        </p>
      </div>

      {hasOverdueInvoices && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Overdue Invoices</AlertTitle>
          <AlertDescription>
            You have one or more overdue invoices. Please review and pay them to avoid
            service interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credit Limit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${creditLimit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Net {termsLength} terms
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {openInvoices.length} open invoice{openInvoices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Credit
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${availableCredit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((availableCredit / creditLimit) * 100).toFixed(0)}% available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Open Invoices Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Open Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {openInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No open invoices</h2>
              <p className="text-muted-foreground">
                All your invoices are paid. Place a new order to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-5 py-3 font-semibold">Invoice #</th>
                    <th className="text-left px-5 py-3 font-semibold">Order #</th>
                    <th className="text-left px-5 py-3 font-semibold">Due Date</th>
                    <th className="text-right px-5 py-3 font-semibold">Amount</th>
                    <th className="text-center px-5 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {openInvoices.map((invoice) => {
                    const dueDate = new Date(invoice.dueDate);
                    const isOverdue = dueDate < now;
                    const daysDiff = Math.ceil(
                      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr
                        key={invoice.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono font-medium">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">
                          {invoice.order.orderNumber}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                              {dueDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {isOverdue
                                ? `${Math.abs(daysDiff)} day${
                                    Math.abs(daysDiff) !== 1 ? "s" : ""
                                  } overdue`
                                : `Due in ${daysDiff} day${daysDiff !== 1 ? "s" : ""}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">
                          ${invoice.amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/account/orders/${invoice.order.orderNumber}`}>
                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Link href="/account/invoices">
          <Button variant="outline">View All Invoices</Button>
        </Link>
        <Link href="/order">
          <Button>Place New Order</Button>
        </Link>
      </div>
    </div>
  );
}
