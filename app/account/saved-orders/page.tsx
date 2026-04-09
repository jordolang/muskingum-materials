import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Bookmark, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function SavedOrdersPage() {
  const session = await auth();

  let savedOrders: Array<{
    id: string;
    name: string;
    items: unknown;
    pickupOrDeliver: string;
    deliveryAddress: string | null;
    createdAt: Date;
  }> = [];

  try {
    savedOrders = await prisma.savedOrder.findMany({
      where: { userId: session?.userId ?? undefined },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not ready
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Saved Orders</h1>
          <p className="text-sm text-muted-foreground">
            Your saved order templates for quick reordering
          </p>
        </div>
        <Link href="/order">
          <Button className="gap-2">
            <Package className="h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {savedOrders.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Bookmark className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Save frequently ordered combinations as templates for future use.
            </p>
            <Link href="/order">
              <Button>Create Your First Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedOrders.map((savedOrder) => {
            const items = savedOrder.items as Array<{ name: string; quantity: number; unit: string }>;
            return (
              <Card key={savedOrder.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Bookmark className="h-4 w-4 text-amber-600" />
                        <p className="font-bold text-sm">
                          {savedOrder.name}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Saved {new Date(savedOrder.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {items.map((i) => `${i.name} (${i.quantity} ${i.unit}${i.quantity !== 1 ? "s" : ""})`).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground capitalize">
                          {savedOrder.pickupOrDeliver}
                        </p>
                        {savedOrder.deliveryAddress && (
                          <p className="text-xs text-muted-foreground">
                            Delivery saved
                          </p>
                        )}
                      </div>
                      <Button variant="default" size="sm" className="gap-2">
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
