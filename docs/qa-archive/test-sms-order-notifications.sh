#!/bin/bash

# E2E Test: SMS Order Notifications
# Tests the complete flow: Checkout with SMS opt-in → Payment → SMS sent
#
# Prerequisites:
# 1. Dev server running: npm run dev
# 2. Database accessible (run from main project directory, not worktree)
# 3. Environment variables set:
#    - STRIPE_SECRET_KEY (test mode)
#    - STRIPE_WEBHOOK_SECRET
#    - TWILIO_ACCOUNT_SID (test credentials)
#    - TWILIO_AUTH_TOKEN (test credentials)
#    - TWILIO_PHONE_NUMBER
#    - NEXT_PUBLIC_APP_URL
# 4. Stripe CLI installed for webhook testing: https://stripe.com/docs/stripe-cli
#
# Usage:
#   ./test-sms-order-notifications.sh [BASE_URL] [TEST_PHONE]
#
# Example:
#   ./test-sms-order-notifications.sh http://localhost:3000 +15005550006
#
# Note: Use Twilio test numbers to avoid SMS charges:
#   +15005550006 - Valid test number (no actual SMS sent, but shows as "sent" in logs)

set -e  # Exit on error

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TEST_PHONE="${2:-+15005550006}"  # Twilio test number
TEST_EMAIL="test-sms-e2e@example.com"
TEST_NAME="E2E Test User"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

