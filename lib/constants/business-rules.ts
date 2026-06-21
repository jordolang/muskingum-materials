/**
 * Business Rules and Constants
 *
 * This file centralizes all business logic constants and magic numbers used throughout
 * the application. Each constant is documented with its business rationale, valid range,
 * and update procedures.
 *
 * IMPORTANT: Changes to these values may have financial, legal, or operational impacts.
 * Review with business stakeholders before modifying.
 */

/**
 * Ohio state sales tax rate (7.25%)
 *
 * This is the combined state and local sales tax rate applicable to materials
 * sold in Muskingum County, Ohio. This rate must be updated when:
 * - Ohio state tax rate changes
 * - Local (county/city) tax rates change
 * - Business location changes to a different tax jurisdiction
 *
 * Last verified: 2024
 * Source: Ohio Department of Taxation
 * Applies to: All taxable product sales
 *
 * @see https://tax.ohio.gov/business/ohio-business-taxes/sales-and-use/rates
 */
export const TAX_RATE = 0.0725;

/**
 * Credit card processing fee pass-through (4.5%)
 *
 * This fee covers Stripe payment processing costs that are passed through to customers
 * who pay by credit card. The fee helps offset:
 * - Stripe transaction fees (~2.9% + $0.30)
 * - Credit card network interchange fees
 * - Fraud protection and chargeback costs
 *
 * Policy: Applied only to credit/debit card payments, not cash or check
 * Updates: Review when Stripe fee structure changes or company policy updates
 *
 * Note: This is a business policy decision, not a fixed external rate
 */
export const CREDIT_PROCESSING_FEE = 0.045;

/**
 * Average material density for aggregates (1.4 tons per cubic yard)
 *
 * Industry-standard conversion factor for estimating weight from volume for
 * sand, gravel, and soil products. This is an AVERAGE value:
 *
 * Actual density ranges by material:
 * - Sand: 1.3 - 1.5 tons/yd³
 * - Gravel: 1.4 - 1.6 tons/yd³
 * - Topsoil: 1.0 - 1.3 tons/yd³
 * - Clay: 1.5 - 1.7 tons/yd³
 *
 * Use case: Project estimator for calculating approximate tonnage and cost
 * Limitation: This is an ESTIMATE. Actual weights will vary by material type,
 * moisture content, and compaction. Always confirm final quantities at the scale.
 *
 * Updates: This is a physical constant that rarely changes, but individual
 * product densities may be added to the Product model for more precise estimates.
 */
export const MATERIAL_DENSITY_AVG = 1.4;

/**
 * Standard truck capacity (20 tons per load)
 *
 * Maximum payload capacity for Muskingum Materials delivery trucks. This is a
 * FLEET LIMITATION based on:
 * - Truck weight ratings (GVWR)
 * - Ohio DOT weight limits for commercial vehicles
 * - Insurance and safety requirements
 * - Equipment capabilities
 *
 * Use case: Calculating number of truckloads needed for delivery
 *
 * Important: Loads exceeding 20 tons require:
 * - Multiple trips
 * - Customer pickup with appropriate vehicle
 * - Alternative delivery arrangements
 *
 * Updates: May change if fleet is upgraded or different truck classes are added
 */
export const TRUCK_CAPACITY_TONS = 20;

/**
 * Chat engagement threshold (4 messages)
 *
 * Number of customer messages in a chat conversation before prompting for contact
 * information. This threshold indicates engaged prospects worth capturing as leads.
 *
 * Business rationale:
 * - < 4 messages: Likely browsing, low conversion intent
 * - ≥ 4 messages: Actively seeking information, higher purchase intent
 * - Capturing contact info enables follow-up and lead nurturing
 *
 * Trade-offs:
 * - Lower threshold: More leads, but lower quality / higher bounce rate
 * - Higher threshold: Fewer leads, but higher quality / lower bounce rate
 *
 * Current setting optimized for: Balance between lead volume and quality
 * Updates: Based on conversion rate analysis and sales team feedback
 */
export const CHAT_CONTACT_THRESHOLD = 4;

/**
 * Order number prefix ('MM')
 *
 * Company identifier prefix for order numbers. Full format: MM-YYMMDD-XXXXXXXX
 *
 * Format breakdown:
 * - MM: Muskingum Materials company initials
 * - YYMMDD: Order date (enables chronological sorting)
 * - XXXXXXXX: 8-character unique identifier (UUID fragment)
 *
 * Properties:
 * - Human-readable company identifier
 * - Chronologically sortable by date
 * - Globally unique within the system
 * - Compatible with invoice systems and accounting software
 *
 * Updates: Only change if business name changes or order numbering system is redesigned
 */
export const ORDER_NUMBER_PREFIX = 'MM';

/**
 * Business rule validation utilities
 *
 * @public Can be used to validate config values at runtime or in tests
 */

/**
 * Validates that a tax rate is within reasonable bounds for Ohio
 * @param rate - Tax rate to validate (e.g., 0.0725 for 7.25%)
 * @returns True if rate is valid
 * @public Can be used to validate config values at runtime or in tests
 */
