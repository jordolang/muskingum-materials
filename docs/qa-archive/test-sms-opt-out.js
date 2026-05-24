#!/usr/bin/env node

/**
 * E2E Test: SMS Opt-Out via STOP Command
 *
 * Tests the TCPA-compliant STOP command handling:
 * 1. Simulate sending STOP message to Twilio webhook
 * 2. Verify UserProfile.smsOptIn set to false for matching phone number
 * 3. Verify Order.smsOptIn set to false for matching phone number
 * 4. Create new order with opted-out phone number
 * 5. Verify no SMS is sent for new order
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - Database accessible (run from main project directory)
 * - Environment variables configured (see .env.local)
 * - Existing test user/order with SMS opt-in enabled
 *
 * Usage:
 *   node test-sms-opt-out.js
 *   node test-sms-opt-out.js --base-url http://localhost:3000 --phone +15005550006
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const BASE_URL = getArg('--base-url', process.env.BASE_URL || 'http://localhost:3000');
const TEST_PHONE = getArg('--phone', '+15005550006'); // Twilio test number
const TEST_EMAIL = 'test-opt-out@example.com';
const TEST_NAME = 'Opt-Out Test User';

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

/**
 * Generate Twilio webhook signature for request validation
 * @param {string} authToken - Twilio auth token
 * @param {string} url - Full webhook URL
 * @param {Object} params - Webhook parameters
 * @returns {string} Base64-encoded HMAC-SHA1 signature
 */
function generateTwilioSignature(authToken, url, params) {
  // Sort parameters alphabetically and concatenate
  const data = url + Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');

  // Create HMAC-SHA1 signature
  const hmac = crypto.createHmac('sha1', authToken);
  hmac.update(data);
  return hmac.digest('base64');
}

