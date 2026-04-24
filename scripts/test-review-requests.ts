import { prisma } from "../lib/prisma";
import { sendReviewRequests } from "../lib/jobs/send-review-requests";

async function testReviewRequests() {
  console.log("🧪 Testing review request functionality...\n");

  // Clean up any existing test data
  await prisma.order.deleteMany({
    where: { orderNumber: { startsWith: "TEST-" } },
  });
  await prisma.reviewSubmission.deleteMany({
    where: { orderNumber: { startsWith: "TEST-" } },
  });

  // Create a test order completed 2 minutes ago
  const testOrderNumber = `TEST-${Date.now()}`;
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  const testOrder = await prisma.order.create({
    data: {
      orderNumber: testOrderNumber,
      name: "Test Customer",
      email: "test@example.com",
      items: [],
      subtotal: 100,
      tax: 10,
      processingFee: 5,
      deliveryFee: 0,
      total: 115,
      status: "completed",
      completedAt: twoMinutesAgo,
      paymentStatus: "paid",
    },
  });

  console.log(`✅ Created test order: ${testOrder.orderNumber}`);
  console.log(`   Completed at: ${testOrder.completedAt?.toISOString()}`);
  console.log(`   Email: ${testOrder.email}\n`);

  // Set delay to 1 minute for testing
  process.env.REVIEW_REQUEST_DELAY_MINUTES = "1";
  console.log("⏱️  Delay set to 1 minute for testing\n");

  // Run the job
  console.log("🚀 Running review request job...\n");
  const result = await sendReviewRequests();

  console.log("📊 Results:");
  console.log(`   Emails sent: ${result.emailsSent}`);
  console.log(`   Errors: ${result.errors}\n`);

  // Check if review submission was created
  const reviewSubmission = await prisma.reviewSubmission.findFirst({
    where: { orderNumber: testOrderNumber },
  });

  if (reviewSubmission) {
    console.log("✅ Review submission tracking created");
    console.log(`   Submitted at: ${reviewSubmission.submittedAt.toISOString()}\n`);
  } else {
    console.log("❌ No review submission tracking found\n");
  }

  // Test that it doesn't send duplicate emails
  console.log("🔄 Testing duplicate prevention...\n");
  const result2 = await sendReviewRequests();
  console.log("📊 Second run results:");
  console.log(`   Emails sent: ${result2.emailsSent} (should be 0)`);
  console.log(`   Errors: ${result2.errors}\n`);

  // Clean up
  await prisma.order.delete({ where: { orderNumber: testOrderNumber } });
  await prisma.reviewSubmission.deleteMany({
    where: { orderNumber: testOrderNumber },
  });

  console.log("✨ Test complete! Cleanup done.\n");

  if (!process.env.POSTMARK_API_TOKEN) {
    console.log("⚠️  Note: POSTMARK_API_TOKEN not set - emails were not actually sent");
    console.log("   Set this env var to test actual email sending\n");
  }
}

testReviewRequests()
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
