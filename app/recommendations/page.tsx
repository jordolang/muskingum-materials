import type { Metadata } from "next";
import { MaterialWizard } from "@/components/recommendations/material-wizard";

export const metadata: Metadata = {
  title: "Material Recommendation Wizard",
  description:
    "Find the perfect material for your project. Answer a few simple questions and get personalized product recommendations with quantities and estimated costs.",
};

export default async function RecommendationsPage() {
  return (
    <div className="py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Find Your Perfect Material
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Not sure which material is right for your project? Answer a few
            simple questions and we&apos;ll recommend the best options with
            quantities and pricing.
          </p>
        </div>
        <MaterialWizard />

        <div className="mt-12 bg-muted/50 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-lg">1. Tell Us About Your Project</div>
              <p className="text-muted-foreground">
                Select your project type from driveways, landscaping, drainage,
                and more.
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-lg">2. Share Your Dimensions</div>
              <p className="text-muted-foreground">
                Provide your project area size to calculate accurate material
                quantities.
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-lg">3. Get Recommendations</div>
              <p className="text-muted-foreground">
                Receive personalized product suggestions with pricing and the
                option to order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