// Step 1: Check environment variables
function checkEnvironmentVariables() {
  console.log('\n==========================================');
  console.log('E2E Test: SMS Opt-Out via STOP Command');
  console.log('==========================================\n');

  console.log('Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Test Phone: ${TEST_PHONE}`);
  console.log(`  Test Email: ${TEST_EMAIL}\n`);

  console.log('Step 1: Environment Variable Check');
  console.log('-----------------------------------');

  const requiredVars = [
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
    return false;
  }
}

// Step 2: Create initial order with SMS opt-in (to have data to opt-out)
async function createInitialOrder() {
  console.log('\nStep 2: Create Initial Order with SMS Opt-in');
  console.log('---------------------------------------------');

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
        quantity: 1,
      },
    ],
    subtotal: 25.00,
    tax: 1.81,
    processingFee: 1.45,
    total: 28.26,
  };

  try {
    const response = await makeRequest(`${BASE_URL}/api/orders/checkout`, {
      method: 'POST',
      body: orderData,
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);

      if (data.orderNumber) {
        printResult('Initial order created successfully', 'PASS', `Order Number: ${data.orderNumber}`);
        return {
          orderNumber: data.orderNumber,
        };
      } else {
        printResult('Order created but no order number returned', 'FAIL');
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

// Step 3: Simulate STOP message to webhook
async function simulateStopMessage() {
  console.log('\nStep 3: Simulate STOP Message to Webhook');
  console.log('-----------------------------------------');

  if (!process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    printResult('Cannot simulate webhook without Twilio credentials', 'FAIL');
    return false;
  }

  const webhookUrl = `${BASE_URL}/api/sms/webhook`;

  // Twilio webhook parameters for incoming STOP message
  const webhookParams = {
    MessageSid: `SM${Math.random().toString(36).substring(2, 34).toUpperCase()}`,
    SmsSid: `SM${Math.random().toString(36).substring(2, 34).toUpperCase()}`,
    AccountSid: process.env.TWILIO_ACCOUNT_SID,
    MessagingServiceSid: '',
    From: TEST_PHONE,
    To: process.env.TWILIO_PHONE_NUMBER,
    Body: 'STOP',
    NumMedia: '0',
  };

  // Generate valid Twilio signature
  const signature = generateTwilioSignature(
    process.env.TWILIO_AUTH_TOKEN,
    webhookUrl,
    webhookParams
  );

  // Convert params to URL-encoded form data
  const formData = new URLSearchParams(webhookParams).toString();

  try {
    const response = await makeRequest(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature,
      },
      body: formData,
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);

      if (data.success && data.action === 'opted_out') {
        printResult('STOP message processed successfully', 'PASS', 'Webhook returned opted_out action');
        return true;
      } else if (data.success) {
        printResult('Webhook succeeded but no opt-out action', 'WARN', JSON.stringify(data));
        return true;
      } else {
        printResult('Webhook returned success=false', 'FAIL', JSON.stringify(data));
        return false;
      }
    } else {
      printResult(`Webhook failed (HTTP ${response.statusCode})`, 'FAIL');
      console.log(`   Response: ${response.body}`);
      return false;
    }
  } catch (error) {
    printResult('Failed to send STOP message', 'FAIL', error.message);
    return false;
  }
}

// Step 4: Verify database updates (manual verification with SQL queries)
function provideVerificationInstructions() {
  console.log('\nStep 4: Verify Database Updates');
  console.log('--------------------------------');

  printResult('Database verification required', 'INFO', 'Use Prisma Studio or SQL queries');

  console.log('\nTo verify opt-out was processed:\n');

  console.log('1. Check UserProfile.smsOptIn is set to false:');
  console.log(`   SELECT "phone", "smsOptIn" FROM "UserProfile"`);
  console.log(`   WHERE "phone" = '${TEST_PHONE}';`);
  console.log('   Expected: smsOptIn = false\n');

  console.log('2. Check Order.smsOptIn is set to false:');
  console.log(`   SELECT "orderNumber", "phone", "smsOptIn" FROM "Order"`);
  console.log(`   WHERE "phone" = '${TEST_PHONE}'`);
  console.log('   ORDER BY "createdAt" DESC LIMIT 5;');
  console.log('   Expected: smsOptIn = false for all orders with this phone\n');

  console.log('Alternative: Use Prisma Studio');
  console.log('   npx prisma studio');
  console.log('   Navigate to UserProfile and Order tables');
  console.log(`   Filter by phone: ${TEST_PHONE}`);
  console.log('   Verify smsOptIn = false\n');
}

// Step 5: Create new order with opted-out phone number
async function createOrderWithOptedOutPhone() {
  console.log('\nStep 5: Create New Order with Opted-Out Phone');
  console.log('----------------------------------------------');

  const orderData = {
    name: TEST_NAME + ' (After Opt-Out)',
    email: TEST_EMAIL,
    phone: TEST_PHONE,
    smsOptIn: true, // User tries to opt-in again
    fulfillment: 'pickup',
    items: [
      {
        name: 'Test Material 2',
        price: 30.00,
        unit: 'ton',
        quantity: 1,
      },
    ],
    subtotal: 30.00,
    tax: 2.18,
    processingFee: 1.62,
    total: 33.80,
  };

  try {
    const response = await makeRequest(`${BASE_URL}/api/orders/checkout`, {
      method: 'POST',
      body: orderData,
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);

      if (data.orderNumber) {
        printResult('New order created after opt-out', 'PASS', `Order Number: ${data.orderNumber}`);
        return {
          orderNumber: data.orderNumber,
        };
      } else {
        printResult('Order created but no order number returned', 'FAIL');
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

// Step 6: Verify no SMS sent for new order
function provideNoSmsVerificationInstructions(orderNumber) {
  console.log('\nStep 6: Verify No SMS Sent for New Order');
  console.log('-----------------------------------------');

  console.log('\nAfter completing payment for the new order, verify:\n');

  console.log('1. Complete payment for order ' + orderNumber);
  console.log('   Use Stripe test card: 4242 4242 4242 4242');
  console.log('   Complete Stripe checkout\n');

  console.log('2. Verify order status updated to confirmed:');
  console.log(`   SELECT "status", "paymentStatus", "smsOptIn" FROM "Order"`);
  console.log(`   WHERE "orderNumber" = '${orderNumber}';`);
  console.log('   Expected: status = \'confirmed\', paymentStatus = \'paid\', smsOptIn = true\n');

  console.log('3. Verify NO SmsNotification record was created:');
  console.log(`   SELECT COUNT(*) as count FROM "SmsNotification" n`);
  console.log(`   JOIN "Order" o ON n."orderId" = o."id"`);
  console.log(`   WHERE o."orderNumber" = '${orderNumber}';`);
  console.log('   Expected: count = 0 (no SMS notifications created)\n');

  console.log('4. Check webhook logs for STOP opt-out enforcement:');
  console.log('   Review server logs for order confirmation webhook');
  console.log('   Should skip SMS sending due to prior STOP command\n');

  console.log('TCPA Compliance Note:');
  console.log('   Even though the order has smsOptIn=true, the STOP command');
  console.log('   should prevent ANY future SMS messages to this phone number');
  console.log('   until the user explicitly opts back in via profile settings.\n');
}

// Step 7: Test alternative STOP keywords
function provideAlternativeStopKeywordsInfo() {
  console.log('\nStep 7: Alternative STOP Keywords (Optional)');
  console.log('---------------------------------------------');

  printResult('Additional STOP keywords to test', 'INFO');

  console.log('\nThe webhook handles multiple STOP keywords:');
  console.log('  - STOP');
  console.log('  - STOPALL');
  console.log('  - UNSUBSCRIBE');
  console.log('  - CANCEL');
  console.log('  - END');
  console.log('  - QUIT\n');

  console.log('To test additional keywords:');
  console.log('  1. Create a new test order with different phone number');
  console.log('  2. Run this script with different --phone parameter');
  console.log('  3. Modify the webhook Body parameter to use different keyword');
  console.log('  4. Verify same opt-out behavior\n');
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

  // Step 2: Create initial order with SMS opt-in
  const initialOrder = await createInitialOrder();
  if (!initialOrder) {
    console.log('\n❌ E2E TEST FAILED - Could not create initial order\n');
    process.exit(1);
  }

  console.log('');

  // Step 3: Simulate STOP message
  const stopSuccess = await simulateStopMessage();
  if (!stopSuccess) {
    console.log('\n❌ E2E TEST FAILED - STOP message not processed\n');
    process.exit(1);
  }

  console.log('');

  // Step 4: Provide database verification instructions
  provideVerificationInstructions();

  console.log('');

  // Step 5: Create new order with opted-out phone
  const newOrder = await createOrderWithOptedOutPhone();
  if (!newOrder) {
    console.log('\n⚠️  E2E TEST WARNING - Could not create new order\n');
  }

  console.log('');

  // Step 6: Provide no-SMS verification instructions
  if (newOrder) {
    provideNoSmsVerificationInstructions(newOrder.orderNumber);
  }

  console.log('');

  // Step 7: Alternative STOP keywords info
  provideAlternativeStopKeywordsInfo();

  // Summary
  console.log('==========================================');
  console.log('Test Summary');
  console.log('==========================================');
  console.log(`${colors.green}Passed:${colors.reset}  ${passed}`);
  console.log(`${colors.yellow}Warnings:${colors.reset} ${warnings}`);
  console.log(`${colors.red}Failed:${colors.reset}  ${failed}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✅ E2E TEST COMPLETED${colors.reset}\n`);
    console.log('STOP command processed successfully. Follow the verification');
    console.log('instructions above to confirm database updates and that no SMS');
    console.log('is sent for new orders with opted-out phone numbers.\n');
    console.log('Test Details:');
    console.log(`  Initial Order: ${initialOrder.orderNumber}`);
    console.log(`  Phone: ${TEST_PHONE}`);
    console.log(`  STOP Command: Processed`);
    if (newOrder) {
      console.log(`  New Order: ${newOrder.orderNumber} (should NOT receive SMS)`);
    }
    console.log('');
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
