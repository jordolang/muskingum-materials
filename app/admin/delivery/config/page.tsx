import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryConfigForm } from "@/components/admin/delivery-config-form";

export const metadata: Metadata = {
  title: "Delivery Configuration",
  description: "Configure delivery scheduling settings, capacity, and availability.",
};

export default function DeliveryConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Delivery Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Manage delivery days, time windows, capacity, and blackout dates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryConfigForm />
        </CardContent>
      </Card>
    </div>
  );
}
