import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { vi } from "vitest";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  clerkUser?: {
    id: string;
    emailAddresses: Array<{ emailAddress: string }>;
    firstName?: string | null;
    lastName?: string | null;
  };
}

/**
 * Custom render function for testing React components with providers
 * Extends @testing-library/react's render with app-specific context
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { clerkUser, ...renderOptions } = options || {};

  if (clerkUser) {
    global.clerkUser = clerkUser;
  }

  return render(ui, renderOptions);
}

/**
 * Mock Next.js router
 */
export function mockRouter(overrides?: Partial<typeof import("next/navigation")>) {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    route: "/",
    ...overrides,
  };

  vi.mock("next/navigation", () => ({
    useRouter: () => router,
    usePathname: () => router.pathname,
    useSearchParams: () => new URLSearchParams(),
  }));

  return router;
}

/**
 * Wait for async operations in tests
 */
export const waitFor = async (ms: number = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Create mock FormData
 */
export function createMockFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

/**
 * Mock fetch responses
 */
export function mockFetch(
  response: unknown,
  options?: { status?: number; ok?: boolean }
) {
  const { status = 200, ok = true } = options || {};

  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });

  return global.fetch;
}

/**
 * Reset all mocks between tests
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
  delete global.clerkUser;
}
