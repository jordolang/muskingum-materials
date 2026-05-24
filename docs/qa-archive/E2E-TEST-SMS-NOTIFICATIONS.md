# E2E Test: SMS Order Notifications

This document describes the end-to-end test for SMS order notifications functionality.

## Overview

The E2E test verifies the complete flow from checkout to SMS delivery:

1. ✅ Customer completes checkout with SMS opt-in enabled
2. ✅ Customer completes Stripe payment
3. ✅ Order status updates to 'confirmed' in database
4. ✅ SmsNotification record is created with status 'sent' or 'delivered'
5. ✅ SMS is sent to customer's phone number
6. ✅ SMS message contains order number and tracking link

## Prerequisites

### 1. Development Server Running

```bash
npm run dev
```

Server should be running on `http://localhost:3000` (or your configured port).

### 2. Environment Variables

Add these to `.env.local`:

```bash
# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Twilio (Test Credentials for testing, or real credentials for actual SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Postmark (for email fallback)
POSTMARK_API_TOKEN=...
```

#### Using Twilio Test Credentials

To avoid SMS charges during testing, use Twilio's test credentials:

- **Test Account SID**: Available in Twilio Console → Test Credentials
- **Test Auth Token**: Available in Twilio Console → Test Credentials
- **Test Phone Number**: Use `+15005550006` (magic test number)

**Important**: With test credentials:
- No actual SMS messages are sent
- SMS delivery shows as "sent" in logs but no real message is delivered
- Perfect for automated testing without charges

More info: https://www.twilio.com/docs/iam/test-credentials

### 3. Database Access

Tests require database access to verify records. Run from **main project directory**, not the worktree:

```bash
cd /Users/jordanlang/Repos/muskingum-materials
```

### 4. Stripe CLI (Optional but Recommended)

Install Stripe CLI for webhook testing:

```bash
brew install stripe/stripe-cli/stripe
# OR
# Download from: https://stripe.com/docs/stripe-cli
```

## Running the Test

### Option 1: Node.js Test Script (Recommended)

```bash
# From main project directory
node test-sms-e2e.js

# With custom parameters
node test-sms-e2e.js --base-url http://localhost:3000 --phone +15005550006
```

The script will:
1. ✅ Check environment variables
2. ✅ Create a test order with SMS opt-in
3. 📝 Provide instructions for completing payment
4. 📝 Provide verification steps for post-payment checks

### Option 2: Bash Test Script

```bash
# From main project directory
./test-sms-order-notifications.sh

# With custom parameters
./test-sms-order-notifications.sh http://localhost:3000 +15005550006
```

### Option 3: Manual Testing

Follow the manual test steps below.

## Manual Test Steps

### Step 1: Create Order with SMS Opt-in

1. Navigate to checkout page: `http://localhost:3000/order`
2. Fill out checkout form:
   - **Name**: Test User
   - **Email**: test-sms@example.com
   - **Phone**: +15005550006 (or your test number)
   - **SMS Opt-in**: ✅ Check the checkbox
   - **Items**: Add any product
3. Click "Proceed to Checkout"
4. **Save the Order Number** displayed (format: `MM-YYMMDD-XXXXXXXX`)

### Step 2: Complete Stripe Payment

#### Option A: Use Stripe CLI (Recommended)

```bash
# Terminal 1: Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/orders/webhook

# Terminal 2: Complete payment at checkout URL
# Use Stripe test card: 4242 4242 4242 4242
# Any future expiry, any CVC
```

#### Option B: Manual Checkout

1. Visit the Stripe Checkout URL provided
2. Enter test card details:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
3. Click "Pay"

⚠️ **Important**: If testing manually without Stripe CLI, you need to:
- Configure webhook in Stripe Dashboard
- Point webhook to your public URL (use ngrok for local testing)
- OR trigger webhook manually using Stripe CLI trigger

### Step 3: Verify Order Status

Query the database to verify order was updated:

```bash
npx prisma studio
# OR
npx prisma db execute --stdin <<EOF
SELECT 
  "orderNumber",
  "status",
  "paymentStatus",
  "smsOptIn",
  "phone"
FROM "Order"
WHERE "orderNumber" = 'YOUR_ORDER_NUMBER';
EOF
```

**Expected**:
- `status`: `'confirmed'`
- `paymentStatus`: `'paid'`
- `smsOptIn`: `true`
- `phone`: Your test phone number

### Step 4: Verify SmsNotification Record

Query the SmsNotification table:

```sql
SELECT 
  n.*,
  o."orderNumber"
FROM "SmsNotification" n
JOIN "Order" o ON n."orderId" = o."id"
WHERE o."orderNumber" = 'YOUR_ORDER_NUMBER';
```

**Expected**:
- `type`: `'order_confirmed'`
- `phone`: Your test phone number
- `status`: `'sent'` or `'delivered'`
- `providerId`: Twilio message SID (e.g., `SM...`)
- `message`: Should contain order number and tracking link
- `sentAt`: Timestamp (not null)
- `errorMsg`: null (no error)

### Step 5: Verify SMS Message Content

From the query above, check the `message` field:

**Expected content**:
```
Your order #MM-YYMMDD-XXXXXXXX has been confirmed! Track your order at http://localhost:3000/orders/MM-YYMMDD-XXXXXXXX
```

The message should:
- ✅ Include the order number
- ✅ Include a tracking link to the order status page
- ✅ Be clear and concise

### Step 6: Verify SMS Received

#### If using Twilio test credentials (+15005550006):
- ❌ No actual SMS will be sent
- ✅ Check Twilio Console for delivery status
- ✅ Message should show as "sent" or "delivered"

**Twilio Console**: https://console.twilio.com/us1/monitor/logs/sms

