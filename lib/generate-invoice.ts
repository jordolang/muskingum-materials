import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface GenerateInvoiceParams {
  orderId: string;
  amount: number;
  netTermsLength: number;
  notes?: string;
}

interface InvoiceResult {
  id: string;
  invoiceNumber: string;
  orderId: string;
  amount: number;
  dueDate: Date;
  status: string;
  createdAt: Date;
}

/**
 * Generates a unique invoice number for net terms orders.
 *
 * Invoice number format: `INV-YYMMDD-XXXXXX`
 * - `INV`: Invoice identifier prefix
 * - `YYMMDD`: Date in YYMMDD format with no dashes (e.g., "260619" for June 19, 2026)
 * - `XXXXXX`: 6-character uppercase hexadecimal random identifier
 *
 * Example: `INV-260619-A1B2C3`
 *
 * The date component provides chronological sorting and human readability,
 * while the random component ensures uniqueness and prevents collisions
 * for invoices created at the same time.
 *
 * @returns A unique invoice number string
 */
function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 6)
    .toUpperCase();
  return `INV-${datePart}-${randomPart}`;
}

/**
 * Calculates the invoice due date based on net terms length.
 *
 * @param netTermsLength - Number of days until payment is due (e.g., 15, 30, 60)
 * @returns Date object representing the due date
 */
function calculateDueDate(netTermsLength: number): Date {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + netTermsLength);
  return dueDate;
}

/**
 * Generates an invoice for a net terms order and persists it to the database.
 *
 * This function:
 * - Generates a unique invoice number (INV-YYMMDD-XXXXXX format)
 * - Calculates the due date based on net terms length
 * - Creates an Invoice record with pending status
 * - Links the invoice to the order
 *
 * @param params - Invoice generation parameters
 * @param params.orderId - ID of the order to invoice
 * @param params.amount - Total amount to be invoiced
 * @param params.netTermsLength - Number of days until payment is due (15, 30, 60)
 * @param params.notes - Optional notes to include on the invoice
 * @returns Created invoice record
 * @throws Error if invoice creation fails or orderId is invalid
 *
 * @example
 * ```ts
 * const invoice = await generateInvoice({
 *   orderId: "cm123abc",
 *   amount: 1250.00,
 *   netTermsLength: 30,
 *   notes: "Net 30 terms for contractor account"
 * });
 * ```
 */
export async function generateInvoice(
  params: GenerateInvoiceParams
): Promise<InvoiceResult> {
  const { orderId, amount, netTermsLength, notes } = params;

  // Validate parameters
  if (!orderId) {
    throw new Error("Order ID is required to generate an invoice");
  }

  if (amount <= 0) {
    throw new Error("Invoice amount must be greater than zero");
  }

  if (![15, 30, 60].includes(netTermsLength)) {
    throw new Error(
      "Net terms length must be 15, 30, or 60 days"
    );
  }

  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    throw new Error(`Order with ID "${orderId}" not found`);
  }

  // Generate unique invoice number
  const invoiceNumber = generateInvoiceNumber();

  // Calculate due date
  const dueDate = calculateDueDate(netTermsLength);

  try {
    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        amount,
        dueDate,
        status: "pending",
        notes,
      },
    });

    logger.info("Invoice generated", {
      invoiceNumber: invoice.invoiceNumber,
      orderId,
      orderNumber: order.orderNumber,
      amount,
      dueDate: dueDate.toISOString(),
      netTermsLength,
    });

    return invoice;
  } catch (error) {
    logger.error("Failed to generate invoice", {
      orderId,
      orderNumber: order.orderNumber,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    throw new Error(
      `Failed to create invoice for order ${order.orderNumber}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
