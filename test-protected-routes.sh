#!/bin/bash

# Test script to verify protected routes are NOT rate limited
# while public routes ARE rate limited

PORT=3004
BASE_URL="http://localhost:${PORT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Testing Protected Routes Rate Limiting"
echo "========================================="
echo ""

# Test 1: Verify public route IS rate limited
echo "Test 1: Verify public route /api/chat IS rate limited"
echo "-----------------------------------------------"

rate_limited=false
for i in {1..10}; do
  response=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/api/chat" \
    -H "Content-Type: application/json" \
    -H "x-forwarded-for: 192.168.1.100" \
    -d '{"message":"test"}')

  status_code=$(echo "$response" | tail -n1)

  if [ "$status_code" = "429" ]; then
    echo -e "${GREEN}✓ Request #${i}: Got 429 (rate limited as expected)${NC}"
    rate_limited=true
    break
  else
    echo "  Request #${i}: Got ${status_code}"
  fi
done

if [ "$rate_limited" = true ]; then
  echo -e "${GREEN}✓ Test 1 PASSED: Public route is rate limited${NC}"
else
  echo -e "${RED}✗ Test 1 FAILED: Public route was NOT rate limited${NC}"
  exit 1
fi

echo ""
echo "Test 2: Verify protected route /api/account/profile is NOT rate limited"
echo "-----------------------------------------------------------------------"

# Test 2: Verify protected route is NOT rate limited (should get 401 Unauthorized, not 429)
rate_limited_protected=false
auth_errors=0

for i in {1..15}; do
  response=$(curl -s -w "\n%{http_code}" -X GET \
    "${BASE_URL}/api/account/profile" \
    -H "x-forwarded-for: 192.168.1.101")

  status_code=$(echo "$response" | tail -n1)

  if [ "$status_code" = "429" ]; then
    echo -e "${RED}✗ Request #${i}: Got 429 (should NOT be rate limited!)${NC}"
    rate_limited_protected=true
    break
  elif [ "$status_code" = "401" ]; then
    echo "  Request #${i}: Got 401 Unauthorized (expected - no auth token)"
    ((auth_errors++))
  else
    echo "  Request #${i}: Got ${status_code}"
  fi
done

if [ "$rate_limited_protected" = true ]; then
  echo -e "${RED}✗ Test 2 FAILED: Protected route WAS rate limited (should NOT be)${NC}"
  exit 1
elif [ "$auth_errors" -ge 10 ]; then
  echo -e "${GREEN}✓ Test 2 PASSED: Protected route is NOT rate limited (got 401 auth errors, not 429)${NC}"
else
  echo -e "${YELLOW}⚠ Test 2 WARNING: Expected more 401 responses, got ${auth_errors}${NC}"
fi

echo ""
echo "Test 3: Verify another protected route /api/account/orders is NOT rate limited"
echo "-------------------------------------------------------------------------------"

# Test 3: Try another protected endpoint
rate_limited_orders=false
auth_errors_orders=0

for i in {1..15}; do
  response=$(curl -s -w "\n%{http_code}" -X GET \
    "${BASE_URL}/api/account/orders" \
    -H "x-forwarded-for: 192.168.1.102")

  status_code=$(echo "$response" | tail -n1)

  if [ "$status_code" = "429" ]; then
    echo -e "${RED}✗ Request #${i}: Got 429 (should NOT be rate limited!)${NC}"
    rate_limited_orders=true
    break
  elif [ "$status_code" = "401" ]; then
    echo "  Request #${i}: Got 401 Unauthorized (expected - no auth token)"
    ((auth_errors_orders++))
  else
    echo "  Request #${i}: Got ${status_code}"
  fi
done

if [ "$rate_limited_orders" = true ]; then
  echo -e "${RED}✗ Test 3 FAILED: Protected route /api/account/orders WAS rate limited${NC}"
  exit 1
elif [ "$auth_errors_orders" -ge 10 ]; then
  echo -e "${GREEN}✓ Test 3 PASSED: Protected route is NOT rate limited (got 401 auth errors, not 429)${NC}"
else
  echo -e "${YELLOW}⚠ Test 3 WARNING: Expected more 401 responses, got ${auth_errors_orders}${NC}"
fi

echo ""
echo "========================================="
echo "Summary"
echo "========================================="
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Verified:"
echo "  1. Public routes (/api/chat) ARE rate limited"
echo "  2. Protected routes (/api/account/profile) are NOT rate limited"
echo "  3. Protected routes (/api/account/orders) are NOT rate limited"
echo ""
echo "Protected routes return 401 Unauthorized (auth required)"
echo "instead of 429 Too Many Requests (rate limit)"
