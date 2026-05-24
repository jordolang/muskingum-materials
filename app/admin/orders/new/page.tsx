import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getProducts } from "@/lib/products";
import { PhoneOrderForm } from "@/components/admin/phone-order-form";

export const metadata = { title: "New Phone Order" };

export default async function NewPhoneOrderPage() {
  await requireAdmin();

  const products = await getProducts();
  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    price: p.price ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <h1 className="text-2xl font-bold font-heading">New Phone Order</h1>
        <p className="text-sm text-muted-foreground">
          Enter a phone-taken order for the customer. No Stripe — payment collected at pickup or delivery.
        </p>
      </div>

      <PhoneOrderForm products={productOptions} />
    </div>
  );
}
