"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WizardStep,
  WizardStepHeader,
  WizardStepTitle,
  WizardStepDescription,
  WizardStepContent,
  WizardStepFooter,
} from "@/components/recommendations/wizard-step";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Flower2,
  Droplet,
  Mountain,
  Square,
  Footprints,
  Home,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  PROJECT_TYPE_MAPPINGS,
  AREA_SIZE_RANGES,
  DELIVERY_OPTIONS,
  type ProjectType,
  type AreaSize,
} from "@/data/recommendation-mapping";
import {
  getCompleteRecommendations,
  type ProjectRecommendationResult,
} from "@/lib/recommendations";

const PROJECT_TYPE_ICONS: Record<string, typeof Car> = {
  car: Car,
  "flower-2": Flower2,
  droplet: Droplet,
  mountain: Mountain,
  square: Square,
  footprints: Footprints,
  home: Home,
  shield: Shield,
  sparkles: Sparkles,
};

type Step = "project-type" | "area-size" | "delivery" | "results";

interface WizardState {
  projectType: ProjectType | null;
  areaSize: AreaSize | null;
  customArea: string;
  deliveryPreference: string | null;
}

interface MaterialWizardProps {
  onComplete?: (result: ProjectRecommendationResult) => void;
}

export function MaterialWizard({ onComplete }: MaterialWizardProps) {
  const [step, setStep] = useState<Step>("project-type");
  const [state, setState] = useState<WizardState>({
    projectType: null,
    areaSize: null,
    customArea: "",
    deliveryPreference: null,
  });
  const [recommendations, setRecommendations] =
    useState<ProjectRecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const steps: Step[] = ["project-type", "area-size", "delivery", "results"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  function updateState(updates: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...updates }));
  }

  function goToStep(targetStep: Step) {
    setStep(targetStep);
  }

  function nextStep() {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  }

  function prevStep() {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  }

  function resetWizard() {
    setState({
      projectType: null,
      areaSize: null,
      customArea: "",
      deliveryPreference: null,
    });
    setRecommendations(null);
    setStep("project-type");
  }

  async function loadRecommendations() {
    if (!state.projectType || !state.areaSize) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await getCompleteRecommendations(
        state.projectType,
        state.areaSize
      );
      setRecommendations(result);
      if (result && onComplete) {
        onComplete(result);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to load recommendations. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (step === "results" && !recommendations) {
      loadRecommendations();
    }
  }, [step]);

  const canProceedFromProjectType = state.projectType !== null;
  const canProceedFromAreaSize = state.areaSize !== null;
  const canProceedFromDelivery = state.deliveryPreference !== null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Progress Bar */}
      {step !== "results" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Project Type Selection */}
      {step === "project-type" && (
        <WizardStep>
          <WizardStepHeader>
            <WizardStepTitle>What type of project are you working on?</WizardStepTitle>
            <WizardStepDescription>
              Select the option that best describes your project
            </WizardStepDescription>
          </WizardStepHeader>
          <WizardStepContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROJECT_TYPE_MAPPINGS.map((mapping) => {
                const Icon = PROJECT_TYPE_ICONS[mapping.icon] || Mountain;
                const isSelected = state.projectType === mapping.type;

                return (
                  <button
                    key={mapping.type}
                    onClick={() => {
                      updateState({ projectType: mapping.type });
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left hover:border-primary hover:shadow-md ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-md ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold">{mapping.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mapping.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </WizardStepContent>
          <WizardStepFooter>
            <div />
            <Button
              onClick={nextStep}
              disabled={!canProceedFromProjectType}
              size="lg"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </WizardStepFooter>
        </WizardStep>
      )}

      {/* Step 2: Area Size Selection */}
      {step === "area-size" && (
        <WizardStep>
          <WizardStepHeader>
            <WizardStepTitle>How large is your project area?</WizardStepTitle>
            <WizardStepDescription>
              Select the approximate size of the area you need to cover
            </WizardStepDescription>
          </WizardStepHeader>
          <WizardStepContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(AREA_SIZE_RANGES).map(([key, range]) => {
                const isSelected = state.areaSize === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      updateState({ areaSize: key as AreaSize });
                    }}
                    className={`p-6 rounded-lg border-2 transition-all text-center hover:border-primary hover:shadow-md ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border"
                    }`}
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{range.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {range.description}
                      </p>
                      <Badge variant={isSelected ? "default" : "outline"}>
                        ~{range.typicalSqFt} sq ft
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            {state.areaSize && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <label className="text-sm font-medium mb-2 block">
                  Know your exact area? (Optional)
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Enter square feet"
                    value={state.customArea}
                    onChange={(e) => updateState({ customArea: e.target.value })}
                    className="max-w-xs"
                  />
                  <span className="text-sm text-muted-foreground">square feet</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  We&apos;ll use your exact measurement for more accurate estimates
                </p>
              </div>
            )}
          </WizardStepContent>
          <WizardStepFooter>
            <Button onClick={prevStep} variant="outline" size="lg">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={nextStep}
              disabled={!canProceedFromAreaSize}
              size="lg"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </WizardStepFooter>
        </WizardStep>
      )}

      {/* Step 3: Delivery Preference */}
      {step === "delivery" && (
        <WizardStep>
          <WizardStepHeader>
            <WizardStepTitle>How would you like to receive your materials?</WizardStepTitle>
            <WizardStepDescription>
              Choose your preferred fulfillment method
            </WizardStepDescription>
          </WizardStepHeader>
          <WizardStepContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DELIVERY_OPTIONS.map((option) => {
                const isSelected = state.deliveryPreference === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateState({ deliveryPreference: option.value });
                    }}
                    className={`p-6 rounded-lg border-2 transition-all text-center hover:border-primary hover:shadow-md ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">{option.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Delivery fees vary by location and order size.
                We&apos;ll provide exact pricing in your quote.
              </p>
            </div>
          </WizardStepContent>
          <WizardStepFooter>
            <Button onClick={prevStep} variant="outline" size="lg">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => {
                nextStep();
              }}
              disabled={!canProceedFromDelivery}
              size="lg"
            >
              See Recommendations
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </WizardStepFooter>
        </WizardStep>
      )}

      {/* Step 4: Results (placeholder - actual implementation in recommendation-results.tsx) */}
      {step === "results" && (
        <WizardStep>
          <WizardStepHeader>
            <WizardStepTitle>Your Personalized Recommendations</WizardStepTitle>
            <WizardStepDescription>
              Based on your project details, here are our top recommendations
            </WizardStepDescription>
          </WizardStepHeader>
          <WizardStepContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Calculating your recommendations...
                </p>
              </div>
            ) : recommendations ? (
              <div className="space-y-6">
                {/* Project Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Project Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{recommendations.projectType.label}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Area:</span>
                      <p className="font-medium">
                        {state.customArea || recommendations.areaSqFt} sq ft
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Depth:</span>
                      <p className="font-medium">
                        {recommendations.projectType.estimatedDepth || "Variable"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delivery:</span>
                      <p className="font-medium capitalize">
                        {state.deliveryPreference?.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations List - This will be replaced by RecommendationResults component */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Recommended Materials ({recommendations.recommendations.length})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Results component will be implemented in subtask-3-1
                  </p>
                  {recommendations.recommendations.map((rec, index) => (
                    <div
                      key={rec.productSlug}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="mb-2">
                            {index === 0 ? "Best Match" : `Option ${index + 1}`}
                          </Badge>
                          <h4 className="font-semibold">
                            {rec.product?.name || rec.productSlug}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rec.reasoning}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Estimated Quantity:
                          </span>
                          <p className="font-medium">
                            {rec.estimatedQuantity} {rec.product?.unit || "tons"}
                          </p>
                        </div>
                        {rec.estimatedCost && (
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Estimated Cost:
                            </span>
                            <p className="font-medium">
                              ${rec.estimatedCost.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Unable to load recommendations. Please try again.
                </p>
              </div>
            )}
          </WizardStepContent>
          <WizardStepFooter>
            <Button onClick={resetWizard} variant="outline" size="lg">
              Start Over
            </Button>
            <Button onClick={prevStep} variant="outline" size="lg">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </WizardStepFooter>
        </WizardStep>
      )}
    </div>
  );
}
