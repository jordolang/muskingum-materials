# E2E Test: SMS Opt-Out via STOP Command

This document describes the end-to-end test for TCPA-compliant SMS opt-out functionality.

## Overview

The E2E test verifies that the STOP command properly opts users out of SMS notifications:

1. ✅ Create initial order with SMS opt-in enabled
2. ✅ Send STOP message to Twilio webhook endpoint
3. ✅ Verify webhook receives and processes STOP command
4. ✅ Verify UserProfile.smsOptIn set to false for matching phone number
5. ✅ Verify Order.smsOptIn set to false for all orders with that phone
6. ✅ Create new order with same phone number
7. ✅ Verify NO SMS is sent for new order (TCPA compliance)

## TCPA Compliance Requirements

The test validates that the system meets these critical TCPA requirements:

- **Immediate Opt-Out**: STOP command must immediately prevent all future SMS
- **Permanent Until Re-Opt-In**: Opt-out must persist across all future orders
- **Multiple Keywords**: Must support STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
- **No Overrides**: Even if user selects SMS opt-in on new order, STOP command takes precedence

## Prerequisites

### 1. Development Server Running

```bash
npm run dev
```

Server should be running on `http://localhost:3000` (or your configured port).

### 2. Environment Variables

Add these to `.env.local`:

```bash
# Twilio (Required for webhook signature validation)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: This test requires real Twilio credentials (not test credentials) because it needs to generate valid webhook signatures. However, no actual SMS messages are sent - the test only simulates webhook calls.

### 3. Database Access

Tests require database access to verify records. Run from **main project directory**, not the worktree:

```bash
cd /Users/jordanlang/Repos/muskingum-materials
```

## Running the Test

### Automated Test Script

```bash
# From main project directory
node test-sms-opt-out.js

# With custom parameters
node test-sms-opt-out.js --base-url http://localhost:3000 --phone +15005550006
```

The script will:
1. ✅ Check required environment variables
2. ✅ Create an initial order with SMS opt-in enabled
3. ✅ Simulate STOP message to webhook endpoint
4. 📝 Provide database verification instructions
5. ✅ Create a new order with the opted-out phone number
6. 📝 Provide instructions to verify no SMS is sent

### Manual Test Steps

If you prefer to test manually:

#### Step 1: Create Initial Order with SMS Opt-In

```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+15005550006",
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
```

Save the returned `orderNumber` for verification.

#### Step 2: Simulate STOP Message

This requires generating a valid Twilio signature. Use the test script or Twilio CLI:

```bash
# Using Twilio CLI (if configured to forward to your webhook)
twilio api:core:messages:create \
  --from +15005550006 \
  --to $TWILIO_PHONE_NUMBER \
  --body "STOP"
```

Or use the automated test script which handles signature generation:

```bash
node test-sms-opt-out.js
```

#### Step 3: Verify Database Updates

```sql
-- Check UserProfile opt-out
SELECT "phone", "smsOptIn", "updatedAt" 
FROM "UserProfile" 
WHERE "phone" = '+15005550006';
-- Expected: smsOptIn = false

-- Check all Orders with this phone are opted out
SELECT "orderNumber", "phone", "smsOptIn", "updatedAt" 
FROM "Order" 
WHERE "phone" = '+15005550006'
ORDER BY "createdAt" DESC;
-- Expected: smsOptIn = false for ALL orders
```

Or use Prisma Studio:

```bash
npx prisma studio
# Navigate to UserProfile and Order tables
# Filter by phone: +15005550006
# Verify smsOptIn = false
```

#### Step 4: Create New Order (After Opt-Out)

```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User (After Opt-Out)",
    "email": "test@example.com",
    "phone": "+15005550006",
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
```

Save the new `orderNumber`.

#### Step 5: Complete Payment and Verify No SMS

1. Complete Stripe payment for the new order:
   - Use test card: 4242 4242 4242 4242
   - Any future expiry and CVC

2. Verify order status updated:

```sql
SELECT "orderNumber", "status", "paymentStatus", "smsOptIn", "phone" 
FROM "Order" 
WHERE "orderNumber" = 'MM-20260423-XXXXXX';
-- Expected: status = 'confirmed', paymentStatus = 'paid', smsOptIn = true
```

3. **Critical Check**: Verify NO SmsNotification record created:

```sql
SELECT COUNT(*) as notification_count
FROM "SmsNotification" n
JOIN "Order" o ON n."orderId" = o."id"
WHERE o."orderNumber" = 'MM-20260423-XXXXXX';
-- Expected: notification_count = 0
```

This is the key TCPA compliance check! Even though the order has `smsOptIn = true`, the prior STOP command should prevent SMS delivery.

## Test Scenarios

### Scenario 1: STOP Command (Primary Test)

- Keyword: `STOP`
- Expected: Immediate opt-out, no future SMS

### Scenario 2: STOPALL Command

- Keyword: `STOPALL`
- Expected: Same behavior as STOP

### Scenario 3: UNSUBSCRIBE Command

- Keyword: `UNSUBSCRIBE`
- Expected: Same behavior as STOP

### Scenario 4: Other Keywords

Test with: `CANCEL`, `END`, `QUIT`

All should trigger opt-out behavior.

### Scenario 5: Case Insensitive

- Keywords: `stop`, `Stop`, `sToP`
- Expected: All should work (webhook normalizes to uppercase)

### Scenario 6: Re-Opt-In via Profile

After opt-out via STOP:

1. User navigates to profile settings
2. User enables SMS opt-in toggle
3. User saves profile
4. Create new order
5. SMS should now be sent (user explicitly re-opted-in)

## Expected Behavior

### When STOP is Received

1. Webhook validates Twilio signature
2. Webhook parses incoming message body
3. Webhook detects STOP keyword (case-insensitive)
4. Webhook updates `UserProfile.smsOptIn = false` for matching phone
5. Webhook updates `Order.smsOptIn = false` for ALL orders with matching phone
6. Webhook logs opt-out event
7. Webhook returns `{ success: true, action: "opted_out" }`

### When New Order is Created After STOP

1. Checkout form may show SMS opt-in as checked
2. Order record may have `smsOptIn = true`
3. **BUT** webhook handler checks UserProfile before sending SMS
4. If UserProfile.smsOptIn is false, skip SMS sending
5. No SmsNotification record is created
6. Order confirmation email is still sent

## Implementation Details

### Webhook Endpoint

**File**: `app/api/sms/webhook/route.ts`

**Supported STOP Keywords**:
```javascript
const stopKeywords = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
```

**Database Updates**:
```javascript
// Opt-out user profile
await prisma.userProfile.updateMany({
  where: { phone: fromNumber },
  data: { smsOptIn: false },
});