echo ""
echo "=========================================="
echo "E2E Test: SMS Order Notifications"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Test Phone: $TEST_PHONE"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Function to print test result
print_result() {
  local test_name="$1"
  local result="$2"
  local message="$3"

  if [ "$result" = "PASS" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $test_name"
    [ -n "$message" ] && echo "   $message"
    ((PASSED++))
  elif [ "$result" = "FAIL" ]; then
    echo -e "${RED}❌ FAIL${NC}: $test_name"
    [ -n "$message" ] && echo "   $message"
    ((FAILED++))
  elif [ "$result" = "WARN" ]; then
    echo -e "${YELLOW}⚠️  WARN${NC}: $test_name"
    [ -n "$message" ] && echo "   $message"
    ((WARNINGS++))
  else
    echo -e "${BLUE}ℹ️  INFO${NC}: $test_name"
    [ -n "$message" ] && echo "   $message"
  fi
}

# Function to check environment variables
check_env_vars() {
  echo "Step 1: Environment Variable Check"
  echo "-----------------------------------"

  local required_vars=(
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
    "TWILIO_PHONE_NUMBER"
    "NEXT_PUBLIC_APP_URL"
  )

  local missing_vars=()

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done

  if [ ${#missing_vars[@]} -eq 0 ]; then
    print_result "All required environment variables are set" "PASS"
  else
    print_result "Missing environment variables: ${missing_vars[*]}" "FAIL"
    echo ""
    echo "Please set the following environment variables in .env.local:"
    for var in "${missing_vars[@]}"; do
      echo "  $var="
    done
    echo ""
    echo "For testing, use Twilio test credentials to avoid SMS charges:"
    echo "  https://www.twilio.com/docs/iam/test-credentials"
    exit 1
  fi
  echo ""
}

# Function to create test order with SMS opt-in
create_test_order() {
  echo "Step 2: Create Test Order with SMS Opt-in"
  echo "------------------------------------------"

  local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/orders/checkout" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$TEST_NAME\",
      \"email\": \"$TEST_EMAIL\",
      \"phone\": \"$TEST_PHONE\",
      \"smsOptIn\": true,
      \"fulfillment\": \"pickup\",
      \"items\": [
        {
          \"name\": \"Test Material\",
          \"price\": 25.00,
          \"unit\": \"ton\",
          \"quantity\": 2
        }
      ],
      \"subtotal\": 50.00,
      \"tax\": 3.63,
      \"processingFee\": 2.41,
      \"total\": 56.04
    }")

  local status_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | head -n -1)

  if [ "$status_code" = "200" ]; then
    ORDER_NUMBER=$(echo "$body" | grep -o '"orderNumber":"[^"]*"' | cut -d'"' -f4)
    CHECKOUT_URL=$(echo "$body" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$ORDER_NUMBER" ]; then
      print_result "Order created successfully" "PASS" "Order Number: $ORDER_NUMBER"
      echo "   Checkout URL: $CHECKOUT_URL"
    else
      print_result "Order created but no order number returned" "FAIL"
      echo "   Response: $body"
      exit 1
    fi
  else
    print_result "Failed to create order (HTTP $status_code)" "FAIL"
    echo "   Response: $body"
    exit 1
  fi
  echo ""
}

# Function to verify order in database
verify_order_in_database() {
  echo "Step 3: Verify Order in Database"
  echo "---------------------------------"

  print_result "Database verification" "INFO" "Checking order with smsOptIn=true..."

  # Use Prisma to query the order
  local query_result=$(npx prisma db execute --stdin <<EOF 2>&1
SELECT
  "orderNumber",
  "status",
  "paymentStatus",
  "phone",
  "smsOptIn"
FROM "Order"
WHERE "orderNumber" = '$ORDER_NUMBER';
EOF
)

  if echo "$query_result" | grep -q "$ORDER_NUMBER"; then
    print_result "Order found in database" "PASS"

    # Check smsOptIn field
    if echo "$query_result" | grep -q "true"; then
      print_result "smsOptIn field is true" "PASS"
    else
      print_result "smsOptIn field is not true" "FAIL"
    fi

    # Check initial status
    if echo "$query_result" | grep -q "pending"; then
      print_result "Order status is 'pending'" "PASS"
    else
      print_result "Order status is not 'pending'" "WARN"
    fi
  else
    print_result "Order not found in database" "FAIL"
    echo "   Query result: $query_result"
  fi
  echo ""
}

# Function to simulate Stripe payment webhook
simulate_stripe_webhook() {
  echo "Step 4: Simulate Stripe Payment Confirmation"
  echo "---------------------------------------------"

  print_result "Webhook simulation" "INFO" "This requires Stripe CLI"
  echo ""
  echo "To complete payment and trigger SMS:"
  echo ""
  echo "Option 1: Use Stripe CLI (recommended for testing)"
  echo "  1. Install Stripe CLI: https://stripe.com/docs/stripe-cli"
  echo "  2. Run: stripe listen --forward-to $BASE_URL/api/orders/webhook"
  echo "  3. Complete payment at: $CHECKOUT_URL"
  echo "  4. Webhook will automatically trigger SMS"
  echo ""
  echo "Option 2: Use test webhook trigger"
  echo "  stripe trigger checkout.session.completed \\"
  echo "    --add checkout_session:metadata.orderNumber=$ORDER_NUMBER"
  echo ""
  echo "Option 3: Complete manual checkout"
  echo "  1. Visit: $CHECKOUT_URL"
  echo "  2. Use Stripe test card: 4242 4242 4242 4242"
  echo "  3. Any future expiry date and CVC"
  echo "  4. Complete checkout"
  echo ""

  print_result "Manual verification required" "WARN" "Complete one of the options above"
  echo ""
}

# Function to verify order status after payment
verify_order_confirmed() {
  echo "Step 5: Verify Order Status Updated to 'confirmed'"
  echo "---------------------------------------------------"

  echo "Waiting 5 seconds for webhook processing..."
  sleep 5

  # Query order status
  local query_result=$(npx prisma db execute --stdin <<EOF 2>&1
SELECT
  "orderNumber",
  "status",
  "paymentStatus",
  "stripePaymentId"
FROM "Order"
WHERE "orderNumber" = '$ORDER_NUMBER';
EOF
)

  if echo "$query_result" | grep -q "confirmed"; then
    print_result "Order status is 'confirmed'" "PASS"
  else
    print_result "Order status is not 'confirmed'" "WARN" "Payment may not have completed yet"
  fi

  if echo "$query_result" | grep -q "paid"; then
    print_result "Payment status is 'paid'" "PASS"
  else
    print_result "Payment status is not 'paid'" "WARN" "Payment may not have completed yet"
  fi
  echo ""
}

# Function to verify SMS notification record
verify_sms_notification() {
  echo "Step 6: Verify SmsNotification Record Created"
  echo "----------------------------------------------"

  # Query SmsNotification table
  local query_result=$(npx prisma db execute --stdin <<EOF 2>&1
SELECT
  n."id",
  n."type",
  n."phone",
  n."status",
  n."providerId",
  n."errorMsg",
  n."sentAt",
  o."orderNumber"
FROM "SmsNotification" n
JOIN "Order" o ON n."orderId" = o."id"
WHERE o."orderNumber" = '$ORDER_NUMBER';
EOF
)

  if echo "$query_result" | grep -q "order_confirmed"; then
    print_result "SmsNotification record created" "PASS" "Type: order_confirmed"

    # Check status
    if echo "$query_result" | grep -qE "(sent|delivered)"; then
      print_result "SMS status is 'sent' or 'delivered'" "PASS"
    elif echo "$query_result" | grep -q "failed"; then
      print_result "SMS status is 'failed'" "FAIL"

      # Extract error message if present
      local error_msg=$(echo "$query_result" | grep -o "errorMsg[^|]*" || echo "")
      [ -n "$error_msg" ] && echo "   Error: $error_msg"
    else
      print_result "SMS status is unknown" "WARN"
    fi

    # Check phone number
    if echo "$query_result" | grep -q "$TEST_PHONE"; then
      print_result "Phone number matches" "PASS" "Phone: $TEST_PHONE"
    else
      print_result "Phone number mismatch" "FAIL"
    fi

  else
    print_result "SmsNotification record not found" "FAIL"
    echo "   This likely means the webhook hasn't been triggered yet"
    echo "   or SMS sending failed silently"
  fi
  echo ""
}

# Function to verify SMS message content
verify_sms_message_content() {
  echo "Step 7: Verify SMS Message Content"
  echo "-----------------------------------"

  # Query message content
  local query_result=$(npx prisma db execute --stdin <<EOF 2>&1
SELECT
  n."message",
  o."orderNumber"
FROM "SmsNotification" n
JOIN "Order" o ON n."orderId" = o."id"
WHERE o."orderNumber" = '$ORDER_NUMBER';
EOF
)

  if [ -n "$query_result" ]; then
    # Check for order number in message
    if echo "$query_result" | grep -q "$ORDER_NUMBER"; then
      print_result "Message contains order number" "PASS"
    else
      print_result "Message missing order number" "FAIL"
    fi

    # Check for tracking link
    if echo "$query_result" | grep -qE "(http|Track your order)"; then
      print_result "Message contains tracking link" "PASS"
    else
      print_result "Message missing tracking link" "WARN"
    fi

    # Display message
    local message=$(echo "$query_result" | grep -o "message.*" | head -1)
    echo "   Message: $message"
  else
    print_result "No SMS message found" "FAIL"
  fi
  echo ""
}

# Function to verify SMS received (manual check)
verify_sms_received() {
  echo "Step 8: Verify SMS Received at Phone Number"
  echo "--------------------------------------------"

  print_result "Manual verification required" "INFO"
  echo ""
  echo "If using Twilio test credentials (+15005550006):"
  echo "  - No actual SMS will be sent"
  echo "  - Check Twilio console for mock delivery status"
  echo "  - Status should show as 'sent' or 'delivered'"
  echo ""
  echo "If using real Twilio credentials and phone number:"
  echo "  - Check phone $TEST_PHONE for SMS"
  echo "  - Message should contain order number: $ORDER_NUMBER"
  echo "  - Message should contain tracking link"
  echo ""
  echo "Twilio Console: https://console.twilio.com/us1/monitor/logs/sms"
  echo ""
}

# Main execution
main() {
  # Check prerequisites
  check_env_vars

  # Create test order
  create_test_order

  # Verify order in database
  verify_order_in_database

  # Simulate/instruct on Stripe webhook
  simulate_stripe_webhook

  # Prompt user to complete payment
  echo -e "${YELLOW}Please complete the payment process using one of the options above.${NC}"
  echo "Press ENTER when payment is complete to continue verification..."
  read -r

  # Verify order confirmed
  verify_order_confirmed

  # Verify SMS notification record
  verify_sms_notification

  # Verify SMS message content
  verify_sms_message_content

  # Verify SMS received (manual)
  verify_sms_received

  # Summary
  echo "=========================================="
  echo "Test Summary"
  echo "=========================================="
  echo -e "${GREEN}Passed:${NC}  $PASSED"
  echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
  echo -e "${RED}Failed:${NC}  $FAILED"
  echo ""

  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ E2E TEST COMPLETED SUCCESSFULLY${NC}"
    echo ""
    echo "All automated checks passed. Please verify manually that:"
    echo "  1. SMS was received at $TEST_PHONE (if using real number)"
    echo "  2. Message contains order number: $ORDER_NUMBER"
    echo "  3. Message contains tracking link to order status page"
    exit 0
  else
    echo -e "${RED}❌ E2E TEST FAILED${NC}"
    echo ""
    echo "Some checks failed. Review the output above for details."
    exit 1
  fi
}

# Run main function
main
