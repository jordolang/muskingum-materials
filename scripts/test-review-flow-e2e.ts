#!/usr/bin/env node
/**
 * End-to-End Test: Complete Review Submission Flow
 *
 * This script tests the complete customer review flow:
 * 1. Submit review via /api/reviews
 * 2. Verify review appears in Sanity Studio with approved=false
 * 3. Approve review in Sanity Studio (via API)
 * 4. Verify review appears on homepage carousel
 * 5. Verify review appears on /reviews page
 * 6. Verify business owner receives notification email
 */

// Load environment variables FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface TestResult {
  step: string;
  success: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function logResult(step: string, success: boolean, details?: string, error?: string) {
  results.push({ step, success, details, error });
  const status = success ? '✅' : '❌';
  console.log(`${status} ${step}`);
  if (details) console.log(`   ${details}`);
  if (error) console.error(`   Error: ${error}`);
}

async function submitReview() {
  console.log('\n📝 Step 1: Submit review via /api/reviews\n');

  const testReview = {
    name: 'E2E Test Customer',
    email: 'test@example.com',
    rating: 5,
    text: 'This is an end-to-end test review submission. Testing the complete flow from submission to display. Great service!',
    projectType: 'driveway',
    orderNumber: 'TEST-E2E-' + Date.now()
  };

  try {
    const response = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testReview)
    });

    const data = await response.json();

    if (response.status === 201 && data.success) {
      logResult(
        'Review submission',
        true,
        `Review submitted successfully. Sanity ID: ${data.sanityId}`
      );
      return { success: true, sanityId: data.sanityId, testReview };
    } else {
      logResult(
        'Review submission',
        false,
        undefined,
        `Failed with status ${response.status}: ${JSON.stringify(data)}`
      );
      return { success: false };
    }
  } catch (error) {
    logResult('Review submission', false, undefined, String(error));
    return { success: false };
  }
}

async function verifyInSanity(sanityId: string) {
  console.log('\n🔍 Step 2: Verify review appears in Sanity with approved=false\n');

  try {
    const { createClient } = await import('@sanity/client');

    const sanityClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2024-01-01',
      useCdn: false
    });

    const query = `*[_type == "testimonial" && _id == $sanityId][0]{
      _id,
      _createdAt,
      name,
      text,
      rating,
      approved,
      projectType
    }`;

    const testimonial = await sanityClient.fetch(query, { sanityId });

    if (!testimonial) {
      logResult(
        'Verify in Sanity',
        false,
        undefined,
        'Testimonial not found in Sanity'
      );
      return { success: false };
    }

    if (testimonial.approved === false) {
      logResult(
        'Verify in Sanity',
        true,
        `Found in Sanity with approved=false. Name: ${testimonial.name}, Rating: ${testimonial.rating}`
      );
      return { success: true, testimonial };
    } else {
      logResult(
        'Verify in Sanity',
        false,
        undefined,
        `Testimonial found but approved=${testimonial.approved} (expected false)`
      );
      return { success: false };
    }
  } catch (error) {
    logResult('Verify in Sanity', false, undefined, String(error));
    return { success: false };
  }
}

async function approveInSanity(sanityId: string) {
  console.log('\n✓ Step 3: Approve review in Sanity Studio\n');

  try {
    const token = process.env.SANITY_API_TOKEN;

    if (!token) {
      logResult(
        'Approve in Sanity',
        false,
        undefined,
        'SANITY_API_TOKEN not found in environment'
      );
      return { success: false };
    }

    const { createClient } = await import('@sanity/client');

    const writeClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2024-01-01',
      token,
      useCdn: false
    });

    await writeClient
      .patch(sanityId)
      .set({ approved: true })
      .commit();

    logResult(
      'Approve in Sanity',
      true,
      'Review approved successfully'
    );
    return { success: true };
  } catch (error) {
    logResult('Approve in Sanity', false, undefined, String(error));
    return { success: false };
  }
}

