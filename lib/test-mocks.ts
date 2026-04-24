import { PrismaClient } from "@prisma/client";
import { vi } from "vitest";

/**
 * Mock product data for testing
 */
export const mockProducts = [
  {
    name: "Bank Run",
    price: 2.0,
    unit: "ton",
    category: "soil",
    description: "Natural mix of sand, gravel, and soil. Ideal for fill and base material.",
  },
  {
    name: "Fill Dirt",
    price: 2.0,
    unit: "ton",
    category: "soil",
    description: "Clean fill dirt perfect for grading, backfill, and landscaping projects.",
  },
  {
    name: "#8 Gravel (Washed)",
    price: 15.0,
    unit: "ton",
    category: "gravel",
    description: "Washed 3/8\" gravel perfect for concrete mix and decorative applications.",
  },
] as const;

/**
 * Mock cart items for testing
 */
export const mockCartItems = [
  {
    name: "Bank Run",
    price: 2.0,
    unit: "ton",
    quantity: 5,
  },
  {
    name: "#8 Gravel (Washed)",
    price: 15.0,
    unit: "ton",
    quantity: 2,
  },
];

/**
 * Mock checkout data
 */
export const mockCheckoutData = {
  name: "John Doe",
  email: "john@example.com",
  phone: "7401234567",
  fulfillment: "pickup" as const,
  items: mockCartItems,
  subtotal: 40.0,
  tax: 2.9,
  processingFee: 1.8,
  total: 44.7,
};

/**
 * Mock quote request data
 */
export const mockQuoteData = {
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "7409876543",
  company: "Smith Construction",
  products: [
    { productName: "Bank Run", quantity: "20 tons" },
    { productName: "Topsoil", quantity: "10 tons" },
  ],
  deliveryAddr: "123 Main St, Zanesville, OH 43701",
  notes: "Need delivery by Friday",
};

/**
 * Mock contact form data
 */
export const mockContactData = {
  name: "Bob Johnson",
  email: "bob@example.com",
  phone: "7405551234",
  subject: "Product inquiry",
  message: "I need information about your delivery services.",
};

/**
 * Mock user data
 */
export const mockUser = {
  id: "user_123abc",
  email: "test@example.com",
  name: "Test User",
  phone: "7401234567",
  company: "Test Company",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-15"),
};

/**
 * Mock Clerk user
 */
export const mockClerkUser = {
  id: "user_123abc",
  emailAddresses: [{ emailAddress: "test@example.com" }],
  firstName: "Test",
  lastName: "User",
};

/**
 * Mock order data
 */
export const mockOrder = {
  id: "order_123",
  userId: "user_123abc",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "7401234567",
  fulfillmentType: "pickup" as const,
  items: mockCartItems,
  subtotal: 40.0,
  tax: 2.9,
  processingFee: 1.8,
  total: 44.7,
  status: "pending" as const,
  stripePaymentIntentId: "pi_123abc",
  createdAt: new Date("2025-04-23"),
  updatedAt: new Date("2025-04-23"),
};

/**
 * Mock address data
 */
export const mockAddress = {
  id: "addr_123",
  userId: "user_123abc",
  label: "Home",
  street: "123 Main St",
  city: "Zanesville",
  state: "OH",
  zip: "43701",
  isDefault: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

/**
 * Mock Prisma client for testing
 */
export const createMockPrisma = () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    address: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    quote: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    contact: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $disconnect: vi.fn(),
  } as unknown as PrismaClient;

  return mockPrisma;
};

/**
 * Mock Stripe payment intent
 */
export const mockStripePaymentIntent = {
  id: "pi_123abc",
  object: "payment_intent" as const,
  amount: 4470,
  currency: "usd",
  status: "succeeded" as const,
  client_secret: "pi_123abc_secret_xyz",
  metadata: {
    orderId: "order_123",
  },
};

/**
 * Mock API responses
 */
export const mockApiResponses = {
  success: <T>(data: T) => ({
    success: true,
    data,
  }),
  error: (message: string) => ({
    success: false,
    error: message,
  }),
  validationError: (field: string, message: string) => ({
    success: false,
    error: `Validation failed: ${field} - ${message}`,
  }),
};

/**
 * Mock chat messages
 */
export const mockChatMessages = [
  { role: "user" as const, content: "Hello, I need help with an order" },
  { role: "assistant" as const, content: "Hi! I'd be happy to help you with your order. What would you like to know?" },
  { role: "user" as const, content: "What's the difference between Bank Run and Fill Dirt?" },
  { role: "assistant" as const, content: "Bank Run is a natural mix of sand, gravel, and soil that's ideal for fill and base material. Fill Dirt is clean fill dirt that's perfect for grading, backfill, and landscaping projects. Both are priced at $2 per ton." },
];

/**
 * Mock environment variables
 */
export const mockEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
  CLERK_SECRET_KEY: "sk_test_123",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_PUBLISHABLE_KEY: "pk_test_123",
  POSTMARK_API_KEY: "test_api_key",
};

/**
 * Set mock environment variables
 */
export function setMockEnv() {
  Object.entries(mockEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Clear mock environment variables
 */
export function clearMockEnv() {
  Object.keys(mockEnv).forEach((key) => {
    delete process.env[key];
  });
}
