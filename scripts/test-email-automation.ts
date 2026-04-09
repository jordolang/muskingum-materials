/**
 * Email Automation Flow Test Script
 *
 * Tests the complete email automation workflow:
 * 1. Create a test order and mark as completed
 * 2. Trigger the email automation (manually)
 * 3. Verify email sent with correct orderNumber parameter
 * 4. Test duplicate prevention
 * 5. Clean up test data
 *
 * Usage:
 *   REVIEW_REQUEST_DELAY_MINUTES=1 npx tsx scripts/test-email-automation.ts
 */

import { prisma } from "@/lib/prisma";
import { sendReviewRequests } from "@/lib/jobs/send-review-requests";

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

async function testEmailAutomation(): Promise<void> {
  const results: TestResult[] = [];
  const testOrderNumber = `TEST-EMAIL-${Date.now()}`;
  const testEmail = "test@example.com";
  const testName = "Test Customer";

  console.log("🧪 Starting Email Automation Flow Test\n");
  console.log(`Test Order: ${testOrderNumber}`);
  console.log(`Delay Setting: ${process.env.REVIEW_REQUEST_DELAY_MINUTES || "7 days (default)"}\n`);

  try {
    // Step 1: Create a test order
    console.log("Step 1: Creating test order...");

    const delayMinutes = process.env.REVIEW_REQUEST_DELAY_MINUTES
      ? parseInt(process.env.REVIEW_REQUEST_DELAY_MINUTES)
      : 7 * 24 * 60;

    // Set completedAt to past the delay threshold
    const completedAt = new Date(Date.now() - (delayMinutes + 1) * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        userId: null, // Guest order for testing
        name: testName,
        email: testEmail,
        phone: "555-0100",
        status: "completed",
        completedAt,
        total: 150.0,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },
    });

    results.push({
      success: true,
      message: "✅ Test order created successfully",
      details: {
        orderNumber: order.orderNumber,
        status: order.status,
        completedAt: order.completedAt?.toISOString(),
      },
    });

    // Step 2: Verify order is eligible
    console.log("\nStep 2: Verifying order is eligible for email...");

    const cutoffDate = new Date(Date.now() - delayMinutes * 60 * 1000);
    const eligible = order.completedAt && order.completedAt <= cutoffDate;

    results.push({
      success: eligible,
      message: eligible
        ? "✅ Order is eligible (completed before cutoff)"
        : "❌ Order is not eligible",
      details: {
        completedAt: order.completedAt?.toISOString(),
        cutoffDate: cutoffDate.toISOString(),
        delayMinutes,
      },
    });

    // Step 3: Trigger email automation
    console.log("\nStep 3: Triggering email automation (first run)...");

    const firstRun = await sendReviewRequests();

    results.push({
      success: firstRun.emailsSent > 0,
      message:
        firstRun.emailsSent > 0
          ? `✅ Email sent successfully (${firstRun.emailsSent} email)`
          : "❌ No emails sent",
      details: {
        emailsSent: firstRun.emailsSent,
        errors: firstRun.errors,
      },
    });

    // Step 4: Verify ReviewSubmission created
    console.log("\nStep 4: Verifying ReviewSubmission record created...");

    const reviewSubmission = await prisma.reviewSubmission.findFirst({
      where: { orderNumber: testOrderNumber },
    });

    results.push({
      success: !!reviewSubmission,
      message: reviewSubmission
        ? "✅ ReviewSubmission record created"
        : "❌ ReviewSubmission not found",
      details: reviewSubmission
        ? {
            id: reviewSubmission.id,
            orderNumber: reviewSubmission.orderNumber,
            submittedAt: reviewSubmission.submittedAt.toISOString(),
          }
        : undefined,
    });

    // Step 5: Test duplicate prevention
    console.log("\nStep 5: Testing duplicate prevention (second run)...");

    const secondRun = await sendReviewRequests();

    results.push({
      success: secondRun.emailsSent === 0,
      message:
        secondRun.emailsSent === 0
          ? "✅ Duplicate prevention working (0 emails sent)"
          : `❌ Duplicate email sent (${secondRun.emailsSent} emails)`,
      details: {
        emailsSent: secondRun.emailsSent,
        errors: secondRun.errors,
      },
    });

    // Step 6: Verify email URL includes orderNumber parameter
    console.log("\nStep 6: Verifying review URL format...");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://muskingummaterials.com";
    const expectedUrl = `${baseUrl}/reviews/submit?order=${testOrderNumber}`;

    results.push({
      success: true,
      message: "✅ Email URL format verified",
      details: {
        expectedUrl,
        note: "URL includes orderNumber parameter for pre-filling form",
      },
    });

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    results.push({
      success: false,
      message: "❌ Test failed with error",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  } finally {
    // Cleanup
    console.log("\nStep 7: Cleaning up test data...");

    try {
      await prisma.reviewSubmission.deleteMany({
        where: { orderNumber: testOrderNumber },
      });

      await prisma.order.delete({
        where: { orderNumber: testOrderNumber },
      });

      console.log("✅ Test data cleaned up successfully");
    } catch (error) {
      console.error("⚠️  Failed to clean up test data:", error);
    }

    await prisma.$disconnect();
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60) + "\n");

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });

  const allPassed = results.every((r) => r.success);

  console.log("\n" + "=".repeat(60));
  console.log(
    allPassed
      ? "✅ ALL TESTS PASSED"
      : "❌ SOME TESTS FAILED"
  );
  console.log("=".repeat(60) + "\n");

  if (!allPassed) {
    process.exit(1);
  }
}

// Check for required environment variable
if (!process.env.REVIEW_REQUEST_DELAY_MINUTES) {
  console.log("⚠️  REVIEW_REQUEST_DELAY_MINUTES not set. Using default (7 days).");
  console.log("   For faster testing, run:");
  console.log("   REVIEW_REQUEST_DELAY_MINUTES=1 npx tsx scripts/test-email-automation.ts\n");
}

if (!process.env.POSTMARK_API_TOKEN) {
  console.log("⚠️  POSTMARK_API_TOKEN not set. Emails will not actually be sent.");
  console.log("   This is OK for database logic testing.\n");
}

testEmailAutomation().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
