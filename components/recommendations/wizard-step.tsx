import * as React from "react";
import { cn } from "@/lib/utils";

const WizardStep = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
WizardStep.displayName = "WizardStep";

const WizardStepHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
WizardStepHeader.displayName = "WizardStepHeader";

const WizardStepTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
WizardStepTitle.displayName = "WizardStepTitle";

const WizardStepDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
WizardStepDescription.displayName = "WizardStepDescription";

const WizardStepContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
WizardStepContent.displayName = "WizardStepContent";

const WizardStepFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-between p-6 pt-0", className)} {...props} />
  )
);
WizardStepFooter.displayName = "WizardStepFooter";

export { WizardStep, WizardStepHeader, WizardStepFooter, WizardStepTitle, WizardStepDescription, WizardStepContent };
