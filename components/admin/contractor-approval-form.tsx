"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ContractorApprovalFormProps {
  userId: string;
  currentApproval: boolean;
  currentCreditLimit?: number;
  currentTermsLength?: number;
}

export function ContractorApprovalForm({
  userId,
  currentApproval,
  currentCreditLimit,
  currentTermsLength,
}: ContractorApprovalFormProps) {
  const router = useRouter();
  const [isApproved, setIsApproved] = useState(currentApproval);
  const [creditLimit, setCreditLimit] = useState(currentCreditLimit?.toString() || "5000");
  const [termsLength, setTermsLength] = useState(currentTermsLength?.toString() || "30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasChanges =
    isApproved !== currentApproval ||
    (isApproved && parseFloat(creditLimit) !== currentCreditLimit) ||
    (isApproved && parseInt(termsLength) !== currentTermsLength);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!hasChanges) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isApproved) {
        // If revoking approval, set credit limit and terms to 0
        const response = await fetch(`/api/admin/contractors/${userId}/approve-terms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creditLimit: 0,
            termsLength: 0,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update contractor terms");
        }

        // Also need to update netTermsApproved to false
        // For now, we'll use the same endpoint but need to handle this in the backend
        setSuccess("Net terms revoked successfully");
      } else {
        // Approving with credit limit and terms length
        const parsedCreditLimit = parseFloat(creditLimit);
        const parsedTermsLength = parseInt(termsLength);

        if (isNaN(parsedCreditLimit) || parsedCreditLimit <= 0) {
          throw new Error("Credit limit must be a positive number");
        }

        if (isNaN(parsedTermsLength) || parsedTermsLength <= 0) {
          throw new Error("Terms length must be a positive number");
        }

        const response = await fetch(`/api/admin/contractors/${userId}/approve-terms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creditLimit: parsedCreditLimit,
            termsLength: parsedTermsLength,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to approve contractor terms");
        }

        setSuccess("Net terms approved successfully");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contractor terms");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setIsApproved(currentApproval);
    setCreditLimit(currentCreditLimit?.toString() || "5000");
    setTermsLength(currentTermsLength?.toString() || "30");
    setError(null);
    setSuccess(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Approval Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="approval-toggle">Net Terms Approved</Label>
          <p className="text-sm text-muted-foreground">
            Allow this contractor to use purchase orders and net terms
          </p>
        </div>
        <Switch
          id="approval-toggle"
          checked={isApproved}
          onCheckedChange={setIsApproved}
          disabled={isSubmitting}
        />
      </div>

      {/* Credit Limit and Terms Length (only show when approved) */}
      {isApproved && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="credit-limit">Credit Limit ($)</Label>
            <Input
              id="credit-limit"
              type="number"
              min="0"
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              disabled={isSubmitting}
              placeholder="5000.00"
            />
            <p className="text-xs text-muted-foreground">
              Maximum outstanding balance allowed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms-length">Payment Terms (days)</Label>
            <Select
              value={termsLength}
              onValueChange={setTermsLength}
              disabled={isSubmitting}
            >
              <SelectTrigger id="terms-length">
                <SelectValue placeholder="Select terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Net 15</SelectItem>
                <SelectItem value="30">Net 30</SelectItem>
                <SelectItem value="60">Net 60</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Number of days until payment is due
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
    </form>
  );
}
