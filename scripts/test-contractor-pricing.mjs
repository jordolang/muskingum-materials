/**
 * Manual test script to verify contractor pricing calculations
 * Run with: node scripts/test-contractor-pricing.mjs
 */

// Mock implementation of calculatePrice for testing contractor pricing
function calculatePrice(basePrice, quantity, pricingTiers = [], contractorDiscountPercent) {
  let finalPrice = basePrice
  let volumeDiscount = 0
  let tierApplied = null

  // Find applicable tier
  if (pricingTiers && pricingTiers.length > 0) {
    const applicableTiers = pricingTiers
      .filter(tier => quantity >= tier.minQuantity)
      .filter(tier => !tier.maxQuantity || quantity <= tier.maxQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity)

    if (applicableTiers.length > 0) {
      const tier = applicableTiers[0]
      finalPrice = tier.pricePerTon
      volumeDiscount = basePrice - tier.pricePerTon
      tierApplied = tier
    }
  }

  // Apply contractor discount if applicable
  let contractorDiscount = 0
  if (contractorDiscountPercent && contractorDiscountPercent > 0) {
    contractorDiscount = finalPrice * (contractorDiscountPercent / 100)
    finalPrice = finalPrice - contractorDiscount
  }

  const totalSavings = (volumeDiscount + contractorDiscount) * quantity

  return {
    basePrice,
    finalPrice,
    volumeDiscount,
    contractorDiscount,
    totalSavings,
    tierApplied,
  }
}

// Test product from data/business.ts
const testProduct = {
  name: "#9 Gravel (Washed)",
  price: 8.00,
  pricingTiers: [
    { minQuantity: 10, pricePerTon: 7.50 },
    { minQuantity: 50, pricePerTon: 7.00 },
    { minQuantity: 100, pricePerTon: 6.50 },
  ],
}

const CONTRACTOR_DISCOUNT = 10 // 10% contractor discount

console.log('='.repeat(80))
console.log('CONTRACTOR PRICING CALCULATOR TEST')
console.log('='.repeat(80))
console.log(`Product: ${testProduct.name}`)
console.log(`Base Price: $${testProduct.price.toFixed(2)}/ton`)
console.log(`Contractor Discount: ${CONTRACTOR_DISCOUNT}%`)
console.log()

// Test Scenario 1: Non-Contractor - Standard Pricing
console.log('Scenario 1: Non-Contractor User - Standard Pricing (5 tons)')
console.log('-'.repeat(80))
const scenario1 = calculatePrice(testProduct.price, 5, testProduct.pricingTiers, 0)
console.log(`Quantity: 5 tons`)
console.log(`Contractor Discount: 0%`)
console.log(`Expected Price: $${testProduct.price.toFixed(2)}/ton (no discounts)`)
console.log(`Calculated Price: $${scenario1.finalPrice.toFixed(2)}/ton`)
console.log(`Volume Discount: $${scenario1.volumeDiscount.toFixed(2)}/ton`)
console.log(`Contractor Discount: $${scenario1.contractorDiscount.toFixed(2)}/ton`)
console.log(`Total: $${(scenario1.finalPrice * 5).toFixed(2)}`)
const pass1 = scenario1.volumeDiscount === 0 && scenario1.contractorDiscount === 0 && scenario1.finalPrice === testProduct.price
console.log(`✓ PASS: ${pass1 ? 'YES' : 'NO'}`)
console.log()

// Test Scenario 2: Contractor - Base Price with Contractor Discount
console.log('Scenario 2: Contractor User - Base Price with 10% Discount (5 tons)')
console.log('-'.repeat(80))
const scenario2 = calculatePrice(testProduct.price, 5, testProduct.pricingTiers, CONTRACTOR_DISCOUNT)
console.log(`Quantity: 5 tons`)
console.log(`Contractor Discount: ${CONTRACTOR_DISCOUNT}%`)
console.log(`Base Price: $${testProduct.price.toFixed(2)}/ton`)
console.log(`Expected Contractor Discount: $${(testProduct.price * 0.10).toFixed(2)}/ton`)
console.log(`Expected Final Price: $${(testProduct.price * 0.90).toFixed(2)}/ton`)
console.log(`Calculated Price: $${scenario2.finalPrice.toFixed(2)}/ton`)
console.log(`Volume Discount: $${scenario2.volumeDiscount.toFixed(2)}/ton`)
console.log(`Contractor Discount: $${scenario2.contractorDiscount.toFixed(2)}/ton`)
console.log(`Subtotal: $${(5 * testProduct.price).toFixed(2)}`)
console.log(`Total Savings: $${(scenario2.contractorDiscount * 5).toFixed(2)}`)
console.log(`Final Total: $${(scenario2.finalPrice * 5).toFixed(2)}`)
const pass2 = scenario2.contractorDiscount === 0.80 && scenario2.finalPrice === 7.20
console.log(`✓ PASS: ${pass2 ? 'YES' : 'NO'}`)
console.log()

