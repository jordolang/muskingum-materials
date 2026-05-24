import { describe, it, expect } from "vitest";
import {
  contactSchema,
  checkoutFormSchema,
  checkoutSchema,
  addressSchema,
  profileSchema,
  profileUpdateSchema,
  quoteSchema,
  newsletterSchema,
  leadSchema,
} from "@/lib/schemas";

describe("contactSchema", () => {
  describe("valid data", () => {
    it("should validate complete contact form data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        subject: "Inquiry",
        message: "This is a valid message with enough characters.",
      };

      const result = contactSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate without optional phone field", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Inquiry",
        message: "This is a valid message.",
      };

      const result = contactSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with minimum required field lengths", () => {
      const validData = {
        name: "Jo",
        email: "a@b.co",
        subject: "Hi",
        message: "1234567890",
      };

      const result = contactSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
        email: "john@example.com",
        subject: "Inquiry",
        message: "This is a message.",
      };

      expect(() => contactSchema.parse(invalidData)).toThrow("Name is required");
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        name: "John Doe",
        email: "invalid-email",
        subject: "Inquiry",
        message: "This is a message.",
      };

      expect(() => contactSchema.parse(invalidData)).toThrow(
        "Valid email is required"
      );
    });

    it("should reject subject shorter than 2 characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "I",
        message: "This is a message.",
      };

      expect(() => contactSchema.parse(invalidData)).toThrow(
        "Subject is required"
      );
    });

    it("should reject message shorter than 10 characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Inquiry",
        message: "Short",
      };

      expect(() => contactSchema.parse(invalidData)).toThrow(
        "Message must be at least 10 characters"
      );
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        name: "John Doe",
      };

      expect(() => contactSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("checkoutFormSchema", () => {
  describe("valid data", () => {
    it("should validate pickup fulfillment", () => {
      const validData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "pickup" as const,
      };

      const result = checkoutFormSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate delivery fulfillment with optional fields", () => {
      const validData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "delivery" as const,
        deliveryAddress: "123 Main St",
        deliveryNotes: "Leave at door",
      };

      const result = checkoutFormSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with minimum phone length", () => {
      const validData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "pickup" as const,
      };

      const result = checkoutFormSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "pickup" as const,
      };

      expect(() => checkoutFormSchema.parse(invalidData)).toThrow(
        "Name is required"
      );
    });

    it("should reject invalid email", () => {
      const invalidData = {
        name: "Jane Smith",
        email: "not-an-email",
        phone: "1234567890",
        fulfillment: "pickup" as const,
      };

      expect(() => checkoutFormSchema.parse(invalidData)).toThrow(
        "Valid email is required"
      );
    });

    it("should reject phone shorter than 10 characters", () => {
      const invalidData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "123456789",
        fulfillment: "pickup" as const,
      };

      expect(() => checkoutFormSchema.parse(invalidData)).toThrow(
        "Phone number is required"
      );
    });

    it("should reject invalid fulfillment option", () => {
      const invalidData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "shipping",
      };

      expect(() => checkoutFormSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("checkoutSchema", () => {
  describe("valid data", () => {
    it("should validate complete checkout with items", () => {
      const validData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "pickup" as const,
        items: [
          { name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 },
          { name: "Fill Sand", price: 4.0, unit: "ton", quantity: 3 },
        ],
        subtotal: 22.0,
        tax: 1.595,
        processingFee: 1.062,
        total: 24.657,
      };

      const result = checkoutSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with single item", () => {
      const validData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "delivery" as const,
        deliveryAddress: "123 Main St",
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 1 }],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      const result = checkoutSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject items with quantity less than 1", () => {
      const invalidData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "pickup" as const,
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 0 }],
        subtotal: 0,
        tax: 0,
        processingFee: 0,
        total: 0,
      };

      expect(() => checkoutSchema.parse(invalidData)).toThrow();
    });

    it("should reject missing items array", () => {
      const invalidData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "pickup" as const,
        subtotal: 10.0,
        tax: 0.725,
        processingFee: 0.48,
        total: 11.205,
      };

      expect(() => checkoutSchema.parse(invalidData)).toThrow();
    });

    it("should reject missing price fields", () => {
      const invalidData = {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "1234567890",
        fulfillment: "pickup" as const,
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 }],
      };

      expect(() => checkoutSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("addressSchema", () => {
  describe("valid data", () => {
    it("should validate complete address", () => {
      const validData = {
        label: "Home",
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zip: "62701",
        isDefault: true,
      };

      const result = addressSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate without optional isDefault field", () => {
      const validData = {
        label: "Work",
        street: "456 Oak Ave",
        city: "Chicago",
        state: "IL",
        zip: "60601",
      };

      const result = addressSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with minimum required lengths", () => {
      const validData = {
        label: "H",
        street: "123",
        city: "AB",
        state: "IL",
        zip: "12345",
      };

      const result = addressSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject empty label", () => {
      const invalidData = {
        label: "",
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zip: "62701",
      };

      expect(() => addressSchema.parse(invalidData)).toThrow(
        "Label is required"
      );
    });

    it("should reject street shorter than 3 characters", () => {
      const invalidData = {
        label: "Home",
        street: "12",
        city: "Springfield",
        state: "IL",
        zip: "62701",
      };

      expect(() => addressSchema.parse(invalidData)).toThrow(
        "Street is required"
      );
    });

    it("should reject city shorter than 2 characters", () => {
      const invalidData = {
        label: "Home",
        street: "123 Main St",
        city: "A",
        state: "IL",
        zip: "62701",
      };

      expect(() => addressSchema.parse(invalidData)).toThrow("City is required");
    });

    it("should reject state shorter than 2 characters", () => {
      const invalidData = {
        label: "Home",
        street: "123 Main St",
        city: "Springfield",
        state: "I",
        zip: "62701",
      };

      expect(() => addressSchema.parse(invalidData)).toThrow(
        "State is required"
      );
    });

    it("should reject zip shorter than 5 characters", () => {
      const invalidData = {
        label: "Home",
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zip: "1234",
      };

      expect(() => addressSchema.parse(invalidData)).toThrow("ZIP is required");
    });
  });
});

describe("profileSchema", () => {
  describe("valid data", () => {
    it("should validate complete profile", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        company: "Acme Corp",
      };

      const result = profileSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate without optional fields", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const result = profileSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with minimum name length", () => {
      const validData = {
        name: "Jo",
        email: "a@b.co",
      };

      const result = profileSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
        email: "john@example.com",
      };

      expect(() => profileSchema.parse(invalidData)).toThrow("Name is required");
    });

    it("should reject invalid email", () => {
      const invalidData = {
        name: "John Doe",
        email: "invalid-email",
      };

      expect(() => profileSchema.parse(invalidData)).toThrow(
        "Valid email required"
      );
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        phone: "555-1234",
      };

      expect(() => profileSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("profileUpdateSchema", () => {
  describe("valid data", () => {
    it("should validate with all fields", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        company: "Acme Corp",
      };

      const result = profileUpdateSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with only name", () => {
      const validData = {
        name: "John Doe",
      };

      const result = profileUpdateSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with only email", () => {
      const validData = {
        email: "john@example.com",
      };

      const result = profileUpdateSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate empty object (all fields optional)", () => {
      const validData = {};

      const result = profileUpdateSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject name shorter than 2 characters if provided", () => {
      const invalidData = {
        name: "J",
      };

      expect(() => profileUpdateSchema.parse(invalidData)).toThrow();
    });

    it("should reject invalid email if provided", () => {
      const invalidData = {
        email: "invalid-email",
      };

      expect(() => profileUpdateSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("quoteSchema", () => {
  describe("valid data", () => {
    it("should validate complete quote request", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        company: "Acme Corp",
        products: [
          { productName: "Fill Dirt", quantity: "10 tons" },
          { productName: "Fill Sand", quantity: "5 tons" },
        ],
        deliveryAddr: "123 Main St",
        notes: "Please deliver between 8-10am",
      };

      const result = quoteSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with only required fields", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        products: [{ productName: "Fill Dirt", quantity: "10 tons" }],
      };

      const result = quoteSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with empty products array", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        products: [],
      };

      const result = quoteSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
        email: "john@example.com",
        products: [],
      };

      expect(() => quoteSchema.parse(invalidData)).toThrow("Name is required");
    });

    it("should reject invalid email", () => {
      const invalidData = {
        name: "John Doe",
        email: "invalid-email",
        products: [],
      };

      expect(() => quoteSchema.parse(invalidData)).toThrow(
        "Valid email is required"
      );
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        name: "John Doe",
      };

      expect(() => quoteSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("newsletterSchema", () => {
  describe("valid data", () => {
    it("should validate with email and name", () => {
      const validData = {
        email: "john@example.com",
        name: "John Doe",
      };

      const result = newsletterSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate with only email", () => {
      const validData = {
        email: "john@example.com",
      };

      const result = newsletterSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("validation errors", () => {
    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
      };

      expect(() => newsletterSchema.parse(invalidData)).toThrow(
        "Valid email is required"
      );
    });

    it("should reject missing email", () => {
      const invalidData = {
        name: "John Doe",
      };

      expect(() => newsletterSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("leadSchema", () => {
  describe("valid data", () => {
    it("should validate complete lead data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        source: "website",
        visitorId: "visitor-123",
      };

      const result = leadSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should apply default source when not provided", () => {
      const validData = {
        email: "john@example.com",
      };

      const result = leadSchema.parse(validData);
      expect(result.source).toBe("chat");
    });

    it("should validate empty object (all fields optional)", () => {
      const validData = {};

      const result = leadSchema.parse(validData);
      expect(result.source).toBe("chat");
    });

    it("should validate with only name", () => {
      const validData = {
        name: "John Doe",
      };

      const result = leadSchema.parse(validData);
      expect(result.source).toBe("chat");
    });

    it("should override default source when provided", () => {
      const validData = {
        email: "john@example.com",
        source: "landing-page",
      };

      const result = leadSchema.parse(validData);
      expect(result.source).toBe("landing-page");
    });
  });

  describe("validation errors", () => {
    it("should reject invalid email if provided", () => {
      const invalidData = {
        email: "invalid-email",
      };

      expect(() => leadSchema.parse(invalidData)).toThrow();
    });
  });
});
