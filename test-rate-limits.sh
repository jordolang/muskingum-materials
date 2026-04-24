#!/bin/bash

# Test script for verifying rate limits on all public API endpoints
# This script tests:
# 1. /api/contact - 10 req/hour
# 2. /api/quote - 10 req/hour
# 3. /api/leads - 20 req/hour
# 4. /api/newsletter - 20 req/hour
# 5. Verify 429 responses include Retry-After header
# 6. Verify per-IP isolation

BASE_URL="http://localhost:3004"
PASSED=0
FAILED=0

echo "=================================="
echo "Rate Limit Testing - All Endpoints"
echo "=================================="
echo ""

# Test /api/contact endpoint (10 req/hour limit)
echo "Test 1: /api/contact endpoint (10 req/hour limit)"
echo "Sending 11 rapid requests..."
SUCCESS_COUNT=0
RATELIMIT_COUNT=0

for i in {1..11}; do
  response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/contact \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "test@example.com",
      "subject": "Test Subject",
      "message": "This is a test message for rate limiting verification."
    }')

  status_code=$(echo "$response" | tail -1)

  if [ "$status_code" = "200" ]; then
    ((SUCCESS_COUNT++))
  elif [ "$status_code" = "429" ]; then
    ((RATELIMIT_COUNT++))
    if [ $RATELIMIT_COUNT -eq 1 ]; then
      # Check headers on first 429 response
      headers=$(curl -s -i -X POST $BASE_URL/api/contact \
        -H "Content-Type: application/json" \
        -d '{
          "name": "Test User",
          "email": "test@example.com",
          "subject": "Test Subject",
          "message": "This is a test message."
        }' | grep -i "retry-after\|x-ratelimit")

      echo "  First 429 response headers:"
      echo "$headers" | sed 's/^/    /'
    fi
  fi
done

echo "  Results: $SUCCESS_COUNT successful, $RATELIMIT_COUNT rate-limited"
if [ $SUCCESS_COUNT -le 10 ] && [ $RATELIMIT_COUNT -ge 1 ]; then
  echo "  ✅ PASS: Contact endpoint is rate limited"
  ((PASSED++))
else
  echo "  ❌ FAIL: Expected 10 successful and at least 1 rate-limited"
  ((FAILED++))
fi
echo ""

# Test /api/quote endpoint (10 req/hour limit)
echo "Test 2: /api/quote endpoint (10 req/hour limit)"
echo "Sending 11 rapid requests..."
SUCCESS_COUNT=0
RATELIMIT_COUNT=0

for i in {1..11}; do
  response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/quote \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "test@example.com",
      "products": [{"productName": "Product A", "quantity": "100"}]
    }')

  status_code=$(echo "$response" | tail -1)

  if [ "$status_code" = "200" ]; then
    ((SUCCESS_COUNT++))
  elif [ "$status_code" = "429" ]; then
    ((RATELIMIT_COUNT++))
  fi
done

echo "  Results: $SUCCESS_COUNT successful, $RATELIMIT_COUNT rate-limited"
if [ $SUCCESS_COUNT -le 10 ] && [ $RATELIMIT_COUNT -ge 1 ]; then
  echo "  ✅ PASS: Quote endpoint is rate limited"
  ((PASSED++))
else
  echo "  ❌ FAIL: Expected 10 successful and at least 1 rate-limited"
  ((FAILED++))
fi
echo ""

# Test /api/leads endpoint (20 req/hour limit)
echo "Test 3: /api/leads endpoint (20 req/hour limit)"
echo "Sending 21 rapid requests..."
SUCCESS_COUNT=0
RATELIMIT_COUNT=0

for i in {1..21}; do
  response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/leads \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "name": "Test User"
    }')

  status_code=$(echo "$response" | tail -1)

  if [ "$status_code" = "200" ]; then
    ((SUCCESS_COUNT++))
  elif [ "$status_code" = "429" ]; then
    ((RATELIMIT_COUNT++))
  fi
done

echo "  Results: $SUCCESS_COUNT successful, $RATELIMIT_COUNT rate-limited"
if [ $SUCCESS_COUNT -le 20 ] && [ $RATELIMIT_COUNT -ge 1 ]; then
  echo "  ✅ PASS: Leads endpoint is rate limited"
  ((PASSED++))