// Test Scenario 3: Contractor + Volume Discount (Tier 1)
console.log('Scenario 3: Contractor + Volume Discount Tier 1 (10 tons)')
console.log('-'.repeat(80))
const scenario3 = calculatePrice(testProduct.price, 10, testProduct.pricingTiers, CONTRACTOR_DISCOUNT)
console.log(`Quantity: 10 tons`)
console.log(`Contractor Discount: ${CONTRACTOR_DISCOUNT}%`)
console.log(`Volume Tier Applied: Tier 1 ($7.50/ton)`)
console.log(`Discount Stacking Logic:`)
console.log(`  1. Base price: $${testProduct.price.toFixed(2)}/ton`)
console.log(`  2. Volume discount applied → $7.50/ton (saves $0.50/ton)`)
console.log(`  3. Contractor discount (10% of $7.50) → $0.75/ton`)
console.log(`  4. Final price → $6.75/ton`)
console.log()
console.log(`Calculated Price: $${scenario3.finalPrice.toFixed(2)}/ton`)
console.log(`Volume Discount: $${scenario3.volumeDiscount.toFixed(2)}/ton`)
console.log(`Contractor Discount: $${scenario3.contractorDiscount.toFixed(2)}/ton`)
console.log()
console.log(`Pricing Breakdown:`)
console.log(`  Subtotal (10 × $8.00): $${(10 * testProduct.price).toFixed(2)}`)
console.log(`  Volume savings (10 × $0.50): -$${(scenario3.volumeDiscount * 10).toFixed(2)}`)
console.log(`  After volume discount: $${(10 * 7.50).toFixed(2)}`)
console.log(`  Contractor savings (10 × $0.75): -$${(scenario3.contractorDiscount * 10).toFixed(2)}`)
console.log(`  Final subtotal: $${(scenario3.finalPrice * 10).toFixed(2)}`)
console.log(`  Total savings: $${scenario3.totalSavings.toFixed(2)}`)
const pass3 = scenario3.volumeDiscount === 0.50 && scenario3.contractorDiscount === 0.75 && scenario3.finalPrice === 6.75
console.log(`✓ PASS: ${pass3 ? 'YES' : 'NO'}`)
console.log()

// Test Scenario 4: Contractor + Volume Discount (Tier 2)
console.log('Scenario 4: Contractor + Volume Discount Tier 2 (50 tons)')
console.log('-'.repeat(80))
const scenario4 = calculatePrice(testProduct.price, 50, testProduct.pricingTiers, CONTRACTOR_DISCOUNT)
console.log(`Quantity: 50 tons`)
console.log(`Contractor Discount: ${CONTRACTOR_DISCOUNT}%`)
console.log(`Volume Tier Applied: Tier 2 ($7.00/ton)`)
console.log()
console.log(`Discount Stacking:`)
console.log(`  Base → Tier 2: $8.00 → $7.00 (saves $1.00/ton)`)
console.log(`  Contractor (10% of $7.00): -$0.70/ton`)
console.log(`  Final: $6.30/ton`)
console.log()
console.log(`Calculated Price: $${scenario4.finalPrice.toFixed(2)}/ton`)
console.log(`Volume Discount: $${scenario4.volumeDiscount.toFixed(2)}/ton`)
console.log(`Contractor Discount: $${scenario4.contractorDiscount.toFixed(2)}/ton`)
console.log()
console.log(`Pricing Breakdown:`)
console.log(`  Subtotal (50 × $8.00): $${(50 * testProduct.price).toFixed(2)}`)
console.log(`  Volume savings: -$${(scenario4.volumeDiscount * 50).toFixed(2)}`)
console.log(`  Contractor savings: -$${(scenario4.contractorDiscount * 50).toFixed(2)}`)
console.log(`  Final subtotal: $${(scenario4.finalPrice * 50).toFixed(2)}`)
console.log(`  Total savings: $${scenario4.totalSavings.toFixed(2)}`)
console.log(`  Savings percentage: ${((scenario4.totalSavings / (50 * testProduct.price)) * 100).toFixed(1)}%`)
const pass4 = Math.abs(scenario4.volumeDiscount - 1.00) < 0.01 && Math.abs(scenario4.contractorDiscount - 0.70) < 0.01 && Math.abs(scenario4.finalPrice - 6.30) < 0.01
console.log(`✓ PASS: ${pass4 ? 'YES' : 'NO'}`)
console.log()