export function isValidTaxRate(rate: number): boolean {
  // Ohio sales tax typically ranges from 5.75% to 8%
  return rate >= 0.0575 && rate <= 0.08;
}

/**
 * Validates that a credit processing fee is reasonable
 * @param fee - Fee percentage to validate (e.g., 0.045 for 4.5%)
 * @returns True if fee is valid
 * @public Can be used to validate config values at runtime or in tests
 */
export function isValidProcessingFee(fee: number): boolean {
  // Processing fees typically range from 2% to 5%
  return fee >= 0.02 && fee <= 0.05;
}

/**
 * Validates that a material density is within physical bounds
 * @param density - Density in tons per cubic yard
 * @returns True if density is valid
 * @public Can be used to validate config values at runtime or in tests
 */
export function isValidMaterialDensity(density: number): boolean {
  // Most aggregates and soil range from 1.0 to 2.0 tons/yd³
  return density >= 1.0 && density <= 2.0;
}

/**
 * Validates that a truck capacity is reasonable
 * @param tons - Capacity in tons
 * @returns True if capacity is valid
 * @public Can be used to validate config values at runtime or in tests
 */
export function isValidTruckCapacity(tons: number): boolean {
  // Commercial dump trucks typically range from 10 to 30 tons
  return tons >= 10 && tons <= 30;
}

/**
 * ============================================================================
 * CONSTANT USAGE DOCUMENTATION
 * ============================================================================
 *
 * This section documents where each business rule constant is used throughout
 * the codebase. Update this list when adding new usage locations.
 *
 * Last updated: 2024-01-15
 */

/**
 * TAX_RATE Usage Locations
 * -------------------------
 * Value: 0.0725 (7.25%)
 *
 * Files:
 * 1. data/business.ts
 *    - Exported as part of BUSINESS_INFO config object
 *    - Provides tax rate to AI chat system and other components
 *
 * 2. components/admin/phone-order-form.tsx
 *    - Line 56: Calculates sales tax on order subtotals
 *    - Formula: tax = subtotal * TAX_RATE
 *
 * 3. scripts/test-contractor-pricing.ts
 *    - Used in contractor pricing test scenarios
 */

/**
 * CREDIT_PROCESSING_FEE Usage Locations
 * --------------------------------------
 * Value: 0.045 (4.5%)
 *
 * Files:
 * 1. data/business.ts
 *    - Exported as part of BUSINESS_INFO config object
 *    - Provides credit card fee information to AI chat and checkout flows
 *
 * 2. scripts/test-contractor-pricing.ts
 *    - Used in contractor pricing test scenarios
 */

/**
 * MATERIAL_DENSITY_AVG Usage Locations
 * -------------------------------------
 * Value: 1.4 (tons per cubic yard)
 *
 * Files:
 * 1. lib/estimate-calculations.ts
 *    - Lines 130, 133, 137: Core density calculation logic
 *    - Used with DEFAULT_DENSITY_VARIANCE (±0.1) to calculate confidence ranges
 *    - Falls back to this value when product-specific density data is unavailable
 *    - Formula: tonnage = cubic_yards * density
 *
 * 2. lib/__tests__/estimate-calculations.test.ts
 *    - Lines 78-151: Unit tests verifying density calculations
 *    - Tests fallback behavior when density data is missing
 *    - Validates confidence range calculations (±0.1 variance)
 *
 * 3. e2e/confidence-range.spec.ts
 *    - Line 211: E2E tests for estimate confidence ranges
 *    - Verifies that UI correctly displays density-based calculations
 */

/**
 * TRUCK_CAPACITY_TONS Usage Locations
 * ------------------------------------
 * Value: 20 (tons per truckload)
 *
 * Files:
 * 1. lib/estimate-calculations.ts
 *    - Lines 148, 156, 163: Calculates number of truckloads needed
 *    - Formula: truckloads = Math.ceil(tons / TRUCK_CAPACITY_TONS)
 *    - Applied separately to low/expected/high tonnage estimates
 *    - Ensures minimum of 1 truckload even for small orders
 */

/**
 * CHAT_CONTACT_THRESHOLD Usage Locations
 * ---------------------------------------
 * Value: 4 (messages)
 *
 * Files:
 * 1. components/chat/chat-widget.tsx
 *    - Line 100: Triggers contact form prompt after user engagement
 *    - Condition: messages.length >= CHAT_CONTACT_THRESHOLD
 *    - Only prompts if contact not already submitted and escalation not offered
 *    - Enables lead capture for engaged prospects
 */

/**
 * ORDER_NUMBER_PREFIX Usage Locations
 * ------------------------------------
 * Value: 'MM' (Muskingum Materials)
 *
 * Files:
 * 1. app/api/orders/checkout/route.ts
 *    - Line 45: generateOrderNumber() function
 *    - Creates order IDs in format: MM-YYMMDD-XXXXXXXX
 *    - Combines prefix with date stamp and unique identifier
 *    - Example: MM-240115-a7b3c9d2
 */