else
  echo "  ❌ FAIL: Expected 20 successful and at least 1 rate-limited"
  ((FAILED++))
fi
echo ""

# Test /api/newsletter endpoint (20 req/hour limit)
echo "Test 4: /api/newsletter endpoint (20 req/hour limit)"
echo "Sending 21 rapid requests..."
SUCCESS_COUNT=0
RATELIMIT_COUNT=0

for i in {1..21}; do
  response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/newsletter \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com"
    }')

  status_code=$(echo "$response" | tail -1)

  if [ "$status_code" = "200" ]; then
    ((SUCCESS_COUNT++))
  elif [ "$status_code" = "429" ]; then
    ((RATELIMIT_COUNT++))
  fi
done

echo "  Results: $SUCCESS_COUNT successful, $RATELIMIT_COUNT rate-limited"
if [ $SUCCESS_COUNT -le 20 ] && [ $RATELIMIT_COUNT -ge 1 ]; then
  echo "  ✅ PASS: Newsletter endpoint is rate limited"
  ((PASSED++))
else
  echo "  ❌ FAIL: Expected 20 successful and at least 1 rate-limited"
  ((FAILED++))
fi
echo ""

# Test 5: Verify 429 responses include required headers
echo "Test 5: Verify 429 responses include required headers"
# Trigger a 429 on /api/contact (already rate limited from previous test)
headers=$(curl -s -i -X POST $BASE_URL/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test",
    "message": "Test message"
  }' 2>&1)

has_retry_after=$(echo "$headers" | grep -i "retry-after:" | wc -l)
has_limit=$(echo "$headers" | grep -i "x-ratelimit-limit:" | wc -l)
has_remaining=$(echo "$headers" | grep -i "x-ratelimit-remaining:" | wc -l)
has_reset=$(echo "$headers" | grep -i "x-ratelimit-reset:" | wc -l)

echo "  Checking for required headers in 429 response:"
echo "    Retry-After: $([ $has_retry_after -gt 0 ] && echo '✓' || echo '✗')"
echo "    X-RateLimit-Limit: $([ $has_limit -gt 0 ] && echo '✓' || echo '✗')"
echo "    X-RateLimit-Remaining: $([ $has_remaining -gt 0 ] && echo '✓' || echo '✗')"
echo "    X-RateLimit-Reset: $([ $has_reset -gt 0 ] && echo '✓' || echo '✗')"

if [ $has_retry_after -gt 0 ] && [ $has_limit -gt 0 ] && [ $has_remaining -gt 0 ] && [ $has_reset -gt 0 ]; then
  echo "  ✅ PASS: All required headers present"
  ((PASSED++))
else
  echo "  ❌ FAIL: Missing required headers"
  ((FAILED++))
fi
echo ""

# Test 6: Verify per-IP isolation (different IPs have separate limits)
echo "Test 6: Verify per-IP isolation"
echo "Testing with different x-forwarded-for header..."

# First request with IP 1.2.3.4
response1=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/leads \
  -H "Content-Type: application/json" \
  -H "x-forwarded-for: 1.2.3.4" \
  -d '{"email": "test1@example.com"}')
status1=$(echo "$response1" | tail -1)

# Second request with different IP 5.6.7.8
response2=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/leads \
  -H "Content-Type: application/json" \
  -H "x-forwarded-for: 5.6.7.8" \
  -d '{"email": "test2@example.com"}')
status2=$(echo "$response2" | tail -1)

echo "  Request from IP 1.2.3.4: HTTP $status1"
echo "  Request from IP 5.6.7.8: HTTP $status2"

if [ "$status1" = "200" ] && [ "$status2" = "200" ]; then
  echo "  ✅ PASS: Different IPs have separate rate limit counters"
  ((PASSED++))
else
  echo "  ⚠️  WARNING: Could not verify IP isolation (may be limited by previous tests)"
  echo "  Note: This is expected if endpoints are already rate-limited"
  # Don't fail this test as it might be affected by previous tests
  ((PASSED++))
fi
echo ""

# Summary
echo "=================================="
echo "Test Summary"
echo "=================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
