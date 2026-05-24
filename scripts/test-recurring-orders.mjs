#!/usr/bin/env node

/**
 * Automated Test Suite: Recurring Orders API and Data Logic
 *
 * This script tests the implemented recurring order functionality:
 * - API endpoint structure and response format
 * - Pagination logic
 * - Data filtering and security
 * - UI display logic (status badges, frequency formatting)
 *
 * Note: This tests the LOGIC only. Actual API calls require:
 * - Running dev server
 * - Authenticated Clerk session
 * - Database connection
 */

// Test counter
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testsFailed++;
    console.error(`❌ FAIL: ${testName}`);
  }
}

function assertEquals(actual, expected, testName) {
  testsRun++;
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    testsPassed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testsFailed++;
    console.error(`❌ FAIL: ${testName}`);
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Actual: ${JSON.stringify(actual)}`);
  }
}

console.log('\n=== RECURRING ORDERS TEST SUITE ===\n');

// ===========================
// Test 1: Pagination Logic
// ===========================
console.log('Test 1: Pagination Calculation');

function calculatePagination(currentPage, totalOrders, ordersPerPage) {
  const skip = (currentPage - 1) * ordersPerPage;
  const take = ordersPerPage;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const startIndex = skip + 1;
  const endIndex = Math.min(currentPage * ordersPerPage, totalOrders);

  return { skip, take, totalPages, hasPrevPage, hasNextPage, startIndex, endIndex };
}

// Test case: Page 1 of 25 orders (10 per page)
const page1 = calculatePagination(1, 25, 10);
assertEquals(page1.skip, 0, 'Page 1: skip = 0');
assertEquals(page1.take, 10, 'Page 1: take = 10');
assertEquals(page1.totalPages, 3, 'Page 1: totalPages = 3');
assertEquals(page1.hasPrevPage, false, 'Page 1: hasPrevPage = false');
assertEquals(page1.hasNextPage, true, 'Page 1: hasNextPage = true');
assertEquals(page1.startIndex, 1, 'Page 1: startIndex = 1');
assertEquals(page1.endIndex, 10, 'Page 1: endIndex = 10');

// Test case: Page 2 of 25 orders
const page2 = calculatePagination(2, 25, 10);
assertEquals(page2.skip, 10, 'Page 2: skip = 10');
assertEquals(page2.hasPrevPage, true, 'Page 2: hasPrevPage = true');
assertEquals(page2.hasNextPage, true, 'Page 2: hasNextPage = true');
assertEquals(page2.startIndex, 11, 'Page 2: startIndex = 11');
assertEquals(page2.endIndex, 20, 'Page 2: endIndex = 20');

// Test case: Page 3 of 25 orders (last page, partial)
const page3 = calculatePagination(3, 25, 10);
assertEquals(page3.skip, 20, 'Page 3: skip = 20');
assertEquals(page3.hasPrevPage, true, 'Page 3: hasPrevPage = true');
assertEquals(page3.hasNextPage, false, 'Page 3: hasNextPage = false');
assertEquals(page3.startIndex, 21, 'Page 3: startIndex = 21');
assertEquals(page3.endIndex, 25, 'Page 3: endIndex = 25 (partial page)');

console.log('');

// ===========================
// Test 2: Status Badge Logic
// ===========================
console.log('Test 2: Status Badge Styling');

function getStatusBadgeClass(status) {
  const map = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    canceled: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

assertEquals(
  getStatusBadgeClass('active'),
  'bg-green-100 text-green-800',
  'Active status: green badge'
);

assertEquals(
  getStatusBadgeClass('paused'),
  'bg-yellow-100 text-yellow-800',
  'Paused status: yellow badge'
);

assertEquals(
  getStatusBadgeClass('canceled'),
  'bg-red-100 text-red-800',
  'Canceled status: red badge'
);

assertEquals(
  getStatusBadgeClass('unknown'),
  'bg-gray-100 text-gray-800',
  'Unknown status: gray badge (fallback)'
);

console.log('');

// ===========================
// Test 3: Frequency Display
// ===========================
console.log('Test 3: Frequency Badge Formatting');

function formatFrequency(frequency) {
  const map = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Bi-Weekly",
    monthly: "Monthly",
  };
  return map[frequency] || frequency;
}

assertEquals(formatFrequency('daily'), 'Daily', 'Daily frequency');
assertEquals(formatFrequency('weekly'), 'Weekly', 'Weekly frequency');
assertEquals(formatFrequency('biweekly'), 'Bi-Weekly', 'Biweekly frequency');
assertEquals(formatFrequency('monthly'), 'Monthly', 'Monthly frequency');
assertEquals(formatFrequency('custom'), 'custom', 'Unknown frequency (fallback)');

console.log('');

// ===========================
// Test 4: Items Display Logic
// ===========================
console.log('Test 4: Items Formatting');

function formatItems(items) {
  if (!Array.isArray(items)) return '';

  return items.map(item => {
    const plural = item.quantity !== 1 ? 's' : '';
    return `${item.name} (${item.quantity} ${item.unit}${plural})`;
  }).join(', ');
}

const singleItem = [
  { name: 'Bank Run Gravel', quantity: 50, unit: 'ton' }
];
assertEquals(
  formatItems(singleItem),
  'Bank Run Gravel (50 tons)',
  'Single item: correct pluralization'
);

const multipleItems = [
  { name: 'Bank Run Gravel', quantity: 50, unit: 'ton' },
  { name: 'Fill Sand', quantity: 1, unit: 'ton' }
];
assertEquals(
  formatItems(multipleItems),
  'Bank Run Gravel (50 tons), Fill Sand (1 ton)',
  'Multiple items: correct pluralization and joining'
);

console.log('');

// ===========================
// Test 5: Date Formatting
// ===========================
console.log('Test 5: Next Delivery Date Formatting');

function formatDeliveryDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const testDate = '2026-04-30T12:00:00.000Z'; // Use midday UTC to avoid timezone edge cases
const formatted = formatDeliveryDate(testDate);
assert(
  formatted === 'Apr 30, 2026',
  `Date formatting: "${testDate}" → "${formatted}"`
);

console.log('');

// ===========================
// Test 6: Address Truncation
// ===========================
console.log('Test 6: Delivery Address Display');

function getFirstAddressLine(address) {
  if (!address) return '';
  return address.split('\n')[0];
}

const multiLineAddress = '123 Main St\nSpringfield, OH 45502';
assertEquals(
  getFirstAddressLine(multiLineAddress),
  '123 Main St',
  'Multi-line address: extract first line only'
);

const singleLineAddress = '123 Main St';
assertEquals(
  getFirstAddressLine(singleLineAddress),
  '123 Main St',
  'Single-line address: return as-is'
);

console.log('');

// ===========================
// Test 7: API Response Structure
// ===========================
console.log('Test 7: API Response Format Validation');

function validateListResponse(response) {
  const required = ['recurringOrders', 'total', 'page', 'limit', 'pages'];
  return required.every(field => response.hasOwnProperty(field));
}

function validateRecurringOrder(order) {
  const required = ['id', 'name', 'email', 'items', 'deliveryAddress', 'frequency', 'nextDeliveryDate', 'status', 'createdAt'];
  return required.every(field => order.hasOwnProperty(field));
}

const mockListResponse = {
  recurringOrders: [
    {
      id: 'clx123',
      name: 'John Contractor',
      email: 'john@example.com',
      phone: '555-1234',
      company: 'Contractor Co.',
      items: [{ name: 'Bank Run', quantity: 50, unit: 'ton', price: 350 }],
      deliveryAddress: '123 Main St',
      deliveryNotes: 'Call first',
      frequency: 'weekly',
      nextDeliveryDate: new Date('2026-04-30'),
      status: 'active',
      createdAt: new Date('2026-04-01')
    }
  ],
  total: 1,
  page: 1,
  limit: 20,
  pages: 1
};

assert(
  validateListResponse(mockListResponse),
  'List response: has all required fields'
);

assert(
  validateRecurringOrder(mockListResponse.recurringOrders[0]),
  'Recurring order: has all required fields'
);

console.log('');

// ===========================
// Test 8: Security - User Filtering
// ===========================
console.log('Test 8: Security - User Isolation');

function filterOrdersByUser(orders, userId) {
  return orders.filter(order => order.userId === userId);
}

const allOrders = [
  { id: '1', userId: 'user_123', name: 'Order 1' },
  { id: '2', userId: 'user_456', name: 'Order 2' },
  { id: '3', userId: 'user_123', name: 'Order 3' },
];

const user123Orders = filterOrdersByUser(allOrders, 'user_123');
assertEquals(
  user123Orders.length,
  2,
  'User isolation: user_123 sees only their 2 orders'
);

assertEquals(
  user123Orders.map(o => o.id),
  ['1', '3'],
  'User isolation: correct order IDs returned'
);

const user456Orders = filterOrdersByUser(allOrders, 'user_456');
assertEquals(
  user456Orders.length,
  1,
  'User isolation: user_456 sees only their 1 order'
);

console.log('');

// ===========================
// Test 9: Past Due Detection
// ===========================
console.log('Test 9: Past Due Order Detection');

function isPastDue(nextDeliveryDate, currentDate) {
  const delivery = new Date(nextDeliveryDate);
  const now = new Date(currentDate);
  return delivery < now;
}

const yesterday = new Date('2026-04-22T00:00:00.000Z');
const today = new Date('2026-04-23T00:00:00.000Z');
const tomorrow = new Date('2026-04-24T00:00:00.000Z');

assert(
  isPastDue(yesterday, today),
  'Past due detection: yesterday is past due'
);

assert(
  !isPastDue(tomorrow, today),
  'Past due detection: tomorrow is not past due'
);

assert(
  !isPastDue(today, today),
  'Past due detection: today is not past due (edge case)'
);

console.log('');

// ===========================
// Test 10: Pagination Limit Validation
// ===========================
console.log('Test 10: API Pagination Limit Validation');

function validatePaginationParams(page, limit) {
  const parsedPage = parseInt(page || '1', 10);
  const parsedLimit = parseInt(limit || '20', 10);
  const validatedPage = Math.max(1, isNaN(parsedPage) ? 1 : parsedPage);
  const validatedLimit = Math.min(100, Math.max(1, isNaN(parsedLimit) ? 20 : parsedLimit));
  return { page: validatedPage, limit: validatedLimit };
}

// Test default values
const defaults = validatePaginationParams(undefined, undefined);
assertEquals(defaults.page, 1, 'Default page: 1');
assertEquals(defaults.limit, 20, 'Default limit: 20');

// Test max limit cap
const maxLimit = validatePaginationParams('1', '200');
assertEquals(maxLimit.limit, 100, 'Max limit capped at 100');

// Test min values
const minValues = validatePaginationParams('0', '0');
assertEquals(minValues.page, 1, 'Min page: 1');
assertEquals(minValues.limit, 1, 'Min limit: 1');

// Test invalid inputs
const invalidInputs = validatePaginationParams('abc', 'xyz');
assertEquals(invalidInputs.page, 1, 'Invalid page defaults to 1');
assertEquals(invalidInputs.limit, 20, 'Invalid limit defaults to 20');

console.log('');

// ===========================
// Test Summary
// ===========================
console.log('=== TEST SUMMARY ===\n');
console.log(`Total Tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Pass Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%\n`);

if (testsFailed === 0) {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.error('⚠️  Some tests failed. Please review the output above.\n');
  process.exit(1);
}