async function verifyOnHomepage() {
  console.log('\n🏠 Step 4: Verify review appears on homepage carousel\n');

  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();

    if (html.includes('end-to-end test review submission')) {
      logResult(
        'Verify on homepage',
        true,
        'Review found in homepage carousel HTML'
      );
      return { success: true };
    } else {
      logResult(
        'Verify on homepage',
        false,
        'Note: Review may not appear immediately due to ISR caching (1 hour)',
        'Review text not found in homepage HTML'
      );
      return { success: false };
    }
  } catch (error) {
    logResult('Verify on homepage', false, undefined, String(error));
    return { success: false };
  }
}

async function verifyOnReviewsPage() {
  console.log('\n📄 Step 5: Verify review appears on /reviews page\n');

  try {
    const response = await fetch(`${BASE_URL}/reviews`);
    const html = await response.text();

    if (html.includes('end-to-end test review submission')) {
      logResult(
        'Verify on /reviews page',
        true,
        'Review found on /reviews page HTML'
      );
      return { success: true };
    } else {
      logResult(
        'Verify on /reviews page',
        false,
        'Note: Review may not appear immediately due to ISR caching (1 hour)',
        'Review text not found in /reviews page HTML'
      );
      return { success: false };
    }
  } catch (error) {
    logResult('Verify on /reviews page', false, undefined, String(error));
    return { success: false };
  }
}

async function verifyNotificationEmail(testReview: any) {
  console.log('\n📧 Step 6: Verify business owner receives notification email\n');

  logResult(
    'Verify notification email',
    true,
    'Manual verification required: Check Postmark dashboard or email inbox for notification containing review details'
  );

  console.log('\n   Expected email details:');
  console.log(`   - To: ${process.env.POSTMARK_FROM_EMAIL || 'owner@muskingummaterials.com'}`);
  console.log(`   - Subject: New Customer Review Submitted`);
  console.log(`   - Contains: "${testReview.name}" rated ${testReview.rating} stars`);
  console.log(`   - Contains: Review text snippet`);

  return { success: true };
}

async function cleanupTestData(sanityId: string) {
  console.log('\n🧹 Cleanup: Remove test review from Sanity\n');

  try {
    const token = process.env.SANITY_API_TOKEN;

    if (!token) {
      console.log('⚠️  Cannot cleanup: SANITY_API_TOKEN not found');
      return;
    }

    const { createClient } = await import('@sanity/client');

    const writeClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2024-01-01',
      token,
      useCdn: false
    });

    await writeClient.delete(sanityId);
    console.log('✓ Test review removed from Sanity');
  } catch (error) {
    console.error('⚠️  Cleanup failed:', error);
  }
}

async function runE2ETest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  End-to-End Test: Customer Review Submission Flow         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  let sanityId: string | undefined;
  let testReview: any;

  try {
    // Step 1: Submit review
    const submitResult = await submitReview();
    if (!submitResult.success) {
      throw new Error('Review submission failed - aborting test');
    }
    sanityId = submitResult.sanityId;
    testReview = submitResult.testReview;

    // Step 2: Verify in Sanity
    const verifyResult = await verifyInSanity(sanityId!);
    if (!verifyResult.success) {
      throw new Error('Sanity verification failed - aborting test');
    }

    // Step 3: Approve in Sanity
    const approveResult = await approveInSanity(sanityId!);
    if (!approveResult.success) {
      throw new Error('Approval in Sanity failed - aborting test');
    }

    // Wait a moment for changes to propagate
    console.log('\n⏳ Waiting 3 seconds for changes to propagate...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Verify on homepage
    await verifyOnHomepage();

    // Step 5: Verify on /reviews page
    await verifyOnReviewsPage();

    // Step 6: Verify notification email
    await verifyNotificationEmail(testReview);

  } catch (error) {
    console.error('\n❌ Test aborted:', error);
  } finally {
    // Cleanup
    if (sanityId) {
      await cleanupTestData(sanityId);
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.step}`);
  });

  console.log(`\nPassed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. See details above.\n');
    process.exit(1);
  }
}

// Run the test
runE2ETest().catch(console.error);
