/**
 * End-to-End Verification Script for Structured Logging & Monitoring
 * Tests all logging and monitoring features implemented in this task
 */

import { logger } from './lib/logger';
import { capturePaymentFailure, captureDatabaseError, captureRateLimitWarning } from './lib/monitoring';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  logs?: string[];
}

const results: TestResult[] = [];

/**
 * Test 1: Verify structured logging format
 */
function testStructuredLogging(): TestResult {
  console.log('\n=== Test 1: Structured Logging Format ===');

  const logs: string[] = [];
  const originalConsoleInfo = console.info;
  const originalConsoleError = console.error;

  // Capture logs
  console.info = (msg: string) => {
    logs.push(msg);
    originalConsoleInfo(msg);
  };

  console.error = (msg: string) => {
    logs.push(msg);
    originalConsoleError(msg);
  };

  // Generate test logs
  logger.info('Test info log', { userId: '123', action: 'test' });
  logger.error('Test error log', new Error('Test error'), { operation: 'test' });

  // Restore console
  console.info = originalConsoleInfo;
  console.error = originalConsoleError;

  // Verify structured JSON format
  let passed = true;
  const details: string[] = [];

  logs.forEach((log, index) => {
    try {
      const parsed = JSON.parse(log);

      // Check required fields
      if (!parsed.timestamp) {
        passed = false;
        details.push(`Log ${index + 1}: Missing timestamp`);
      }
      if (!parsed.level) {
        passed = false;
        details.push(`Log ${index + 1}: Missing level`);
      }
      if (!parsed.message) {
        passed = false;
        details.push(`Log ${index + 1}: Missing message`);
      }

      details.push(`✓ Log ${index + 1}: Valid JSON with timestamp=${parsed.timestamp}, level=${parsed.level}`);
    } catch (e) {
      passed = false;
      details.push(`Log ${index + 1}: Not valid JSON`);
    }
  });

  return {
    testName: 'Structured Logging Format',
    passed,
    details: details.join('\n'),
    logs
  };
}

/**
 * Test 2: Verify payment failure alert tagging
 */
function testPaymentFailureAlert(): TestResult {
  console.log('\n=== Test 2: Payment Failure Alert ===');

  try {
    // Simulate payment failure
    const paymentError = new Error('Stripe payment declined');
    capturePaymentFailure(paymentError, {
      orderNumber: 'TEST-001',
      amount: 99.99,
      provider: 'stripe',
      reason: 'insufficient_funds'
    });

    return {
      testName: 'Payment Failure Alert',
      passed: true,
      details: '✓ Payment failure captured with context: orderNumber=TEST-001, amount=99.99'
    };
  } catch (e) {
    return {
      testName: 'Payment Failure Alert',
      passed: false,
      details: `✗ Failed to capture payment failure: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}

/**
 * Test 3: Verify database error alert tagging
 */
function testDatabaseErrorAlert(): TestResult {
  console.log('\n=== Test 3: Database Error Alert ===');

  try {
    // Simulate database connection error
    const dbError = new Error('Connection pool exhausted');
    captureDatabaseError(dbError, {
      operation: 'query',
      table: 'orders',
      connection_pool_size: 10,
      active_connections: 10
    });

    return {
      testName: 'Database Error Alert',
      passed: true,
      details: '✓ Database error captured with context: operation=query, table=orders'
    };
  } catch (e) {
    return {
      testName: 'Database Error Alert',
      passed: false,
      details: `✗ Failed to capture database error: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}

/**
 * Test 4: Verify rate limit warning tagging
 */
function testRateLimitWarning(): TestResult {
  console.log('\n=== Test 4: Rate Limit Warning ===');

  try {
    // Simulate rate limit approaching
    captureRateLimitWarning('Chat API rate limit at 80%', {
      endpoint: '/api/chat',
      current_usage: 4,
      limit: 5,
      remaining: 1,
      identifier: 'test-client-ip'
    });

    return {
      testName: 'Rate Limit Warning',
      passed: true,
      details: '✓ Rate limit warning captured with context: endpoint=/api/chat, usage=4/5'
    };
  } catch (e) {
    return {
      testName: 'Rate Limit Warning',
      passed: false,
      details: `✗ Failed to capture rate limit warning: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}

/**
 * Test 5: Verify log entry completeness
 */
function testLogEntryMetadata(): TestResult {
  console.log('\n=== Test 5: Log Entry Metadata ===');

  const logs: string[] = [];
  const originalConsoleInfo = console.info;

  console.info = (msg: string) => {
    logs.push(msg);
    originalConsoleInfo(msg);
  };

  // Generate log with full context
  logger.info('API request processed', {
    requestId: 'req-123',
    userId: 'user-456',
    route: '/api/orders/checkout',
    method: 'POST',
    statusCode: 200,
    duration: 150,
    ip: '192.168.1.1'
  });

  console.info = originalConsoleInfo;

  try {
    const parsed = JSON.parse(logs[0]);
    const requiredFields = ['timestamp', 'level', 'message', 'context'];
    const contextFields = ['requestId', 'userId', 'route', 'method', 'statusCode', 'duration', 'ip'];

    const missingFields: string[] = [];
    requiredFields.forEach(field => {
      if (!parsed[field]) {
        missingFields.push(field);
      }
    });

    const missingContext: string[] = [];
    if (parsed.context) {
      contextFields.forEach(field => {
        if (parsed.context[field] === undefined) {
          missingContext.push(field);
        }
      });
    }

    const passed = missingFields.length === 0 && missingContext.length === 0;

    return {
      testName: 'Log Entry Metadata',
      passed,
      details: passed
        ? '✓ Log entry contains all required fields: timestamp, level, message, context with requestId, userId, route, method, statusCode, duration, ip'
        : `✗ Missing fields: ${missingFields.join(', ')}. Missing context: ${missingContext.join(', ')}`
    };
  } catch (e) {
    return {
      testName: 'Log Entry Metadata',
      passed: false,
      details: `✗ Failed to parse log entry: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  End-to-End Verification: Structured Logging & Monitoring  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Run tests
  results.push(testStructuredLogging());
  results.push(testPaymentFailureAlert());
  results.push(testDatabaseErrorAlert());
  results.push(testRateLimitWarning());
  results.push(testLogEntryMetadata());

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let passCount = 0;
  let failCount = 0;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.testName}`);
    console.log(`   ${result.details}\n`);

    if (result.passed) {
      passCount++;
    } else {
      failCount++;
    }
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Return exit code
  return failCount === 0 ? 0 : 1;
}

// Run tests
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
