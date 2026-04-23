"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Edit, Pause, Play, Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecurringOrderForm } from "./recurring-order-form";

interface RecurringOrder {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  items: unknown;
  deliveryAddress: string;
  deliveryNotes: string | null;
  frequency: string;
  nextDeliveryDate: Date;
  status: string;
  createdAt: Date;
}

interface RecurringOrdersClientProps {
  orders: RecurringOrder[];
}

export function RecurringOrdersClient({ orders }: RecurringOrdersClientProps) {
  const [recurringOrders, setRecurringOrders] = useState(orders);
  const [editingOrder, setEditingOrder] = useState<RecurringOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handlePauseResume(order: RecurringOrder) {
    const newStatus = order.status === "active" ? "paused" : "active";
    setProcessingId(order.id);

    try {
      const response = await fetch(`/api/account/recurring-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      const result = await response.json();
      setRecurringOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update order");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(orderId: string) {
    if (!confirm("Are you sure you want to cancel this recurring order?")) {
      return;
    }

    setProcessingId(orderId);

    try {
      const response = await fetch(`/api/account/recurring-orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      setRecurringOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to cancel order");
    } finally {
      setProcessingId(null);
    }
  }

  function handleEdit(order: RecurringOrder) {
    setEditingOrder(order);
    setShowForm(true);
  }

  function handleCreateNew() {
    setEditingOrder(null);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingOrder(null);
  }

  async function handleFormSuccess() {
    // Refresh the orders list
    try {
      const response = await fetch("/api/account/recurring-orders");
      const data = await response.json();
      setRecurringOrders(data.recurringOrders || []);
    } catch (error) {
      // Refresh the page as fallback
      window.location.reload();
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Recurring Order
        </Button>
      </div>

      <div className="space-y-3">
        {recurringOrders.map((order) => {
          const items = order.items as Array<{
            productName: string;
            quantity: number;
            unit: string;
          }>;
          const isProcessing = processingId === order.id;

          return (
            <Card
              key={order.id}
              className="border-0 shadow-md hover:shadow-lg transition-all"
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm">{order.name}</p>
                        <StatusBadge status={order.status} />
                        <FrequencyBadge frequency={order.frequency} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {items
                          .map(
                            (i) =>
                              `${i.productName} (${i.quantity} ${i.unit}${
                                i.quantity !== 1 ? "s" : ""
                              })`
                          )
                          .join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deliver to: {order.deliveryAddress.split("\n")[0]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Next Delivery
                        </p>
                        <p className="text-sm font-semibold">
                          {new Date(order.nextDeliveryDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(order)}
                      disabled={isProcessing}
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    {order.status !== "cancelled" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseResume(order)}
                          disabled={isProcessing}
                          className="gap-1"
                        >
                          {order.status === "active" ? (
                            <>
                              <Pause className="h-3 w-3" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              Resume
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          disabled={isProcessing}
                          className="gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <RecurringOrderForm
          order={editingOrder}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        map[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  const map: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Bi-Weekly",
    monthly: "Monthly",
  };
  return (
    <Badge variant="outline" className="text-xs">
      {map[frequency] || frequency}
    </Badge>
  );
}
