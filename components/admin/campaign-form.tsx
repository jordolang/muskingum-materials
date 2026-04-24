"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campaignSchema, type CampaignData } from "@/lib/schemas";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

export function CampaignForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CampaignData>({
    resolver: zodResolver(campaignSchema),
  });

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch("/api/admin/templates?limit=100");
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch {
        // Silently fail - templates are optional
      } finally {
        setLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, []);

  async function onSubmit(data: CampaignData) {
    setError("");
    try {
      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Submission failed");

      setSubmitted(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Campaign Created!</h3>
        <p className="text-muted-foreground mb-4">
          Your campaign has been saved as a draft. You can schedule or send it from the campaigns list.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Create Another Campaign
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="subject">
          Subject Line *
        </label>
        <Input id="subject" placeholder="Campaign subject line" {...register("subject")} />
        {errors.subject && (
          <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="body">
          Email Body *
        </label>
        <Textarea
          id="body"
          placeholder="Write your email content here..."
          rows={10}
          {...register("body")}
        />
        {errors.body && (
          <p className="text-xs text-destructive mt-1">{errors.body.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="templateId">
          Email Template (Optional)
        </label>
        {loadingTemplates ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading templates...
          </div>
        ) : (
          <Select
            onValueChange={(value) => setValue("templateId", value)}
          >
            <SelectTrigger id="templateId">
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.templateId && (
          <p className="text-xs text-destructive mt-1">{errors.templateId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="scheduledFor">
            Schedule For (Optional)
          </label>
          <Input
            id="scheduledFor"
            type="datetime-local"
            {...register("scheduledFor")}
          />
          {errors.scheduledFor && (
            <p className="text-xs text-destructive mt-1">{errors.scheduledFor.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="recipientFilter">
            Recipient Filter (Optional)
          </label>
          <Input
            id="recipientFilter"
            placeholder="e.g., subscribed=true"
            {...register("recipientFilter")}
          />
          {errors.recipientFilter && (
            <p className="text-xs text-destructive mt-1">{errors.recipientFilter.message}</p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Campaign...
          </>
        ) : (
          "Create Campaign"
        )}
      </Button>
    </form>
  );
}
