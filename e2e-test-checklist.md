# End-to-End Campaign Testing Checklist

## Prerequisites

1. **Database Setup**
   - ✅ Campaign and EmailTemplate tables exist in Neon
   - ✅ Email templates seeded (6 templates available)
   - Need: At least one test newsletter subscriber

2. **Environment Variables**
   - ✅ DATABASE_URL and DIRECT_URL configured
   - ✅ CLERK_SECRET_KEY configured
   - ⚠️  POSTMARK_API_TOKEN needs real token for live email testing (currently placeholder)

## Test Workflow

### Step 1: Start Dev Server (Main Repo)
```bash
cd /Users/jordanlang/Repos/muskingum-materials
npm run dev
```
Expected: Server starts on http://localhost:3000

### Step 2: Create Test Subscriber (if none exist)
```bash
# Option A: Via API
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Option B: Via Prisma Studio
npm run db:studio
# Navigate to NewsletterSubscriber model
# Create new record: email="test@example.com", name="Test User", active=true
```

### Step 3: Set Up Admin User
1. Sign in to http://localhost:3000/sign-in
2. In Clerk Dashboard (https://dashboard.clerk.com):
   - Navigate to your user
   - Add public metadata: `{ "role": "admin" }`
   - Save changes

### Step 4: Navigate to Admin Dashboard
- URL: http://localhost:3000/account/admin
- ✅ Check: Page renders without errors
- ✅ Check: Stats cards show campaign/subscriber counts
- ✅ Check: Quick action buttons visible

### Step 5: Navigate to Campaigns List
- URL: http://localhost:3000/account/admin/campaigns
- ✅ Check: Campaign list page loads
- ✅ Check: "Create New Campaign" button visible
- ✅ Check: Empty state shows if no campaigns exist

### Step 6: Create New Campaign
- Click "Create New Campaign" button
- URL: http://localhost:3000/account/admin/campaigns/new
- ✅ Check: Form renders with all fields:
  - Subject (text input)
  - Body (textarea)
  - Template selector (dropdown)
  - Schedule for (datetime-local input)
- Fill out form:
  - Subject: "Test Campaign - Spring Sale"
  - Body: "Check out our spring landscaping materials!"
  - Template: Select "Seasonal Promotion"
  - Leave scheduledFor empty (immediate send)
- Click "Create Campaign"
- ✅ Check: Success message appears
- ✅ Check: Redirects to campaigns list

### Step 7: Verify Campaign Appears
- URL: http://localhost:3000/account/admin/campaigns
- ✅ Check: New campaign appears in list
- ✅ Check: Status badge shows "draft"
- ✅ Check: Campaign name and subject visible
- Click on the campaign card

### Step 8: View Campaign Details
- URL: http://localhost:3000/account/admin/campaigns/[id]
- ✅ Check: Campaign details page loads
- ✅ Check: Shows campaign subject, body, template info
- ✅ Check: Status badge shows "draft"
- ✅ Check: "Send Campaign" button visible
- ✅ Check: Email preview shows (if EmailPreview component integrated)

### Step 9: Send Campaign
- Click "Send Campaign" button
- ✅ Check: Button shows loading state
- ✅ Check: Success message appears
- ✅ Check: Status updates to "sent"
- ✅ Check: Recipient count shows (should be 1+ based on active subscribers)
- ✅ Check: Sent timestamp displays

### Step 10: Verify Campaign Metrics
- Refresh campaign detail page
- ✅ Check: Delivery metrics card appears
- ✅ Check: Success count shows (should match recipient count if Postmark configured)
- ✅ Check: Failure count shows (may be >0 if Postmark not configured)

### Step 11: Check Postmark Activity (if configured)
- Login to Postmark: https://account.postmarkapp.com
- Navigate to Activity
- ✅ Check: Email sent to test@example.com appears
- ✅ Check: Subject matches campaign subject
- ✅ Check: Email body contains campaign content
- ✅ Check: Unsubscribe link present in email

### Step 12: Test Unsubscribe Flow
- Open the email in your inbox (if Postmark configured)
- Click unsubscribe link in email footer
- Expected URL format: http://localhost:3000/newsletter/unsubscribe?email=test@example.com
- ✅ Check: Unsubscribe confirmation page shows
- ✅ Check: Success message displayed

### Step 13: Verify Subscriber Status Updated
```bash
# Option A: Via API
curl http://localhost:3000/api/admin/subscribers?active=false \
  -H "Authorization: Bearer <clerk_session_token>"

# Option B: Via Prisma Studio
npm run db:studio
# Navigate to NewsletterSubscriber model
# Find test@example.com
# Check: active field is now false
```

### Step 14: Check Subscriber List UI
- URL: http://localhost:3000/account/admin/subscribers
- Click "Unsubscribed" tab
- ✅ Check: Test subscriber appears in unsubscribed list
- ✅ Check: Status badge shows "Unsubscribed"

## Expected Outcomes

### ✅ Success Criteria
1. Campaign created and saved as draft
2. Campaign appears in list with correct status
3. Campaign can be sent to active subscribers
4. Campaign status updates from "draft" to "sent"
5. Recipient count recorded accurately
6. If Postmark configured: Email delivered with correct content
7. Unsubscribe link works and updates subscriber status
8. Subscriber marked as inactive in database
9. No console errors in browser
10. No server errors in terminal

### ⚠️  Known Limitations (Postmark Not Configured)
- Emails won't actually send (graceful degradation)
- Delivery metrics will show failures
- Can verify workflow but not email delivery
- All other functionality should work correctly

## Troubleshooting

### Campaign won't send
- Check: At least one active subscriber exists
- Check: Campaign status is "draft" or "scheduled" (not already sent)
- Check: No errors in server logs

### Emails not received
- Check: POSTMARK_API_TOKEN is valid (not placeholder)
- Check: POSTMARK_FROM_EMAIL is verified in Postmark
- Check: Test email address is valid
- Check: Postmark activity log for delivery status

### Unsubscribe link doesn't work
- Check: URL format includes email parameter
- Check: /api/newsletter/unsubscribe endpoint exists
- Check: POST request succeeds (200 status)

### Admin pages not accessible
- Check: User has `role: "admin"` in Clerk publicMetadata
- Check: Clerk authentication is working
- Check: No redirect to /account page (indicates non-admin)

## Database Verification Commands

```bash
# Check campaigns
npx prisma studio
# Navigate to Campaign model
# Verify: Campaign created with correct data
# Verify: Status updated to 'sent' after sending
# Verify: recipientCount > 0
# Verify: metrics JSON contains success/failure counts

# Check email templates
# Navigate to EmailTemplate model
# Verify: 6 templates exist
# Verify: Templates have htmlContent and textContent

# Check subscribers
# Navigate to NewsletterSubscriber model
# Verify: Test subscriber exists
# Verify: active=false after unsubscribe
```

## Cleanup

```bash
# Delete test campaign
curl -X DELETE http://localhost:3000/api/admin/campaigns/[campaign-id] \
  -H "Authorization: Bearer <clerk_session_token>"

# Re-activate test subscriber (if needed)
npm run db:studio
# Set active=true on test subscriber
```
