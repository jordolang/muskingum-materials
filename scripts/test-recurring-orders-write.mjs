#!/usr/bin/env node

/**
 * E2E Test Suite: Recurring Order Write Operations
 * Tests POST, PATCH, and DELETE endpoints for recurring orders
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Mock auth session (in production, you'd use real auth tokens)
const MOCK_USER_ID = "test-user-123";
const MOCK_AUTH_HEADER = { "x-test-user-id": MOCK_USER_ID };

let testResults = [];
let createdOrderId = null;

function log(message, type = "info") {
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warn: "\x1b[33m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function addResult(test, passed, details = "") {
  testResults.push({ test, passed, details });
  if (passed) {
    log(`✓ ${test}`, "success");
  } else {
    log(`✗ ${test}: ${details}`, "error");
  }
}

async function testCreateRecurringOrder() {
  log("\n=== Testing POST /api/account/recurring-orders ===", "info");

  try {
    // Test 1: Create with valid data
    const validPayload = {
      name: "Test User",
      email: "test@example.com",
      phone: "5551234567",
      company: "Test Company",
      items: [
        {
          productId: "bank-run",
          productName: "Bank Run",
          quantity: 10,
          unit: "ton",
        },
      ],
      deliveryAddress: "123 Test St, Test City, OH 43701",
      deliveryNotes: "Leave at gate",
      frequency: "weekly",
      nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = await fetch(`${BASE_URL}/api/account/recurring-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...MOCK_AUTH_HEADER,
      },
      body: JSON.stringify(validPayload),
    });

    const data = await response.json();

    if (response.status === 201 && data.recurringOrder) {
      createdOrderId = data.recurringOrder.id;
      addResult("Create recurring order with valid data", true);
    } else {
      addResult("Create recurring order with valid data", false, `Status: ${response.status}`);
    }

    // Test 2: Create with missing required fields
    const invalidPayload = {
      name: "Test User",
      // missing email, phone, items, etc.
    };

    const invalidResponse = await fetch(`${BASE_URL}/api/account/recurring-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...MOCK_AUTH_HEADER,
      },
      body: JSON.stringify(invalidPayload),
    });

    if (invalidResponse.status === 400) {
      addResult("Reject creation with missing required fields", true);
    } else {
      addResult("Reject creation with missing required fields", false, `Expected 400, got ${invalidResponse.status}`);
    }

    // Test 3: Create with invalid email
    const invalidEmailPayload = {
      ...validPayload,
      email: "not-an-email",
    };

    const invalidEmailResponse = await fetch(`${BASE_URL}/api/account/recurring-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...MOCK_AUTH_HEADER,
      },
      body: JSON.stringify(invalidEmailPayload),
    });

    if (invalidEmailResponse.status === 400) {
      addResult("Reject creation with invalid email", true);
    } else {
      addResult("Reject creation with invalid email", false, `Expected 400, got ${invalidEmailResponse.status}`);
    }

    // Test 4: Create without authentication
    const unauthResponse = await fetch(`${BASE_URL}/api/account/recurring-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validPayload),
    });

    if (unauthResponse.status === 401) {
      addResult("Reject creation without authentication", true);
    } else {
      addResult("Reject creation without authentication", false, `Expected 401, got ${unauthResponse.status}`);
    }
  } catch (error) {
    addResult("Create recurring order tests", false, error.message);
  }
}

async function testUpdateRecurringOrder() {
  log("\n=== Testing PATCH /api/account/recurring-orders/[id] ===", "info");

  if (!createdOrderId) {
    addResult("Update recurring order tests", false, "No order ID from creation test");
    return;
  }

  try {
    // Test 5: Update delivery address
    const updateAddressPayload = {
      deliveryAddress: "456 New St, New City, OH 43702",
    };

    const updateAddressResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/${createdOrderId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...MOCK_AUTH_HEADER,
        },
        body: JSON.stringify(updateAddressPayload),
      }
    );

    const updatedData = await updateAddressResponse.json();

    if (
      updateAddressResponse.ok &&
      updatedData.recurringOrder?.deliveryAddress === updateAddressPayload.deliveryAddress
    ) {
      addResult("Update delivery address", true);
    } else {
      addResult("Update delivery address", false, `Status: ${updateAddressResponse.status}`);
    }

    // Test 6: Pause order (status: paused)
    const pausePayload = {
      status: "paused",
    };

    const pauseResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/${createdOrderId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...MOCK_AUTH_HEADER,
        },
        body: JSON.stringify(pausePayload),
      }
    );

    const pausedData = await pauseResponse.json();

    if (pauseResponse.ok && pausedData.recurringOrder?.status === "paused") {
      addResult("Pause recurring order", true);
    } else {
      addResult("Pause recurring order", false, `Status: ${pauseResponse.status}`);
    }

    // Test 7: Resume order (status: active)
    const resumePayload = {
      status: "active",
    };

    const resumeResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/${createdOrderId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...MOCK_AUTH_HEADER,
        },
        body: JSON.stringify(resumePayload),
      }
    );

    const resumedData = await resumeResponse.json();

    if (resumeResponse.ok && resumedData.recurringOrder?.status === "active") {
      addResult("Resume recurring order", true);
    } else {
      addResult("Resume recurring order", false, `Status: ${resumeResponse.status}`);
    }

    // Test 8: Update with invalid data
    const invalidUpdatePayload = {
      email: "not-an-email",
    };

    const invalidUpdateResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/${createdOrderId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...MOCK_AUTH_HEADER,
        },
        body: JSON.stringify(invalidUpdatePayload),
      }
    );

    if (invalidUpdateResponse.status === 400) {
      addResult("Reject update with invalid data", true);
    } else {
      addResult("Reject update with invalid data", false, `Expected 400, got ${invalidUpdateResponse.status}`);
    }

    // Test 9: Update non-existent order
    const nonExistentResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/non-existent-id`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({ status: "paused" }),
      }
    );

    if (nonExistentResponse.status === 404) {
      addResult("Reject update of non-existent order", true);
    } else {
      addResult("Reject update of non-existent order", false, `Expected 404, got ${nonExistentResponse.status}`);
    }
  } catch (error) {
    addResult("Update recurring order tests", false, error.message);
  }
}

async function testDeleteRecurringOrder() {
  log("\n=== Testing DELETE /api/account/recurring-orders/[id] ===", "info");

  if (!createdOrderId) {
    addResult("Delete recurring order tests", false, "No order ID from creation test");
    return;
  }

  try {
    // Test 10: Delete existing order
    const deleteResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/${createdOrderId}`,
      {
        method: "DELETE",
        headers: {
          ...MOCK_AUTH_HEADER,
        },
      }
    );

    const deleteData = await deleteResponse.json();

    if (deleteResponse.ok && deleteData.success) {
      addResult("Delete recurring order", true);
    } else {
      addResult("Delete recurring order", false, `Status: ${deleteResponse.status}`);
    }

    // Test 11: Delete non-existent order
    const nonExistentDeleteResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/${createdOrderId}`,
      {
        method: "DELETE",
        headers: {
          ...MOCK_AUTH_HEADER,
        },
      }
    );

    if (nonExistentDeleteResponse.status === 404) {
      addResult("Reject deletion of non-existent order", true);
    } else {
      addResult("Reject deletion of non-existent order", false, `Expected 404, got ${nonExistentDeleteResponse.status}`);
    }

    // Test 12: Delete without authentication
    const unauthDeleteResponse = await fetch(
      `${BASE_URL}/api/account/recurring-orders/some-id`,
      {
        method: "DELETE",
      }
    );

    if (unauthDeleteResponse.status === 401) {
      addResult("Reject deletion without authentication", true);
    } else {
      addResult("Reject deletion without authentication", false, `Expected 401, got ${unauthDeleteResponse.status}`);
    }
  } catch (error) {
    addResult("Delete recurring order tests", false, error.message);
  }
}

async function testSecurityIsolation() {
  log("\n=== Testing Security: User Isolation ===", "info");

  try {
    // Create an order as user 1
    const user1Id = "user-1";
    const createPayload = {
      name: "User 1",
      email: "user1@example.com",
      phone: "5551111111",
      items: [
        {
          productId: "bank-run",
          productName: "Bank Run",
          quantity: 5,
          unit: "ton",
        },
      ],
      deliveryAddress: "User 1 Address",
      frequency: "weekly",
      nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createResponse = await fetch(`${BASE_URL}/api/account/recurring-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": user1Id,
      },
      body: JSON.stringify(createPayload),
    });

    const createData = await createResponse.json();
    const user1OrderId = createData.recurringOrder?.id;

    if (user1OrderId) {
      // Test 13: User 2 tries to access user 1's order
      const user2Id = "user-2";
      const accessResponse = await fetch(
        `${BASE_URL}/api/account/recurring-orders/${user1OrderId}`,
        {
          headers: {
            "x-test-user-id": user2Id,
          },
        }
      );

      if (accessResponse.status === 404 || accessResponse.status === 401) {
        addResult("Prevent cross-user order access (GET)", true);
      } else {
        addResult("Prevent cross-user order access (GET)", false, `Expected 404/401, got ${accessResponse.status}`);
      }

      // Test 14: User 2 tries to update user 1's order
      const updateResponse = await fetch(
        `${BASE_URL}/api/account/recurring-orders/${user1OrderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-test-user-id": user2Id,
          },
          body: JSON.stringify({ status: "paused" }),
        }
      );

      if (updateResponse.status === 404 || updateResponse.status === 401) {
        addResult("Prevent cross-user order modification (PATCH)", true);
      } else {
        addResult("Prevent cross-user order modification (PATCH)", false, `Expected 404/401, got ${updateResponse.status}`);
      }

      // Test 15: User 2 tries to delete user 1's order
      const deleteResponse = await fetch(
        `${BASE_URL}/api/account/recurring-orders/${user1OrderId}`,
        {
          method: "DELETE",
          headers: {
            "x-test-user-id": user2Id,
          },
        }
      );

      if (deleteResponse.status === 404 || deleteResponse.status === 401) {
        addResult("Prevent cross-user order deletion (DELETE)", true);
      } else {
        addResult("Prevent cross-user order deletion (DELETE)", false, `Expected 404/401, got ${deleteResponse.status}`);
      }

      // Clean up: delete user 1's order
      await fetch(`${BASE_URL}/api/account/recurring-orders/${user1OrderId}`, {
        method: "DELETE",
        headers: {
          "x-test-user-id": user1Id,
        },
      });
    } else {
      addResult("Security tests", false, "Could not create test order");
    }
  } catch (error) {
    addResult("Security tests", false, error.message);
  }
}

async function runAllTests() {
  log("\n🚀 Starting Recurring Order Write Operations E2E Tests\n", "info");
  log(`Base URL: ${BASE_URL}\n`, "info");

  await testCreateRecurringOrder();
  await testUpdateRecurringOrder();
  await testDeleteRecurringOrder();
  await testSecurityIsolation();

  // Print summary
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const total = testResults.length;

  log("\n" + "=".repeat(60), "info");
  log(`\nTest Summary: ${passed}/${total} passed, ${failed} failed\n`, failed === 0 ? "success" : "error");

  if (failed > 0) {
    log("Failed tests:", "error");
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => log(`  - ${r.test}: ${r.details}`, "error"));
  }

  process.exit(failed === 0 ? 0 : 1);
}

runAllTests().catch((error) => {
  log(`\nFatal error: ${error.message}`, "error");
  process.exit(1);
});
