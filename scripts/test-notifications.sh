#!/bin/bash
# End-to-End Notification Test Script

echo "🧪 Testing GhostReply Push Notifications Flow"
echo "=============================================="
echo ""

# Configuration
DOMAIN="http://localhost:3000"
TEST_DEVICE_ID="test-device-$(date +%s)"

echo "step 1: Check Backend Health"
echo "---"
RESPONSE=$(curl -s -w "\n%{http_code}" "$DOMAIN/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo "Backend status: HTTP $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "404" ]; then
  echo "❌ Backend not responding. Make sure server is running on port 3000"
  exit 1
fi

echo "✅ Backend is running"
echo ""

# Step 2: Generate test expo token
TEST_TOKEN="ExponentPushToken[TEST$(date +%s)$(uuidgen | head -c 10)]"
echo "Step 2: Generate Test Expo Push Token"
echo "---"
echo "Generated token: $TEST_TOKEN"
echo ""

# Step 3: Register push token
echo "Step 3: Register Push Token"
echo "---"
curl -X POST "$DOMAIN/api/notifications/token" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: $TEST_DEVICE_ID" \
  -d "{\"token\": \"$TEST_TOKEN\"}" \
  -v 2>&1 | grep -E "(HTTP|success|error)"
echo ""

# Step 4: Send test notification
echo "Step 4: Send Test Notification"
echo "---"
curl -X POST "$DOMAIN/api/notifications/test" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: $TEST_DEVICE_ID" \
  -d "{\"token\": \"$TEST_TOKEN\"}" \
  -v 2>&1 | grep -E "(HTTP|success|error)"
echo ""

echo "✅ Test Complete!"
echo ""
echo "Summary:"
echo "- Device ID: $TEST_DEVICE_ID"
echo "- Token: ${TEST_TOKEN:0:50}..."
echo "- Check /api/notifications/token to register real token from device"
echo "- Check /api/notifications/test to send test notification"