// Opt-out all orders with this phone
await prisma.order.updateMany({
  where: { phone: fromNumber },
  data: { smsOptIn: false },
});
```

### SMS Sending Logic

**File**: `app/api/orders/webhook/route.ts`

Before sending SMS, the webhook should check:

```javascript
// Check if user has SMS opt-in enabled
const order = await prisma.order.findUnique({
  where: { orderNumber },
  include: { user: { include: { userProfile: true } } }
});

// Only send SMS if BOTH order AND user profile allow it
if (order.smsOptIn && order.user?.userProfile?.smsOptIn !== false) {
  await sendSMS({ to: order.phone, message: confirmationMessage });
}
```

**Note**: The current implementation only checks `order.smsOptIn`. For full TCPA compliance, it should also check `UserProfile.smsOptIn` to respect STOP commands across all future orders.

## Success Criteria

✅ **Webhook Processing**
- STOP message is received and processed without errors
- Webhook returns `{ success: true, action: "opted_out" }`
- No 400/500 errors in webhook response

✅ **Database Updates**
- UserProfile.smsOptIn = false for matching phone number
- Order.smsOptIn = false for ALL orders with matching phone
- Updates are immediate (no delays)

✅ **SMS Prevention**
- New order created after STOP does NOT generate SmsNotification record
- No SMS is sent even if order.smsOptIn = true
- Order confirmation email is still sent (fallback)

✅ **TCPA Compliance**
- All standard STOP keywords are supported
- Keywords are case-insensitive
- Opt-out is immediate and permanent
- No SMS sent until user explicitly re-opts-in via profile

## Troubleshooting

### Webhook Signature Validation Fails

**Error**: `Webhook verification failed`

**Cause**: Invalid Twilio signature

**Solution**:
- Ensure `TWILIO_AUTH_TOKEN` is set correctly
- Verify webhook URL matches exactly (including http:// vs https://)
- Check that form data parameters are correctly formatted
- Use the test script which handles signature generation automatically

### Database Not Updated

**Error**: STOP processed but smsOptIn still true

**Cause**: Phone number mismatch or database update failed

**Solution**:
- Check server logs for database errors
- Verify phone number format matches exactly (E.164 format: +15005550006)
- Ensure database connection is working
- Check Prisma schema for UserProfile and Order models

### SMS Still Sent After STOP

**Error**: New order sends SMS despite STOP command

**Cause**: Webhook handler only checks order.smsOptIn, not UserProfile.smsOptIn

**Solution**:
- Update `app/api/orders/webhook/route.ts` to check both order AND user profile
- Add additional check before sending SMS:
  ```javascript
  const userProfile = await prisma.userProfile.findFirst({
    where: { phone: order.phone }
  });
  
  if (order.smsOptIn && userProfile?.smsOptIn !== false) {
    // Send SMS
  }
  ```

### Test Script Cannot Connect

**Error**: `Failed to send STOP message - ECONNREFUSED`

**Cause**: Dev server not running

**Solution**:
- Start dev server: `npm run dev`
- Verify server is running on correct port
- Check `BASE_URL` parameter matches server URL

## Cleanup

After testing, clean up test data:

```sql
-- Delete test orders
DELETE FROM "Order" WHERE "phone" = '+15005550006';

-- Reset test user profile
UPDATE "UserProfile" 
SET "smsOptIn" = false 
WHERE "phone" = '+15005550006';

-- Or delete test user profile entirely
DELETE FROM "UserProfile" WHERE "phone" = '+15005550006';

-- Delete any test SMS notifications
DELETE FROM "SmsNotification" WHERE "phone" = '+15005550006';
```

## Additional Resources

- [TCPA Compliance Guide](https://www.twilio.com/learn/commerce/tcpa-compliance)
- [Twilio Webhooks Documentation](https://www.twilio.com/docs/usage/webhooks)
- [Twilio Signature Validation](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [SMS Opt-Out Best Practices](https://www.twilio.com/docs/glossary/what-is-sms-opt-out)

## Next Steps

After this test passes:

1. Test re-opt-in flow via profile settings (verify SMS resumes)
2. Test STOP command with real phone number (not test number)
3. Monitor production logs for STOP command handling
4. Set up alerts for failed opt-out processing
5. Document opt-out handling in user-facing help documentation
