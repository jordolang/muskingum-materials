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
 */

/**
 * Validates that a tax rate is within reasonable bounds for Ohio
 * @param rate - Tax rate to validate (e.g., 0.0725 for 7.25%)
 * @returns True if rate is valid
 */
export function isValidTaxRate(rate: number): boolean {
  // Ohio sales tax typically ranges from 5.75% to 8%
  return rate >= 0.0575 && rate <= 0.08;
}

/**
 * Validates that a credit processing fee is reasonable
 * @param fee - Fee percentage to validate (e.g., 0.045 for 4.5%)
 * @returns True if fee is valid
 */
export function isValidProcessingFee(fee: number): boolean {
  // Processing fees typically range from 2% to 5%
  return fee >= 0.02 && fee <= 0.05;
}

/**
 * Validates that a material density is within physical bounds
 * @param density - Density in tons per cubic yard
 * @returns True if density is valid
 */
export function isValidMaterialDensity(density: number): boolean {
  // Most aggregates and soil range from 1.0 to 2.0 tons/yd³
  return density >= 1.0 && density <= 2.0;
}

/**
 * Validates that a truck capacity is reasonable
 * @param tons - Capacity in tons
 * @returns True if capacity is valid
 */
export function isValidTruckCapacity(tons: number): boolean {
  // Commercial dump trucks typically range from 10 to 30 tons
  return tons >= 10 && tons <= 30;
}
