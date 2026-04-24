# E2E Test: Contractor Pricing Flow

## Test Information
- **Test ID**: E2E-002
- **Feature**: Contractor account pricing and discounts
- **Subtask**: subtask-7-2
- **Date Created**: 2026-04-23

## Test Objectives
Verify that contractor pricing is correctly applied for authenticated contractor accounts, displays in the contractor dashboard, and saves properly to order records.

## Test Data

### Test Users
- **Non-Contractor User**: standard@example.com
  - isContractor: false
  - contractorDiscount: null
  
- **Contractor User**: contractor@example.com
  - isContractor: true
  - contractorDiscount: 10% (10.0)

### Test Product
Using "#9 Gravel (Washed)" for testing:
- Base price: $8.00/ton
- Volume tiers:
  - Tier 1 (10+ tons): $7.50/ton (6.25% volume discount)
  - Tier 2 (50+ tons): $7.00/ton (12.5% volume discount)
  - Tier 3 (100+ tons): $6.50/ton (18.75% volume discount)

## Test Scenarios

### Scenario 1: Non-Contractor User - Standard Pricing
**Steps:**
1. Log in as standard@example.com (non-contractor)
2. Navigate to `/order`
3. Add "#9 Gravel (Washed)" to cart with 5 tons
4. Verify pricing calculation

**Expected Results:**
- No contractor discount applied
- Subtotal: 5 × $8.00 = $40.00
- Volume discount: $0.00 (below tier threshold)
- Contractor discount: $0.00 (not a contractor)
- Tax (7.25%): $2.90
- Processing fee (4.5%): $1.80
- Total: $44.70

**Validation Points:**
- ✓ No contractor dashboard visible on `/account`
- ✓ No contractor discount line in cart summary
- ✓ Standard pricing applied
- ✓ Account page shows standard dashboard

---

### Scenario 2: Contractor User - Base Price with Contractor Discount
**Steps:**
1. Log in as contractor@example.com (10% contractor discount)
2. Navigate to `/order`
3. Add "#9 Gravel (Washed)" to cart with 5 tons
4. Verify contractor discount is applied

**Expected Results:**
- Base price: $8.00/ton
- Contractor discount: 10% off base price = $0.80/ton
- Final price: $7.20/ton
- Subtotal: 5 × $8.00 = $40.00
- Volume discount: $0.00 (below tier threshold)
- Contractor discount: -$4.00 (5 tons × $0.80)
- Discounted subtotal: $36.00
- Tax (7.25%): $2.61
- Processing fee (4.5%): $1.62
- Total: $40.23

**Visual Indicators:**
- Contractor discount line appears in cart summary
- Discount shows as "-$4.00" in green text
- Contractor badge visible in account section

**Validation Points:**
- ✓ Contractor dashboard visible on `/account`
- ✓ Dashboard shows "10%" contractor discount
- ✓ Contractor discount applied before tax/fees
- ✓ Product catalog shows contractor pricing (optional)

---

### Scenario 3: Contractor + Volume Discount (Tier 1)
**Steps:**
1. Logged in as contractor@example.com
2. Increase quantity to 10 tons
3. Verify both volume discount AND contractor discount apply

**Expected Results:**
- Base price: $8.00/ton
- Volume tier applied: Tier 1 @ $7.50/ton (saves $0.50/ton)
- Contractor discount: 10% off tier price ($7.50) = $0.75/ton
- Final price: $6.75/ton ($7.50 - $0.75)
- Subtotal: 10 × $8.00 = $80.00
- Volume discount: -$5.00 (10 tons × $0.50)
- After volume discount: $75.00
- Contractor discount: -$7.50 (10 tons × $0.75)
- Discounted subtotal: $67.50
- Tax (7.25%): $4.89
- Processing fee (4.5%): $3.04
- Total: $75.43

**Discount Stacking Logic:**
1. Volume discount applies first (base → tier price)
2. Contractor discount applies to tier price
3. Total savings = volume savings + contractor savings

**Visual Indicators:**
- Both discount lines visible in cart summary
- Volume discount: "-$5.00" (green)
- Contractor discount: "-$7.50" (green)
- Total savings clearly displayed

**Validation Points:**
- ✓ Both discounts applied correctly
- ✓ Contractor discount applies to tier price, not base price
- ✓ Discounts apply before tax and fees
- ✓ Savings calculation is accurate

---

