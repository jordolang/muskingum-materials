# Review Request Email Automation

This document explains how the automated review request email system works.

## Overview

After an order is marked as "completed", the system automatically sends a review request email to the customer after a configurable delay (default: 7 days).

## Components

### 1. Job Handler (`lib/jobs/send-review-requests.ts`)

The core logic that:
- Finds orders that were completed X days/minutes ago
- Filters out orders that already received a review request
- Sends personalized review request emails via Postmark
- Tracks sent requests in the `ReviewSubmission` table

### 2. Cron API Route (`app/api/cron/send-review-requests/route.ts`)

A GET endpoint that triggers the job handler. Can be called by:
- Vercel Cron (configured in vercel.json)
- External cron services
- Manual testing

### 3. Order Completion API (`app/api/orders/[orderNumber]/complete/route.ts`)

A helper endpoint to manually mark orders as completed for testing.

### 4. Webhook Handler (`app/api/orders/webhook/route.ts`)

Updated to set `completedAt` timestamp when order status changes to "completed".

## Environment Variables

```env
# Required for sending emails
POSTMARK_API_TOKEN=your_postmark_token
POSTMARK_FROM_EMAIL=noreply@muskingummaterials.com

# Optional: Override default delay (7 days = 10080 minutes)
REVIEW_REQUEST_DELAY_MINUTES=10080

# For testing: set to 1 minute
REVIEW_REQUEST_DELAY_MINUTES=1

# Optional: Protect cron endpoint
CRON_SECRET=your_secret_here

# Required for review links
NEXT_PUBLIC_BASE_URL=https://muskingummaterials.com
```

## Vercel Cron Configuration

The `vercel.json` file configures the cron job to run every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-review-requests",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Testing

### Manual Testing (Recommended)

1. **Set environment variable for testing:**
   ```env
   REVIEW_REQUEST_DELAY_MINUTES=1
   ```

2. **Create or update an order to completed status:**
   ```bash
   # Using the API endpoint
   curl -X POST http://localhost:3000/api/orders/ORDER-12345/complete
   ```

   Or directly in the database:
   ```sql
   UPDATE "Order" 
   SET status = 'completed', "completedAt" = NOW() - INTERVAL '2 minutes'
   WHERE "orderNumber" = 'ORDER-12345';
   ```

3. **Wait 1 minute, then trigger the cron job:**
   ```bash
   curl http://localhost:3000/api/cron/send-review-requests
   ```

4. **Verify:**
   - Check the response shows `emailsSent: 1`
   - Check that a `ReviewSubmission` record was created
   - Check Postmark dashboard for sent email (if POSTMARK_API_TOKEN is set)

5. **Test duplicate prevention:**
   ```bash
   # Run the cron again
   curl http://localhost:3000/api/cron/send-review-requests
   # Should show emailsSent: 0
   ```

### Automated Test Script

Run the test script (requires database access):

```bash
npx tsx scripts/test-review-requests.ts
```

## Production Deployment

1. Ensure environment variables are set in Vercel:
   - `POSTMARK_API_TOKEN`
   - `POSTMARK_FROM_EMAIL`
   - `CRON_SECRET` (optional but recommended)
   - `NEXT_PUBLIC_BASE_URL`

2. Remove or update `REVIEW_REQUEST_DELAY_MINUTES` to use default (7 days)

3. Deploy to Vercel - the cron job will automatically start running

## Email Content

The review request email includes:
- Personalized greeting with customer name
- Order number
- Direct link to submit review (pre-filled with order details)
- Professional HTML and plain text versions

## Database Schema

The system uses:
- `Order.completedAt` - Timestamp when order was completed
- `ReviewSubmission.orderNumber` - Tracks which orders have received review requests
- `ReviewSubmission.submittedAt` - When the review request was sent

## Troubleshooting

### No emails being sent

- Check `POSTMARK_API_TOKEN` is set
- Check Postmark dashboard for errors
- Verify orders have `completedAt` set
- Check `REVIEW_REQUEST_DELAY_MINUTES` is appropriate

### Duplicate emails

- Should not happen - the system checks `ReviewSubmission` table
- If it does, check database for duplicate entries
- Review logs for errors in the tracking logic

### Emails not sent for old orders

- The system only sends to orders completed after the configured delay
- Manually create `ReviewSubmission` records for orders that should not receive emails