#### If using real Twilio credentials and phone number:
- ✅ Check the phone for SMS message
- ✅ Verify message content matches expected format
- ✅ Click tracking link to verify it works

## Test Scenarios

### Scenario 1: Successful SMS Delivery
- ✅ SMS opt-in: **true**
- ✅ Phone number: Valid
- ✅ Twilio credentials: Configured
- **Result**: SMS sent, SmsNotification status = 'sent'

### Scenario 2: SMS Opt-in Disabled
- ❌ SMS opt-in: **false**
- ✅ Phone number: Valid
- **Result**: No SMS sent, no SmsNotification record

### Scenario 3: Missing Phone Number
- ✅ SMS opt-in: **true**
- ❌ Phone number: Empty
- **Result**: No SMS sent, no SmsNotification record

### Scenario 4: Twilio Failure (Fallback to Email)
- ✅ SMS opt-in: **true**
- ✅ Phone number: Valid
- ❌ Twilio credentials: Invalid/missing
- **Result**: SMS fails, email sent as fallback, SmsNotification status = 'failed'

### Scenario 5: Invalid Phone Number
- ✅ SMS opt-in: **true**
- ❌ Phone number: Invalid format (e.g., "123")
- **Result**: SMS send fails, SmsNotification status = 'failed', error logged

## Troubleshooting

### SMS Not Sent

**Check 1**: Verify environment variables
```bash
# Check that all required vars are set
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_PHONE_NUMBER
```

**Check 2**: Verify order has smsOptIn=true
```sql
SELECT "smsOptIn", "phone" FROM "Order" WHERE "orderNumber" = 'YOUR_ORDER_NUMBER';
```

**Check 3**: Check application logs for errors
```bash
# Look for SMS sending errors in terminal where dev server is running
```

**Check 4**: Check SmsNotification record for error
```sql
SELECT "status", "errorMsg" FROM "SmsNotification" 
JOIN "Order" o ON "orderId" = o."id"
WHERE o."orderNumber" = 'YOUR_ORDER_NUMBER';
```

### Webhook Not Triggered

**Check 1**: Verify Stripe webhook is configured
```bash
stripe listen --forward-to http://localhost:3000/api/orders/webhook
```

**Check 2**: Verify webhook secret is correct
```bash
echo $STRIPE_WEBHOOK_SECRET
```

**Check 3**: Check webhook endpoint logs
```bash
# Check terminal for webhook POST requests to /api/orders/webhook
```

### Order Status Not Updated

**Check 1**: Verify payment completed in Stripe Dashboard
- Go to: https://dashboard.stripe.com/test/payments
- Find the payment for your order
- Verify status is "Succeeded"

**Check 2**: Verify webhook received checkout.session.completed event
```bash
# Check terminal logs for webhook events
```

**Check 3**: Verify order number in webhook metadata
- Webhook should include `metadata.orderNumber` in checkout session
- This matches the order to update

## Expected Test Results

### Automated Checks (Script)
- ✅ Environment variables configured
- ✅ Order created via API
- ✅ Order has smsOptIn=true
- ✅ Checkout URL generated

### Manual Verification (Post-Payment)
- ✅ Order status = 'confirmed'
- ✅ Payment status = 'paid'
- ✅ SmsNotification record exists
- ✅ SmsNotification status = 'sent' or 'delivered'
- ✅ SMS message contains order number
- ✅ SMS message contains tracking link
- ✅ SMS received at phone number (if using real number)

## TCPA Compliance Verification

The test also verifies TCPA compliance requirements:

### Opt-in Consent
- ✅ Checkbox is optional (unchecked by default)
- ✅ Clear disclosure text visible
- ✅ Disclosure includes "Message and data rates may apply"
- ✅ Disclosure includes "Reply STOP to opt out"

### Opt-out Mechanism
- ✅ STOP command handling implemented (see `/api/sms/webhook`)
- ✅ Reply STOP to test number to verify opt-out
- ✅ Verify `UserProfile.smsOptIn` set to false after STOP

## Test Data Cleanup

After testing, clean up test orders:

```sql
-- Find test orders
SELECT "id", "orderNumber", "email" FROM "Order" 
WHERE "email" LIKE 'test%@example.com'
ORDER BY "createdAt" DESC;

-- Delete test orders and related records (cascade will handle SMS notifications)
DELETE FROM "Order" 
WHERE "email" LIKE 'test%@example.com';
```

## Success Criteria

The E2E test is considered successful if:

1. ✅ Order created with SMS opt-in via checkout API
2. ✅ Stripe payment completed successfully
3. ✅ Order status updated to 'confirmed'
4. ✅ Payment status updated to 'paid'
5. ✅ SmsNotification record created
6. ✅ SmsNotification status is 'sent' or 'delivered'
7. ✅ SMS message contains order number
8. ✅ SMS message contains tracking link to order status page
9. ✅ SMS received at phone number (if using real Twilio credentials)
10. ✅ No errors in application logs
11. ✅ TCPA compliance requirements met (opt-in consent, STOP handling)

## Additional Resources

- **Twilio Test Credentials**: https://www.twilio.com/docs/iam/test-credentials
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Stripe Webhooks**: https://stripe.com/docs/webhooks/test
- **TCPA Compliance**: https://www.twilio.com/learn/call-and-text/tcpa-compliance

## Notes

- Use Twilio test credentials during development to avoid SMS charges
- Test phone number `+15005550006` is a Twilio magic number that simulates successful delivery
- For production testing, use real Twilio credentials and a real phone number
- Webhook testing requires Stripe CLI or publicly accessible webhook endpoint
- Database queries require running from main project directory (not worktree)
