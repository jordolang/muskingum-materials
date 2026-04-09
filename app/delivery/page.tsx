import { DeliveryZoneMap } from "@/components/delivery/delivery-zone-map";

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-900 mb-2">Delivery Information</h1>
        <p className="text-gray-600 mb-8">
          Check if we deliver to your location and estimate delivery costs.
        </p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Delivery Service Area</h2>
          <DeliveryZoneMap />
        </div>
      </div>
    </div>
  );
}
