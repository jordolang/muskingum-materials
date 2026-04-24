#!/bin/bash

#
# E2E Test: SMS Opt-Out via STOP Command
#
# Tests TCPA-compliant STOP command handling:
# 1. Create initial order with SMS opt-in
# 2. Simulate STOP message to webhook
# 3. Verify database updates (UserProfile and Order opt-out)
# 4. Create new order with opted-out phone
# 5. Verify no SMS is sent for new order
#
# Prerequisites:
# - Dev server running: npm run dev
# - Database accessible (run from main project directory)
# - Environment variables configured (see .env.local)
#
# Usage:
#   ./test-sms-opt-out.sh
#   BASE_URL=http://localhost:3000 TEST_PHONE=+15005550006 ./test-sms-opt-out.sh
#

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_PHONE="${TEST_PHONE:-+15005550006}"
TEST_EMAIL="test-opt-out@example.com"
TEST_NAME="Opt-Out Test User"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
  echo ""
  echo "=========================================="
  echo "$1"
  echo "=========================================="
  echo ""
}

print_section() {
  echo ""
  echo "$1"
  echo "$(echo "$1" | sed 's/./-/g')"
}

print_result() {
  local test_name="$1"
  local result="$2"
  local message="${3:-}"

  case "$result" in
    PASS)
      echo -e "${GREEN}✅ PASS${NC}: $test_name"
      ((PASSED++))
      ;;
    FAIL)
      echo -e "${RED}❌ FAIL${NC}: $test_name"
      ((FAILED++))
      ;;
    WARN)
      echo -e "${YELLOW}⚠️  WARN${NC}: $test_name"
      ((WARNINGS++))
      ;;
    INFO)
      echo -e "${BLUE}ℹ️  INFO${NC}: $test_name"
      ;;
  esac

  if [ -n "$message" ]; then
    echo "   $message"
  fi
}

# Generate Twilio webhook signature
generate_twilio_signature() {
  local auth_token="$1"
  local url="$2"
  local params="$3"

  # Create data string (URL + sorted params)
  local data="${url}${params}"

  # Generate HMAC-SHA1 signature
  echo -n "$data" | openssl dgst -sha1 -hmac "$auth_token" -binary | base64
}