### Scenario 4: Contractor + Volume Discount (Tier 2)
**Steps:**
1. Logged in as contractor@example.com
2. Increase quantity to 50 tons
3. Verify higher tier with contractor discount

**Expected Results:**
- Base price: $8.00/ton
- Volume tier applied: Tier 2 @ $7.00/ton (saves $1.00/ton)
- Contractor discount: 10% off tier price ($7.00) = $0.70/ton
- Final price: $6.30/ton
- Subtotal: 50 × $8.00 = $400.00
- Volume discount: -$50.00 (50 tons × $1.00)
- After volume discount: $350.00
- Contractor discount: -$35.00 (50 tons × $0.70)
- Discounted subtotal: $315.00
- Tax (7.25%): $22.84
- Processing fee (4.5%): $14.18
- Total: $352.02

**Validation Points:**
- ✓ Tier 2 discount applied correctly
- ✓ Contractor discount stacks on tier price
- ✓ Substantial savings shown (21.25% total)
- ✓ All calculations accurate

---

### Scenario 5: Contractor Dashboard Verification
**Steps:**
1. Logged in as contractor@example.com
2. Navigate to `/account`
3. Verify contractor dashboard displays

**Expected Results:**
- Page shows "Contractor Dashboard" header
- Contractor benefits card displays:
  - "10% Contractor Discount" with Award icon
  - "Recurring Delivery Options" feature
- Stats cards show:
  - Total Orders: [count]
  - Total Spent: $[amount]
  - Est. Savings: $[calculated from orders]
  - Active Recurring: [count]
- Recent orders section shows:
  - Order numbers with status badges
  - "10% applied" label on contractor orders
  - Order totals reflecting contractor pricing
- Quick actions available:
  - New Order (with contractor pricing note)
  - Recurring Orders
  - Order History

**Validation Points:**
- ✓ Dashboard only visible to contractor users
- ✓ Discount percentage matches profile (10%)
- ✓ Savings calculated correctly from order history
- ✓ Recent orders show contractor pricing
- ✓ Navigation links functional

---

### Scenario 6: Place Order with Contractor Pricing
**Steps:**
1. Logged in as contractor@example.com
2. Add "#9 Gravel (Washed)" - 25 tons to cart
3. Fill in delivery details:
   - Name: "John Contractor"
   - Email: "contractor@example.com"
   - Phone: "(555) 123-4567"
   - Company: "Contractor Co"
   - Address: "123 Build St, Construction City, OH 43001"
   - Delivery date: [future date]
   - Notes: "Contractor order test"
4. Proceed through checkout
5. Verify order summary before confirmation

**Expected Order Summary:**
- Product: #9 Gravel (Washed) - 25 tons
- Base subtotal: 25 × $8.00 = $200.00
- Volume discount: -$12.50 (Tier 1: 25 × $0.50)
- Contractor discount: -$18.75 (10% off $7.50 = $0.75/ton × 25)
- Discounted subtotal: $168.75
- Tax (7.25%): $12.23
- Processing fee (4.5%): $7.59
- **Total: $188.57**

**After Order Placement:**
- Order confirmation page displays
- Order number assigned (e.g., MM-20260423-001)
- Email confirmation sent
- Order appears in order history

**Validation Points:**
- ✓ Checkout form shows contractor discount
- ✓ Order total matches calculation
- ✓ Contractor discount tracked in order record
- ✓ Confirmation shows correct pricing
- ✓ Email includes contractor savings

---

### Scenario 7: Order History - Verify Savings Tracked
**Steps:**
1. Logged in as contractor@example.com
2. Navigate to `/account/orders`
3. Find the order placed in Scenario 6
4. Click to view order details

**Expected Results:**
- Order detail page displays:
  - Order number: MM-20260423-001
  - Status: pending (or confirmed)
  - Items: #9 Gravel (Washed) - 25 tons
  - Pricing breakdown:
    - Subtotal: $200.00
    - Volume discount: -$12.50
    - Contractor discount: -$18.75
    - Tax: $12.23
    - Processing fee: $7.59
    - Total: $188.57
  - Total savings: $31.25 (volume + contractor)
  - Savings percentage: ~15.6%
  - Delivery address and date
  - Order notes

**Contractor Dashboard Stats Update:**
- Navigate back to `/account`
- Verify dashboard stats reflect new order:
  - Total Spent increases by $188.57
  - Est. Savings increases by $31.25
  - Total Orders count incremented
- Recent orders list shows new order at top

