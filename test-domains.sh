#!/bin/bash

# Test Script for Domain Reselling System
# Ce script teste tous les endpoints du système de revente de domaines
# Utilisation: ./test-domains.sh [base-url] [user-id]

BASE_URL="${1:-http://localhost:3000}"
USER_ID="${2:-test-user-$(date +%s)}"

echo "🚀 Domain Reselling System - Test Suite"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "User ID: $USER_ID"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_code=$5

  echo -e "${YELLOW}→${NC} Testing: $test_name"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "x-user-id: $USER_ID" \
      -H "Content-Type: application/json" \
      "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "x-user-id: $USER_ID" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi

  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq "$expected_code" ]; then
    echo -e "${GREEN}✓${NC} PASS (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} FAIL (Expected HTTP $expected_code, got $http_code)"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  echo ""
  
  # Save order ID from first POST to order
  if [ "$endpoint" = "/api/domains/order" ] && [ "$method" = "POST" ] && [ "$http_code" -eq 201 ]; then
    ORDER_ID=$(echo "$body" | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)
    echo "Saved ORDER_ID: $ORDER_ID"
  fi
}

echo "📋 DOMAIN ENDPOINTS TESTS"
echo "=========================="
echo ""

# Test 1: Search domains (GET)
run_test \
  "Search for available domains" \
  "GET" \
  "/api/domains/search?keyword=test" \
  "" \
  200

# Test 2: Create domain order (POST)
echo "Payload: {\"domain\":\"test-$(date +%s).app\",\"price\":11.99}"
run_test \
  "Create domain order" \
  "POST" \
  "/api/domains/order" \
  "{\"domain\":\"test-$(date +%s).app\",\"price\":11.99}" \
  201

# Wait a moment to ensure ORDER_ID is set
sleep 1

# Test 3: Fetch orders (GET)
run_test \
  "Fetch user orders" \
  "GET" \
  "/api/domains/order" \
  "" \
  200

# Test 4: Create Stripe checkout session
if [ -z "$ORDER_ID" ]; then
  echo -e "${RED}⚠ Skipping checkout test - no ORDER_ID${NC}"
else
  run_test \
    "Create Stripe checkout session" \
    "POST" \
    "/api/domains/checkout" \
    "{\"orderId\":\"$ORDER_ID\",\"domain\":\"test.app\",\"price\":11.99}" \
    200
fi

# Test 5: Test rate limiting
echo -e "${YELLOW}→${NC} Testing: Rate limiting (5 requests in quick succession)"
for i in {1..6}; do
  http_code=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
    -H "x-user-id: rate-limit-test-$USER_ID" \
    -H "Content-Type: application/json" \
    -d "{\"domain\":\"test-$i.app\",\"price\":11.99}" \
    "$BASE_URL/api/domains/order")
  
  if [ $i -le 5 ]; then
    if [ "$http_code" -eq 201 ]; then
      echo -e "${GREEN}✓${NC} Request $i: $http_code (expected 201)"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}✗${NC} Request $i: $http_code (expected 201)"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  else
    if [ "$http_code" -eq 429 ]; then
      echo -e "${GREEN}✓${NC} Request $i: $http_code (rate limited as expected)"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}✗${NC} Request $i: $http_code (expected 429 for rate limit)"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  fi
done
echo ""

# Test 6: Authentication test
echo -e "${YELLOW}→${NC} Testing: Authentication (no x-user-id header)"
http_code=$(curl -s -w "%{http_code}" -o /dev/null -X GET \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/domains/order")

if [ "$http_code" -eq 401 ]; then
  echo -e "${GREEN}✓${NC} Correctly rejected unauthenticated request (HTTP 401)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗${NC} Should reject unauthenticated request (got HTTP $http_code)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 7: Invalid request test
echo -e "${YELLOW}→${NC} Testing: Invalid request (missing required fields)"
http_code=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.app"}' \
  "$BASE_URL/api/domains/order")

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓${NC} Correctly rejected invalid request (HTTP 400)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗${NC} Should reject invalid request (got HTTP $http_code)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Summary
echo "📊 TEST SUMMARY"
echo "==============="
echo -e "${GREEN}✓ Passed:${NC} $TESTS_PASSED"
echo -e "${RED}✗ Failed:${NC} $TESTS_FAILED"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL))

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! (${SUCCESS_RATE}%)${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. (${SUCCESS_RATE}%)${NC}"
  exit 1
fi