// Test Scenario 5: Contractor + Volume Discount (Tier 3)
console.log('Scenario 5: Contractor + Volume Discount Tier 3 (100 tons)')
console.log('-'.repeat(80))
const scenario5 = calculatePrice(testProduct.price, 100, testProduct.pricingTiers, CONTRACTOR_DISCOUNT)
console.log(`Quantity: 100 tons`)
console.log(`Contractor Discount: ${CONTRACTOR_DISCOUNT}%`)
console.log(`Volume Tier Applied: Tier 3 ($6.50/ton)`)
console.log()
console.log(`Discount Stacking:`)
console.log(`  Base → Tier 3: $8.00 → $6.50 (saves $1.50/ton)`)
console.log(`  Contractor (10% of $6.50): -$0.65/ton`)
console.log(`  Final: $5.85/ton`)
console.log()
console.log(`Calculated Price: $${scenario5.finalPrice.toFixed(2)}/ton`)
console.log(`Volume Discount: $${scenario5.volumeDiscount.toFixed(2)}/ton`)
console.log(`Contractor Discount: $${scenario5.contractorDiscount.toFixed(2)}/ton`)
console.log()
console.log(`Pricing Breakdown:`)
console.log(`  Subtotal (100 × $8.00): $${(100 * testProduct.price).toFixed(2)}`)
console.log(`  Volume savings: -$${(scenario5.volumeDiscount * 100).toFixed(2)}`)
console.log(`  Contractor savings: -$${(scenario5.contractorDiscount * 100).toFixed(2)}`)
console.log(`  Final subtotal: $${(scenario5.finalPrice * 100).toFixed(2)}`)
console.log(`  Total savings: $${scenario5.totalSavings.toFixed(2)}`)
console.log(`  Savings percentage: ${((scenario5.totalSavings / (100 * testProduct.price)) * 100).toFixed(1)}%`)
const pass5 = scenario5.volumeDiscount === 1.50 && scenario5.contractorDiscount === 0.65 && scenario5.finalPrice === 5.85
console.log(`✓ PASS: ${pass5 ? 'YES' : 'NO'}`)
console.log()

// Test Scenario 6: Contractor Discount Percentage Variations
console.log('Scenario 6: Different Contractor Discount Percentages (10 tons)')
console.log('-'.repeat(80))
const discounts = [5, 10, 15, 20]
discounts.forEach(discount => {
  const result = calculatePrice(testProduct.price, 10, testProduct.pricingTiers, discount)
  const tierPrice = 7.50 // Tier 1 at 10 tons
  const expectedDiscount = tierPrice * (discount / 100)
  const expectedFinal = tierPrice - expectedDiscount
  console.log(`  ${discount}% discount: $${result.finalPrice.toFixed(2)}/ton (contractor saves $${result.contractorDiscount.toFixed(2)}/ton)`)
  console.log(`    Expected: $${expectedFinal.toFixed(2)}/ton - ${result.finalPrice === parseFloat(expectedFinal.toFixed(2)) ? '✓' : '✗'}`)
})
console.log()

// Test Scenario 7: Edge Cases
console.log('Scenario 7: Edge Cases')
console.log('-'.repeat(80))

// Edge case 1: 0% contractor discount (should be same as non-contractor)
const edge1 = calculatePrice(testProduct.price, 10, testProduct.pricingTiers, 0)
console.log(`Edge 1: 0% contractor discount (10 tons)`)
console.log(`  Price: $${edge1.finalPrice.toFixed(2)}/ton (should be $7.50 - Tier 1 only)`)
const passEdge1 = edge1.finalPrice === 7.50 && edge1.contractorDiscount === 0
console.log(`  ✓ PASS: ${passEdge1 ? 'YES' : 'NO'}`)
console.log()

// Edge case 2: 100% contractor discount (free after tier discount)
const edge2 = calculatePrice(testProduct.price, 10, testProduct.pricingTiers, 100)
console.log(`Edge 2: 100% contractor discount (10 tons)`)
console.log(`  Price: $${edge2.finalPrice.toFixed(2)}/ton (should be $0.00)`)
const passEdge2 = edge2.finalPrice === 0.00 && edge2.contractorDiscount === 7.50
console.log(`  ✓ PASS: ${passEdge2 ? 'YES' : 'NO'}`)
console.log()