**Validation Points:**
- ✓ Order record includes both discount types
- ✓ Savings calculated and displayed correctly
- ✓ Order history accessible and accurate
- ✓ Dashboard stats update with new order
- ✓ All pricing details preserved in database

---

### Scenario 8: Database Verification
**Manual Steps (requires database access):**

```sql
-- Verify user profile has contractor fields
SELECT id, userId, isContractor, contractorDiscount, company
FROM UserProfile
WHERE userId = '[contractor-clerk-id]';

-- Expected: isContractor = true, contractorDiscount = 10.0

-- Verify order has contractor discount tracked
SELECT 
  orderNumber,
  total,
  subtotal,
  tax,
  processingFee,
  status,
  createdAt
FROM "Order"
WHERE userId = '[contractor-clerk-id]'
ORDER BY createdAt DESC
LIMIT 5;

-- Verify order items and pricing
SELECT 
  o.orderNumber,
  oi.productName,
  oi.quantity,
  oi.price,
  o.total
FROM "Order" o
JOIN OrderItem oi ON oi.orderId = o.id
WHERE o.userId = '[contractor-clerk-id]'
ORDER BY o.createdAt DESC;
```

**Expected Database State:**
- ✓ UserProfile.isContractor = true
- ✓ UserProfile.contractorDiscount = 10.0
- ✓ Order records exist for contractor user
- ✓ Order totals reflect contractor pricing
- ✓ OrderItems show discounted prices
- ✓ All contractor orders have proper status

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Development server running (`npm run dev`)
- [ ] Database accessible and seeded
- [ ] Test user accounts created (standard + contractor)
- [ ] Product catalog has tiered pricing configured
- [ ] Contractor profile set in database

### Test Execution
- [ ] Scenario 1: Non-contractor standard pricing
- [ ] Scenario 2: Contractor base discount (5 tons)
- [ ] Scenario 3: Contractor + Tier 1 (10 tons)
- [ ] Scenario 4: Contractor + Tier 2 (50 tons)
- [ ] Scenario 5: Contractor dashboard display
- [ ] Scenario 6: Place order with contractor pricing
- [ ] Scenario 7: Order history shows savings
- [ ] Scenario 8: Database verification

### Post-Test Validation
- [ ] All discount calculations accurate
- [ ] No console errors during testing
- [ ] UI displays contractor information correctly
- [ ] Database records match expected values
- [ ] Order confirmation emails correct
- [ ] No price manipulation vulnerabilities

---

## Test Coverage Summary

**Code Coverage:**
- ✓ `lib/pricing-calculator.ts` - contractor discount calculation
- ✓ `lib/validate-checkout-prices.ts` - contractor price validation
- ✓ `app/api/orders/checkout/route.ts` - contractor profile lookup
- ✓ `app/api/account/profile/route.ts` - contractor flag API
- ✓ `components/account/contractor-dashboard.tsx` - dashboard display
- ✓ `components/order/order-form.tsx` - contractor discount in cart
- ✓ `components/order/cart-summary.tsx` - discount display
- ✓ `app/account/page.tsx` - conditional contractor dashboard

**Feature Coverage:**
- ✓ Contractor identification and authentication
- ✓ Contractor discount calculation
- ✓ Volume + contractor discount stacking
- ✓ Dashboard statistics and display
- ✓ Order placement with contractor pricing
- ✓ Order history with savings tracking
- ✓ Database schema and persistence
- ✓ Server-side price validation

---

## Notes

### Discount Stacking Order
1. **Volume discount** applies first (base price → tier price)
2. **Contractor discount** applies to the tier price (or base if no tier)
3. **Tax** applies to the discounted subtotal
4. **Processing fee** applies to the discounted subtotal

Example with both discounts:
- Base: $8.00/ton × 50 tons = $400.00
- Volume discount (Tier 2): -$50.00 → $350.00
- Contractor discount (10% of $7.00): -$35.00 → $315.00
- Tax (7.25%): +$22.84
- Fee (4.5%): +$14.18
- **Total: $352.02**

### Security Considerations
- ✓ Contractor status cannot be set via frontend
- ✓ Server-side validation of contractor discount
- ✓ Profile updates require authentication
- ✓ Order pricing validated against product catalog
- ✓ Contractor discount verified during checkout

### Known Limitations
- Contractor status must be set via database/admin (not self-service)
- Contractor discount is percentage-based (not fixed amount)
- Discount percentage range: 0-100%
- Requires authentication (no guest contractor orders)
