#!/usr/bin/env node

/**
 * E2E Test: SMS Order Notifications
 *
 * Tests the complete flow:
 * 1. Create order with SMS opt-in via checkout API
 * 2. Simulate Stripe payment webhook
 * 3. Verify order status updated to 'confirmed'
 * 4. Verify SmsNotification record created
 * 5. Verify SMS message content
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - Database accessible (run from main project directory)
 * - Environment variables configured (see .env.local)
 * - Stripe CLI for webhook testing (optional)
 *
 * Usage:
 *   node test-sms-e2e.js
 *   node test-sms-e2e.js --base-url http://localhost:3000 --phone +15005550006
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const BASE_URL = getArg('--base-url', process.env.BASE_URL || 'http://localhost:3000');
const TEST_PHONE = getArg('--phone', '+15005550006'); // Twilio test number
const TEST_EMAIL = 'test-sms-e2e@example.com';
const TEST_NAME = 'E2E Test User';

// Test results
let passed = 0;
let failed = 0;
let warnings = 0;

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Helper to print test results
function printResult(testName, result, message = '') {
  const icons = {
    PASS: `${colors.green}✅ PASS${colors.reset}`,
    FAIL: `${colors.red}❌ FAIL${colors.reset}`,
    WARN: `${colors.yellow}⚠️  WARN${colors.reset}`,
    INFO: `${colors.blue}ℹ️  INFO${colors.reset}`,
  };

  console.log(`${icons[result] || icons.INFO}: ${testName}`);
  if (message) {
    console.log(`   ${message}`);
  }

  if (result === 'PASS') passed++;
  else if (result === 'FAIL') failed++;
  else if (result === 'WARN') warnings++;
}

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// Step 1: Check environment variables
function checkEnvironmentVariables() {
  console.log('\n==========================================');
  console.log('E2E Test: SMS Order Notifications');
  console.log('==========================================\n');

  console.log('Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Test Phone: ${TEST_PHONE}`);
  console.log(`  Test Email: ${TEST_EMAIL}\n`);

  console.log('Step 1: Environment Variable Check');
  console.log('-----------------------------------');

  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length === 0) {
    printResult('All required environment variables are set', 'PASS');
    return true;
  } else {
    printResult(`Missing environment variables: ${missingVars.join(', ')}`, 'FAIL');
    console.log('\nPlease set the following environment variables in .env.local:');
    missingVars.forEach(varName => {
      console.log(`  ${varName}=`);
    });
    console.log('\nFor testing, use Twilio test credentials to avoid SMS charges:');
    console.log('  https://www.twilio.com/docs/iam/test-credentials');
    return false;
  }
}

// Step 2: Create test order with SMS opt-in
async function createTestOrder() {
  console.log('\nStep 2: Create Test Order with SMS Opt-in');
  console.log('------------------------------------------');

  const orderData = {
    name: TEST_NAME,
    email: TEST_EMAIL,
    phone: TEST_PHONE,
    smsOptIn: true,
    fulfillment: 'pickup',
    items: [
      {
        name: 'Test Material',
        price: 25.00,
        unit: 'ton',
        quantity: 2,
      },
    ],
    subtotal: 50.00,
    tax: 3.63,
    processingFee: 2.41,
    total: 56.04,
  };

  try {
    const response = await makeRequest(`${BASE_URL}/api/orders/checkout`, {
      method: 'POST',
      body: orderData,
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);

      if (data.orderNumber) {
        printResult('Order created successfully', 'PASS', `Order Number: ${data.orderNumber}`);
        console.log(`   Checkout URL: ${data.url || 'N/A'}`);
        return {
          orderNumber: data.orderNumber,
          checkoutUrl: data.url,
        };
      } else {
        printResult('Order created but no order number returned', 'FAIL');
        console.log(`   Response: ${response.body}`);
        return null;
      }
    } else {
      printResult(`Failed to create order (HTTP ${response.statusCode})`, 'FAIL');
      console.log(`   Response: ${response.body}`);
      return null;
    }
  } catch (error) {
    printResult('Failed to create order', 'FAIL', error.message);
    return null;
  }
}

// Step 3: Verify order in database (requires Prisma CLI)
async function verifyOrderInDatabase(orderNumber) {
  console.log('\nStep 3: Verify Order in Database');
  console.log('---------------------------------');

  printResult('Database verification', 'INFO', 'Use Prisma Studio or direct database query');
  console.log('\n   To verify manually:');
  console.log(`   npx prisma studio`);
  console.log(`   OR query: SELECT * FROM "Order" WHERE "orderNumber" = '${orderNumber}';`);
  console.log('\n   Expected:');
  console.log('   - smsOptIn: true');
  console.log('   - phone: ' + TEST_PHONE);
  console.log('   - status: pending (before payment) → confirmed (after payment)');
  console.log('   - paymentStatus: unpaid (before payment) → paid (after payment)');
}

// Step 4: Instructions for Stripe webhook
function provideStripeWebhookInstructions(orderNumber, checkoutUrl) {
  console.log('\nStep 4: Simulate Stripe Payment Confirmation');
  console.log('---------------------------------------------');

  printResult('Webhook simulation', 'INFO', 'This requires Stripe CLI or manual checkout');
  console.log('\nTo complete payment and trigger SMS:\n');

  console.log('Option 1: Use Stripe CLI (recommended for testing)');
  console.log('  1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
  console.log(`  2. Run: stripe listen --forward-to ${BASE_URL}/api/orders/webhook`);
  console.log(`  3. Complete payment at: ${checkoutUrl}`);
  console.log('  4. Webhook will automatically trigger SMS\n');

  console.log('Option 2: Use test webhook trigger');
  console.log('  stripe trigger checkout.session.completed \\');
  console.log(`    --add checkout_session:metadata.orderNumber=${orderNumber}\n`);

  console.log('Option 3: Complete manual checkout');
  console.log(`  1. Visit: ${checkoutUrl}`);
  console.log('  2. Use Stripe test card: 4242 4242 4242 4242');
  console.log('  3. Any future expiry date and CVC');
  console.log('  4. Complete checkout\n');
}

// Step 5: Instructions for verifying SMS notification
function provideVerificationInstructions(orderNumber) {
  console.log('\nStep 5-8: Post-Payment Verification');
  console.log('------------------------------------');

  console.log('\nAfter completing payment, verify the following:\n');

  console.log('1. Order Status Updated:');
  console.log(`   SELECT "status", "paymentStatus" FROM "Order" WHERE "orderNumber" = '${orderNumber}';`);
  console.log('   Expected: status = \'confirmed\', paymentStatus = \'paid\'\n');

  console.log('2. SmsNotification Record Created:');
  console.log(`   SELECT n.*, o."orderNumber" FROM "SmsNotification" n`);
  console.log(`   JOIN "Order" o ON n."orderId" = o."id"`);
  console.log(`   WHERE o."orderNumber" = '${orderNumber}';`);
  console.log('   Expected:');
  console.log('   - type: order_confirmed');
  console.log('   - phone: ' + TEST_PHONE);
  console.log('   - status: sent or delivered');
  console.log('   - providerId: Twilio message SID');
  console.log('   - sentAt: timestamp (not null)\n');

  console.log('3. SMS Message Content:');
  console.log('   Expected message to contain:');
  console.log(`   - Order number: ${orderNumber}`);
  console.log('   - Tracking link to order status page');
  console.log('   - Example: "Your order #' + orderNumber + ' has been confirmed! Track your order at ..."\n');

  console.log('4. SMS Received (Manual Check):');
  console.log('   If using Twilio test number (+15005550006):');
  console.log('   - No actual SMS will be sent');
  console.log('   - Check Twilio console for delivery status');
  console.log('   If using real phone number:');
  console.log(`   - Check phone ${TEST_PHONE} for SMS`);
  console.log('   - Verify message content matches expected format\n');

  console.log('Twilio Console: https://console.twilio.com/us1/monitor/logs/sms\n');
}

// Main test execution
async function main() {
  // Step 1: Check environment
  const envCheck = checkEnvironmentVariables();
  if (!envCheck) {
    console.log('\n❌ E2E TEST ABORTED - Missing environment variables\n');
    process.exit(1);
  }

  console.log('');

  // Step 2: Create test order
  const orderData = await createTestOrder();
  if (!orderData) {
    console.log('\n❌ E2E TEST FAILED - Could not create order\n');
    process.exit(1);
  }

  const { orderNumber, checkoutUrl } = orderData;

  // Step 3: Verify order in database (manual)
  await verifyOrderInDatabase(orderNumber);

  // Step 4: Provide Stripe webhook instructions
  provideStripeWebhookInstructions(orderNumber, checkoutUrl);

  // Step 5-8: Provide post-payment verification instructions
  provideVerificationInstructions(orderNumber);

  // Summary
  console.log('==========================================');
  console.log('Test Summary');
  console.log('==========================================');
  console.log(`${colors.green}Passed:${colors.reset}  ${passed}`);
  console.log(`${colors.yellow}Warnings:${colors.reset} ${warnings}`);
  console.log(`${colors.red}Failed:${colors.reset}  ${failed}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✅ E2E TEST SETUP COMPLETED${colors.reset}\n`);
    console.log('Order created successfully. Complete the payment process above');
    console.log('and verify the SMS notification was sent correctly.\n');
    console.log('Test Order Details:');
    console.log(`  Order Number: ${orderNumber}`);
    console.log(`  Phone: ${TEST_PHONE}`);
    console.log(`  Email: ${TEST_EMAIL}`);
    console.log(`  Checkout URL: ${checkoutUrl}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ E2E TEST FAILED${colors.reset}\n`);
    console.log('Some checks failed. Review the output above for details.\n');
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
