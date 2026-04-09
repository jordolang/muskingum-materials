import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Bookmark, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { SavedOrderCard } from "@/components/account/saved-order-card";

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
              <SavedOrderCard
                key={savedOrder.id}
                savedOrder={{
                  ...savedOrder,
                  items,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