# Check environment variables
check_environment() {
  print_header "E2E Test: SMS Opt-Out via STOP Command"

  echo "Configuration:"
  echo "  Base URL: $BASE_URL"
  echo "  Test Phone: $TEST_PHONE"
  echo "  Test Email: $TEST_EMAIL"

  print_section "Step 1: Environment Variable Check"

  local required_vars=(
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
    return 0
  else
    print_result "Missing environment variables: ${missing_vars[*]}" "FAIL"
    echo ""
    echo "Please set the following environment variables in .env.local:"
    for var in "${missing_vars[@]}"; do
      echo "  $var="
    done
    echo ""
    return 1
  fi
}

# Create initial order with SMS opt-in
create_initial_order() {
  print_section "Step 2: Create Initial Order with SMS Opt-in"

  local order_data='{
    "name": "'"$TEST_NAME"'",
    "email": "'"$TEST_EMAIL"'",
    "phone": "'"$TEST_PHONE"'",
    "smsOptIn": true,
    "fulfillment": "pickup",
    "items": [
      {
        "name": "Test Material",
        "price": 25.00,
        "unit": "ton",
        "quantity": 1
      }
    ],
    "subtotal": 25.00,
    "tax": 1.81,
    "processingFee": 1.45,
    "total": 28.26
  }'

  local response
  response=$(curl -s -X POST "$BASE_URL/api/orders/checkout" \
    -H "Content-Type: application/json" \
    -d "$order_data")

  local order_number
  order_number=$(echo "$response" | grep -o '"orderNumber":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$order_number" ]; then
    print_result "Initial order created successfully" "PASS" "Order Number: $order_number"
    echo "$order_number"
    return 0
  else
    print_result "Failed to create initial order" "FAIL" "Response: $response"
    return 1
  fi
}

# Simulate STOP message to webhook
simulate_stop_message() {
  print_section "Step 3: Simulate STOP Message to Webhook"

  if [ -z "$TWILIO_AUTH_TOKEN" ] || [ -z "$TWILIO_PHONE_NUMBER" ]; then
    print_result "Cannot simulate webhook without Twilio credentials" "FAIL"
    return 1
  fi

  local webhook_url="$BASE_URL/api/sms/webhook"

  # Generate random MessageSid
  local message_sid="SM$(openssl rand -hex 16)"

  # Build webhook parameters (sorted alphabetically for signature)
  local params="AccountSid${TWILIO_ACCOUNT_SID}Body${STOP_KEYWORD}From${TEST_PHONE}MessageSid${message_sid}NumMedia0To${TWILIO_PHONE_NUMBER}"

  # Generate Twilio signature
  local signature
  signature=$(generate_twilio_signature "$TWILIO_AUTH_TOKEN" "$webhook_url" "$params")

  # Build form data
  local form_data="MessageSid=${message_sid}&AccountSid=${TWILIO_ACCOUNT_SID}&From=${TEST_PHONE}&To=${TWILIO_PHONE_NUMBER}&Body=${STOP_KEYWORD}&NumMedia=0"

  # Send webhook request
  local response
  response=$(curl -s -X POST "$webhook_url" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "X-Twilio-Signature: $signature" \
    -d "$form_data")

  # Check response
  if echo "$response" | grep -q '"success":true'; then
    if echo "$response" | grep -q '"action":"opted_out"'; then
      print_result "STOP message processed successfully" "PASS" "Webhook returned opted_out action"
      return 0
    else
      print_result "Webhook succeeded but no opt-out action" "WARN" "Response: $response"
      return 0
    fi
  else
    print_result "Webhook failed to process STOP" "FAIL" "Response: $response"
    return 1
  fi
}

# Verify database updates
verify_database_updates() {
  print_section "Step 4: Verify Database Updates"

  print_result "Database verification required" "INFO" "Use Prisma Studio or SQL queries"

  echo ""
  echo "To verify opt-out was processed:"
  echo ""
  echo "1. Check UserProfile.smsOptIn is set to false:"
  echo "   SELECT \"phone\", \"smsOptIn\" FROM \"UserProfile\""
  echo "   WHERE \"phone\" = '$TEST_PHONE';"
  echo "   Expected: smsOptIn = false"
  echo ""
  echo "2. Check Order.smsOptIn is set to false:"
  echo "   SELECT \"orderNumber\", \"phone\", \"smsOptIn\" FROM \"Order\""
  echo "   WHERE \"phone\" = '$TEST_PHONE'"
  echo "   ORDER BY \"createdAt\" DESC LIMIT 5;"
  echo "   Expected: smsOptIn = false for all orders with this phone"
  echo ""
  echo "Alternative: Use Prisma Studio"
  echo "   npx prisma studio"
  echo "   Navigate to UserProfile and Order tables"
  echo "   Filter by phone: $TEST_PHONE"
  echo "   Verify smsOptIn = false"
  echo ""
}

# Create new order with opted-out phone
create_order_after_optout() {
  print_section "Step 5: Create New Order with Opted-Out Phone"

  local order_data='{
    "name": "'"$TEST_NAME"' (After Opt-Out)",
    "email": "'"$TEST_EMAIL"'",
    "phone": "'"$TEST_PHONE"'",
    "smsOptIn": true,
    "fulfillment": "pickup",
    "items": [
      {
        "name": "Test Material 2",
        "price": 30.00,
        "unit": "ton",
        "quantity": 1
      }
    ],
    "subtotal": 30.00,
    "tax": 2.18,
    "processingFee": 1.62,
    "total": 33.80
  }'

  local response
  response=$(curl -s -X POST "$BASE_URL/api/orders/checkout" \
    -H "Content-Type: application/json" \
    -d "$order_data")

  local order_number
  order_number=$(echo "$response" | grep -o '"orderNumber":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$order_number" ]; then
    print_result "New order created after opt-out" "PASS" "Order Number: $order_number"
    echo "$order_number"
    return 0
  else
    print_result "Failed to create new order" "FAIL" "Response: $response"
    return 1
  fi
}

# Verify no SMS sent for new order
verify_no_sms_sent() {
  local order_number="$1"

  print_section "Step 6: Verify No SMS Sent for New Order"

  echo ""
  echo "After completing payment for order $order_number, verify:"
  echo ""
  echo "1. Complete payment for the order:"
  echo "   Use Stripe test card: 4242 4242 4242 4242"
  echo "   Complete Stripe checkout"
  echo ""
  echo "2. Verify order status updated to confirmed:"
  echo "   SELECT \"status\", \"paymentStatus\", \"smsOptIn\" FROM \"Order\""
  echo "   WHERE \"orderNumber\" = '$order_number';"
  echo "   Expected: status = 'confirmed', paymentStatus = 'paid', smsOptIn = true"
  echo ""
  echo "3. Verify NO SmsNotification record was created:"
  echo "   SELECT COUNT(*) as count FROM \"SmsNotification\" n"
  echo "   JOIN \"Order\" o ON n.\"orderId\" = o.\"id\""
  echo "   WHERE o.\"orderNumber\" = '$order_number';"
  echo "   Expected: count = 0 (no SMS notifications created)"
  echo ""
  echo "TCPA Compliance Note:"
  echo "   Even though the order has smsOptIn=true, the STOP command"
  echo "   should prevent ANY future SMS messages to this phone number"
  echo "   until the user explicitly opts back in via profile settings."
  echo ""
}

# Alternative STOP keywords info
show_alternative_keywords() {
  print_section "Step 7: Alternative STOP Keywords (Optional)"

  print_result "Additional STOP keywords to test" "INFO"

  echo ""
  echo "The webhook handles multiple STOP keywords:"
  echo "  - STOP"
  echo "  - STOPALL"
  echo "  - UNSUBSCRIBE"
  echo "  - CANCEL"
  echo "  - END"
  echo "  - QUIT"
  echo ""
  echo "To test additional keywords:"
  echo "  STOP_KEYWORD=UNSUBSCRIBE ./test-sms-opt-out.sh"
  echo ""
}

# Print summary
print_summary() {
  local initial_order="$1"
  local new_order="$2"

  print_header "Test Summary"

  echo -e "${GREEN}Passed:${NC}  $PASSED"
  echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
  echo -e "${RED}Failed:${NC}  $FAILED"
  echo ""

  if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ E2E TEST COMPLETED${NC}"
    echo ""
    echo "STOP command processed successfully. Follow the verification"
    echo "instructions above to confirm database updates and that no SMS"
    echo "is sent for new orders with opted-out phone numbers."
    echo ""
    echo "Test Details:"
    echo "  Initial Order: $initial_order"
    echo "  Phone: $TEST_PHONE"
    echo "  STOP Command: Processed"
    if [ -n "$new_order" ]; then
      echo "  New Order: $new_order (should NOT receive SMS)"
    fi
    echo ""
    return 0
  else
    echo -e "${RED}❌ E2E TEST FAILED${NC}"
    echo ""
    echo "Some checks failed. Review the output above for details."
    echo ""
    return 1
  fi
}

# Main execution
main() {
  # Default STOP keyword
  STOP_KEYWORD="${STOP_KEYWORD:-STOP}"

  # Step 1: Check environment
  if ! check_environment; then
    echo ""
    echo "❌ E2E TEST ABORTED - Missing environment variables"
    echo ""
    exit 1
  fi

  # Step 2: Create initial order
  local initial_order
  if ! initial_order=$(create_initial_order); then
    echo ""
    echo "❌ E2E TEST FAILED - Could not create initial order"
    echo ""
    exit 1
  fi

  # Step 3: Simulate STOP message
  if ! simulate_stop_message; then
    echo ""
    echo "❌ E2E TEST FAILED - STOP message not processed"
    echo ""
    exit 1
  fi

  # Step 4: Verify database updates
  verify_database_updates

  # Step 5: Create new order after opt-out
  local new_order=""
  if new_order=$(create_order_after_optout); then
    # Step 6: Verify no SMS sent
    verify_no_sms_sent "$new_order"
  else
    print_result "Skipping no-SMS verification" "WARN" "Could not create new order"
  fi

  # Step 7: Show alternative keywords
  show_alternative_keywords

  # Summary
  if print_summary "$initial_order" "$new_order"; then
    exit 0
  else
    exit 1
  fi
}

# Run main
main "$@"
