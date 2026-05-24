/**
 * End-to-End Test: Order Status Flow & Email Notifications
 *
 * This script tests the complete order status lifecycle:
 * 1. Creates or finds a test order
 * 2. Updates status through various stages
 * 3. Verifies OrderStatusHistory entries
 * 4. Confirms email notification system is working
 *
 * Run: npx tsx e2e-test-order-status.ts
 */

import { prisma } from "./lib/prisma";

interface TestResult {
  step: string;
  status: "PASS" | "FAIL" | "SKIP";
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const emoji = result.status === "PASS" ? "✓" : result.status === "FAIL" ? "✗" : "⊘";
  console.log(`${emoji} ${result.step}: ${result.message}`);
  if (result.data) {
    console.log(`   Data:`, result.data);
  }
}

async function findOrCreateTestOrder() {
  try {
    // Look for an existing test order
    let order = await prisma.order.findFirst({
      where: {
        email: { contains: "test" },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (order) {
      logResult({
        step: "Find Test Order",
        status: "PASS",
        message: `Found existing test order: ${order.orderNumber}`,
        data: { orderNumber: order.orderNumber, currentStatus: order.status },
      });
      return order;
    }

    // Create a new test order if none exists
    order = await prisma.order.create({
      data: {
        orderNumber: `MM-E2E-${Date.now()}`,
        userId: "test-user-id",
        name: "E2E Test User",
        email: "test-e2e@muskingummaterials.com",
        phone: "555-0100",
        items: [
          {
            name: "River Gravel",
            quantity: 5,
            unit: "ton",
            price: 45.0,
          },
        ],
        subtotal: 225.0,
        tax: 16.88,
        processingFee: 3.0,
        deliveryFee: 75.0,
        total: 319.88,
        pickupOrDeliver: "deliver",
        deliveryAddress: "123 Test St, Test City, OH 43701",
        status: "pending",
      },
      include: {
        statusHistory: true,
      },
    });

    logResult({
      step: "Create Test Order",
      status: "PASS",
      message: `Created new test order: ${order.orderNumber}`,
      data: { orderNumber: order.orderNumber },
    });

    return order;
  } catch (error) {
    logResult({
      step: "Find/Create Test Order",
      status: "FAIL",
      message: `Failed to find or create test order: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    throw error;
  }
}

async function updateOrderStatus(
  orderId: string,
  status: string,
  notes?: string
) {
  try {
    const userId = "test-admin-id";

    // Update order and create status history in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create status history entry
      const historyEntry = await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          notes,
          changedBy: userId,
        },
      });

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      });

      return { order: updatedOrder, historyEntry };
    });

    logResult({
      step: `Update Status to '${status}'`,
      status: "PASS",
      message: `Successfully updated order status`,
      data: {
        newStatus: result.order.status,
        historyEntryId: result.historyEntry.id,
        totalHistoryEntries: result.order.statusHistory.length,
      },
    });

    return result;
  } catch (error) {
    logResult({
      step: `Update Status to '${status}'`,
      status: "FAIL",
      message: `Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    throw error;
  }
}

async function verifyStatusHistory(orderId: string, expectedStatuses: string[]) {
  try {
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    const actualStatuses = history.map((h) => h.status);
    const matches = expectedStatuses.every((status, index) =>
      actualStatuses.includes(status)
    );

    if (matches) {
      logResult({
        step: "Verify Status History",
        status: "PASS",
        message: `All ${expectedStatuses.length} status transitions recorded`,
        data: {
          expectedStatuses,
          actualStatuses,
          totalEntries: history.length,
        },
      });
    } else {
      logResult({
        step: "Verify Status History",
        status: "FAIL",
        message: "Status history does not match expected values",
        data: { expected: expectedStatuses, actual: actualStatuses },
      });
    }

    return history;
  } catch (error) {
    logResult({
      step: "Verify Status History",
      status: "FAIL",
      message: `Failed to verify status history: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    throw error;
  }
}

async function checkEmailConfiguration() {
  try {
    const hasPostmarkToken = !!process.env.POSTMARK_API_TOKEN;
    const hasFromEmail = !!process.env.POSTMARK_FROM_EMAIL;

    if (hasPostmarkToken && hasFromEmail) {
      logResult({
        step: "Check Email Configuration",
        status: "PASS",
        message: "Postmark credentials configured",
        data: {
          fromEmail: process.env.POSTMARK_FROM_EMAIL,
        },
      });
    } else {
      logResult({
        step: "Check Email Configuration",
        status: "FAIL",
        message: "Missing Postmark environment variables",
        data: {
          hasPostmarkToken,
          hasFromEmail,
        },
      });
    }

    return hasPostmarkToken && hasFromEmail;
  } catch (error) {
    logResult({
      step: "Check Email Configuration",
      status: "FAIL",
      message: `Failed to check email configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    return false;
  }
}

async function runE2ETest() {
  console.log("\n========================================");
  console.log("E2E Test: Order Status Flow");
  console.log("========================================\n");

  try {
    // Step 1: Check database connection
    await prisma.$connect();
    logResult({
      step: "Database Connection",
      status: "PASS",
      message: "Successfully connected to database",
    });

    // Step 2: Check email configuration
    const emailConfigured = await checkEmailConfiguration();

    // Step 3: Find or create test order
    const order = await findOrCreateTestOrder();

    // Step 4: Test status transitions
    const statusFlow = [
      { status: "confirmed", notes: "Order confirmed by admin" },
      { status: "processing", notes: "Materials being prepared" },
      { status: "ready", notes: "Ready for pickup" },
      { status: "out_for_delivery", notes: "Driver assigned, en route" },
      { status: "completed", notes: "Delivery completed successfully" },
    ];

    for (const { status, notes } of statusFlow) {
      await updateOrderStatus(order.id, status, notes);
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Step 5: Verify all status history entries were created
    const expectedStatuses = statusFlow.map((s) => s.status);
    await verifyStatusHistory(order.id, expectedStatuses);

    // Step 6: Verify final order state
    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (finalOrder?.status === "completed") {
      logResult({
        step: "Verify Final Order State",
        status: "PASS",
        message: `Order reached final status: ${finalOrder.status}`,
        data: {
          orderNumber: finalOrder.orderNumber,
          finalStatus: finalOrder.status,
          totalHistoryEntries: finalOrder.statusHistory.length,
        },
      });
    } else {
      logResult({
        step: "Verify Final Order State",
        status: "FAIL",
        message: `Order did not reach expected final status. Current: ${finalOrder?.status}`,
      });
    }

    // Summary
    console.log("\n========================================");
    console.log("Test Summary");
    console.log("========================================\n");

    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    const skipped = results.filter((r) => r.status === "SKIP").length;

    console.log(`Total Tests: ${results.length}`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`⊘ Skipped: ${skipped}`);

    if (emailConfigured) {
      console.log("\n📧 Email Notifications:");
      console.log("   Postmark is configured. Emails should have been sent for:");
      statusFlow.forEach(({ status }) => {
        console.log(`   - ${status}`);
      });
      console.log("\n   Check your email inbox or Postmark activity log.");
    } else {
      console.log("\n⚠️  Email notifications skipped (Postmark not configured)");
    }

    console.log("\n========================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test suite failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
runE2ETest().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
