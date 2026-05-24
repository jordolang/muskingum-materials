# E2E Test: Volume Discount Flow

## Test Information
- **Test ID**: E2E-001
- **Feature**: Volume-based pricing tiers
- **Subtask**: subtask-7-1
- **Date Created**: 2026-04-23

## Test Objectives
Verify that volume discounts are correctly applied at different quantity thresholds and properly saved to the database.

## Test Data
Using "#9 Gravel (Washed)" for testing:
- Base price: $8.00/ton
- Tier 1 (10+ tons): $7.50/ton (saves $0.50/ton = 6.25% discount)
- Tier 2 (50+ tons): $7.00/ton (saves $1.00/ton = 12.5% discount)
- Tier 3 (100+ tons): $6.50/ton (saves $1.50/ton = 18.75% discount)

## Test Scenarios

### Scenario 1: Standard Price (Quantity < 10 tons)
**Steps:**
1. Navigate to `/order`
2. Add "#9 Gravel (Washed)" to cart
3. Set quantity to 5 tons
4. Verify pricing calculation

**Expected Results:**
- Product shows "Starting at $7.50" with pricing tier tooltip
- Subtotal: 5 × $8.00 = $40.00
- Volume discount: $0.00 (no discount applied)
- Tax (7.25%): $2.90
- Processing fee (4.5%): $1.80
- Total: $44.70

---

### Scenario 2: Tier 1 Discount (10+ tons)
**Steps:**
1. In the same cart, increase quantity to 10 tons
2. Verify discount is automatically applied

**Expected Results:**
- Subtotal: 10 × $8.00 = $80.00
- Volume discount: -$5.00 (10 × $0.50 savings)
- Discounted subtotal: $75.00
- Tax (7.25%): $5.44
- Processing fee (4.5%): $3.38
- Total: $83.82

**Visual Indicators:**
- Volume discount line appears in green with "-$5.00"
- Discount applies before tax and fees

---

### Scenario 3: Tier 2 Discount (50+ tons)
**Steps:**
1. Increase quantity to 50 tons
2. Verify higher tier discount is applied

**Expected Results:**
- Subtotal: 50 × $8.00 = $400.00
- Volume discount: -$50.00 (50 × $1.00 savings)
- Discounted subtotal: $350.00
- Tax (7.25%): $25.38
- Processing fee (4.5%): $15.75
- Total: $391.13

**Visual Indicators:**
- Volume discount increases to "-$50.00"
- Cart shows substantial savings

---

### Scenario 4: Tier 3 Discount (100+ tons)
**Steps:**
1. Increase quantity to 100 tons
2. Verify maximum tier discount is applied

**Expected Results:**
- Subtotal: 100 × $8.00 = $800.00
- Volume discount: -$150.00 (100 × $1.50 savings)
- Discounted subtotal: $650.00
- Tax (7.25%): $47.13
- Processing fee (4.5%): $29.25
- Total: $726.38

---

### Scenario 5: Multiple Products with Different Tiers
**Steps:**
1. Clear cart
2. Add "#9 Gravel (Washed)" - 15 tons
3. Add "304 Crushed Gravel" - 25 tons
4. Verify each product gets its appropriate tier discount

**Expected Results:**

"#9 Gravel (Washed)" (15 tons):
- Base: 15 × $8.00 = $120.00
- Tier: 10+ @ $7.50/ton
- Discount: 15 × $0.50 = -$7.50

"304 Crushed Gravel" (25 tons):
- Base: 25 × $20.00 = $500.00
- Tier: 10+ @ $18.50/ton
- Discount: 25 × $1.50 = -$37.50

Total discount: $45.00
Subtotal: $620.00
Discounted: $575.00
Tax: $41.69
Fee: $25.88
Total: $642.57

---

### Scenario 6: Checkout and Order Creation
**Steps:**
1. Complete cart with 50 tons "#9 Gravel (Washed)"
2. Fill out contact information
3. Fill out delivery information
4. Click "Place Order"
5. Wait for order confirmation

**Expected Results:**
- Order is created successfully
- Order confirmation shows:
  - Subtotal: $400.00
  - Volume discount: -$50.00
  - Discounted total before fees: $350.00
  - Tax: $25.38
  - Processing fee: $15.75
  - Final total: $391.13
- Order number is generated
- User receives confirmation email (if email service is configured)

---

### Scenario 7: Database Verification
**Steps:**
1. After placing order, check database
2. Use Prisma Studio or database query to verify order record

**Expected Results:**
Database order record should contain:
```json
{
  "items": [
    {
      "productName": "#9 Gravel (Washed)",
      "quantity": 50,
      "pricePerUnit": 7.00,  // Tier 2 price, not base price
      "unit": "ton"
    }
  ],
  "subtotal": 400.00,
  "tax": 25.38,
  "processingFee": 15.75,
  "total": 391.13,
  "volumeDiscount": 50.00  // If field exists in schema
}
```

**Verification Commands:**
```bash
# Open Prisma Studio
npx prisma studio

# Or query directly
npx prisma db execute --stdin <<EOF
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 1;
EOF
```

---

## Test Execution Checklist

- [ ] Scenario 1: Standard price (< 10 tons) ✓
- [ ] Scenario 2: Tier 1 discount (10+ tons) ✓
- [ ] Scenario 3: Tier 2 discount (50+ tons) ✓
- [ ] Scenario 4: Tier 3 discount (100+ tons) ✓
- [ ] Scenario 5: Multiple products with different tiers ✓
- [ ] Scenario 6: Checkout and order creation ✓
- [ ] Scenario 7: Database verification ✓

## Browser Compatibility
Test in the following browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)

## Test Environment
- URL: http://localhost:3000
- Node version: As per project requirements
- Database: Neon PostgreSQL (or local dev database)

## Known Limitations
1. Database connectivity may not work in isolated worktree environment
2. Email notifications require Postmark configuration
3. Stripe payment processing is in test mode

## Notes
- Discounts apply to individual product quantities, not cart total
- Volume discount is applied BEFORE tax and processing fees
- Each product's pricing tiers are independent
- Pricing tiers are configured in `data/business.ts`
- Actual pricing logic is in `lib/pricing-calculator.ts`
- Cart calculation is in `components/order/order-form.tsx`