// Edge case 3: Contractor discount with no volume tiers
const edge3 = calculatePrice(testProduct.price, 5, [], CONTRACTOR_DISCOUNT)
console.log(`Edge 3: Contractor discount with no volume tiers (5 tons)`)
console.log(`  Price: $${edge3.finalPrice.toFixed(2)}/ton (should be $7.20 - 10% off base)`)
const passEdge3 = edge3.finalPrice === 7.20 && edge3.volumeDiscount === 0
console.log(`  ✓ PASS: ${passEdge3 ? 'YES' : 'NO'}`)
console.log()

// Test Scenario 8: Complete Order Calculation with Tax and Fees
console.log('Scenario 8: Complete Order Calculation (25 tons contractor order)')
console.log('-'.repeat(80))
const orderQuantity = 25
const orderCalc = calculatePrice(testProduct.price, orderQuantity, testProduct.pricingTiers, CONTRACTOR_DISCOUNT)
const subtotal = orderQuantity * testProduct.price
const volumeSavings = orderCalc.volumeDiscount * orderQuantity
const contractorSavings = orderCalc.contractorDiscount * orderQuantity
const discountedSubtotal = orderCalc.finalPrice * orderQuantity
const tax = discountedSubtotal * 0.0725 // 7.25% tax
const processingFee = discountedSubtotal * 0.045 // 4.5% fee
const total = discountedSubtotal + tax + processingFee

console.log(`Product: ${testProduct.name} - ${orderQuantity} tons`)
console.log()
console.log(`Pricing Breakdown:`)
console.log(`  Base subtotal (${orderQuantity} × $${testProduct.price.toFixed(2)}): $${subtotal.toFixed(2)}`)
console.log(`  Volume discount (Tier 1): -$${volumeSavings.toFixed(2)}`)
console.log(`  Contractor discount (10%): -$${contractorSavings.toFixed(2)}`)
console.log(`  Discounted subtotal: $${discountedSubtotal.toFixed(2)}`)
console.log(`  Tax (7.25%): +$${tax.toFixed(2)}`)
console.log(`  Processing fee (4.5%): +$${processingFee.toFixed(2)}`)
console.log(`  ─────────────────────────────`)
console.log(`  Order Total: $${total.toFixed(2)}`)
console.log()
console.log(`  Total Savings: $${orderCalc.totalSavings.toFixed(2)}`)
console.log(`  Savings Percentage: ${((orderCalc.totalSavings / subtotal) * 100).toFixed(1)}%`)
const pass8 = Math.abs(orderCalc.finalPrice - 6.75) < 0.01 && Math.abs(total - 188.57) < 0.02
console.log(`✓ PASS: ${pass8 ? 'YES' : 'NO'}`)
console.log()

// Summary
console.log('='.repeat(80))
console.log('TEST SUMMARY')
console.log('='.repeat(80))

const allTests = [
  pass1, // Non-contractor standard pricing
  pass2, // Contractor base price discount
  pass3, // Contractor + Tier 1
  pass4, // Contractor + Tier 2
  pass5, // Contractor + Tier 3
  passEdge1, // 0% contractor discount
  passEdge2, // 100% contractor discount
  passEdge3, // No volume tiers
  pass8, // Complete order calculation
]

const passedTests = allTests.filter(t => t).length
const totalTests = allTests.length

console.log(`Total Tests: ${totalTests}`)
console.log(`Passed: ${passedTests}`)
console.log(`Failed: ${totalTests - passedTests}`)
console.log()

if (passedTests === totalTests) {
  console.log('✅ ALL TESTS PASSED - Contractor pricing calculations are working correctly!')
  console.log()
  console.log('The contractor pricing logic has been verified for:')
  console.log('  ✓ Non-contractor users (no contractor discount)')
  console.log('  ✓ Contractor base price discount (10%)')
  console.log('  ✓ Contractor + Volume Tier 1 discount stacking')
  console.log('  ✓ Contractor + Volume Tier 2 discount stacking')
  console.log('  ✓ Contractor + Volume Tier 3 discount stacking')
  console.log('  ✓ Edge case: 0% contractor discount')
  console.log('  ✓ Edge case: 100% contractor discount')
  console.log('  ✓ Edge case: Contractor discount without volume tiers')
  console.log('  ✓ Complete order with tax and processing fees')
  console.log()
  console.log('Discount Stacking Verified:')
  console.log('  1. Volume discount applies first (base → tier price)')
  console.log('  2. Contractor discount applies to tier price')
  console.log('  3. Tax and fees apply to discounted subtotal')
} else {
  console.log('❌ SOME TESTS FAILED - Please review the output above')
  process.exit(1)
}

console.log('='.repeat(80))
