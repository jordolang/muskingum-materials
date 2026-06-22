"use client";

import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Truck, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
}

interface ScheduledOrder {
  id: string;
  orderNumber: string;
  name: string;
  email: string;
  phone: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  deliveryDate: Date | null;
  deliveryTimeWindow: string | null;
  deliveryAddress: string | null;
  createdAt: Date;
}

interface TimeWindow {
  key: string;
  label: string;
}

interface DeliveryConfig {
  capacityPerSlot: number;
  timeWindows: TimeWindow[];
}

interface DeliveryCalendarProps {
  orders: ScheduledOrder[];
  deliveryConfig: DeliveryConfig | null;
  currentMonth?: Date;
}

interface DayData {
  date: Date;
  dateKey: string;
  orders: ScheduledOrder[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function DeliveryCalendar({
  orders,
  deliveryConfig,
  currentMonth = new Date(),
}: DeliveryCalendarProps) {
  const [viewDate, setViewDate] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Get time windows from config or defaults
  const timeWindows = deliveryConfig?.timeWindows || [
    { key: "morning", label: "Morning (8am-12pm)" },
    { key: "afternoon", label: "Afternoon (12pm-5pm)" },
  ];

  const capacityPerSlot = deliveryConfig?.capacityPerSlot || 5;

  // Helper to get time window label
  const getTimeWindowLabel = (key: string | null) => {
    if (!key) return "Not specified";
    const window = timeWindows.find((w) => w.key === key);
    return window ? window.label : key;
  };

  // Generate calendar grid (6 weeks, starting from Sunday)
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);

    // Start from the Sunday before or on the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Generate 42 days (6 weeks)
    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];

      // Filter orders for this day
      const dayOrders = orders.filter((order) => {
        if (!order.deliveryDate) return false;
        const orderDateKey = new Date(order.deliveryDate)
          .toISOString()
          .split("T")[0];
        return orderDateKey === dateKey;
      });

      days.push({
        date,
        dateKey,
        orders: dayOrders,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toISOString().split("T")[0] === today.toISOString().split("T")[0],
      });
    }

    return days;
  }, [viewDate, orders]);

  // Calculate capacity usage for a day
  const getCapacityInfo = (dayOrders: ScheduledOrder[]) => {
    // Count orders per time window
    const windowCounts = new Map<string, number>();

    dayOrders.forEach((order) => {
      const window = order.deliveryTimeWindow || "unknown";
      windowCounts.set(window, (windowCounts.get(window) || 0) + 1);
    });

    // Calculate total used capacity
    const totalUsed = Array.from(windowCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    // Total capacity is capacityPerSlot * number of time windows
    const totalCapacity = capacityPerSlot * timeWindows.length;

    const percentUsed = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

    return {
      used: totalUsed,
      total: totalCapacity,
      percentUsed,
      windowCounts,
    };
  };

  // Get color based on capacity usage
  const getCapacityColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "bg-red-500";
    if (percentUsed >= 70) return "bg-orange-500";
    if (percentUsed >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Navigate to previous month
  const previousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setViewDate(new Date());
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold font-heading">
                {viewDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousMonth}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
                className="gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayData) => {
              const capacityInfo = getCapacityInfo(dayData.orders);
              const hasOrders = dayData.orders.length > 0;

              return (
                <button
                  key={dayData.dateKey}
                  type="button"
                  onClick={() => hasOrders && setSelectedDay(dayData)}
                  className={cn(
                    "relative min-h-[80px] sm:min-h-[100px] p-2 rounded-lg border transition-all",
                    "flex flex-col items-start",
                    dayData.isCurrentMonth
                      ? "bg-background hover:bg-muted/50"
                      : "bg-muted/20 text-muted-foreground",
                    dayData.isToday && "ring-2 ring-primary ring-offset-2",
                    hasOrders && "cursor-pointer hover:shadow-md",
                    !hasOrders && "cursor-default"
                  )}
                >
                  {/* Date number */}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      dayData.isToday && "text-primary font-bold"
                    )}
                  >
                    {dayData.date.getDate()}
                  </span>

                  {/* Order count and capacity bar */}
                  {hasOrders && (
                    <div className="mt-auto w-full space-y-1">
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {dayData.orders.length}
                        </span>
                      </div>

                      {/* Capacity bar */}
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            getCapacityColor(capacityInfo.percentUsed)
                          )}
                          style={{ width: `${Math.min(capacityInfo.percentUsed, 100)}%` }}
                        />
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {capacityInfo.used}/{capacityInfo.total} capacity
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="font-medium">Capacity:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Light (&lt;40%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Moderate (40-70%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>High (70-90%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Critical (90%+)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedDay?.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <Badge variant="secondary">
                {selectedDay?.orders.length} deliveries
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-3">
              {/* Capacity Summary */}
              {(() => {
                const capacityInfo = getCapacityInfo(selectedDay.orders);
                return (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Capacity Usage
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {capacityInfo.used} / {capacityInfo.total} slots used
                      </span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          getCapacityColor(capacityInfo.percentUsed)
                        )}
                        style={{
                          width: `${Math.min(capacityInfo.percentUsed, 100)}%`,
                        }}
                      />
                    </div>
                    {/* Window breakdown */}
                    <div className="mt-2 space-y-1">
                      {Array.from(capacityInfo.windowCounts.entries()).map(
                        ([window, count]) => (
                          <div
                            key={window}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted-foreground">
                              {getTimeWindowLabel(window)}
                            </span>
                            <span className="font-medium">
                              {count} / {capacityPerSlot}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Orders List */}
              <div className="space-y-2">
                {selectedDay.orders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold font-mono text-sm">
                                {order.orderNumber}
                              </p>
                              <Badge
                                variant={
                                  order.status === "completed"
                                    ? "default"
                                    : order.status === "pending"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {order.status}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeWindowLabel(order.deliveryTimeWindow)}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">
                              {order.name}
                              <span className="text-muted-foreground text-xs ml-2">
                                {order.email}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {order.items
                                .map(
                                  (i) =>
                                    `${i.name} (${i.quantity} ${i.unit}${i.quantity !== 1 ? "s" : ""})`
                                )
                                .join(", ")}
                            </p>
                            {order.deliveryAddress && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                📍 {order.deliveryAddress}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              ${order.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
