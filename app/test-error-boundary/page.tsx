import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorTrigger } from "@/components/test/error-trigger";

/**
 * Test page for verifying error boundary functionality
 * Access at: http://localhost:3010/test-error-boundary
 */
export default function TestErrorBoundaryPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Error Boundary Test Page</h1>
        <p className="text-muted-foreground mb-8">
          This page helps verify error boundary functionality. Click the button below to trigger a component error.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Test 1: Error Boundary with Retry</h2>
        <ErrorBoundary componentName="ErrorTrigger-Test1">
          <ErrorTrigger />
        </ErrorBoundary>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Test 2: Nested Error Boundary</h2>
        <ErrorBoundary componentName="ParentBoundary">
          <div className="p-4 border rounded-lg">
            <p className="mb-4">Parent boundary - errors here will be caught</p>
            <ErrorBoundary componentName="ChildBoundary">
              <ErrorTrigger />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
