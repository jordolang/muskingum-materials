"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactFormData } from "@/lib/schemas";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactFormData) {
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Submission failed");

      setSubmitted(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
        <p className="text-muted-foreground mb-4">
          Thank you for reaching out. We&apos;ll get back to you as soon as possible.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="name">
            Name *
          </label>
          <Input id="name" placeholder="Your name" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="email">
            Email *
          </label>
          <Input id="email" type="email" placeholder="your@email.com" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="phone">
            Phone
          </label>
          <Input id="phone" placeholder="(740) 555-0123" {...register("phone")} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="subject">
            Subject *
          </label>
          <Input id="subject" placeholder="What's this about?" {...register("subject")} />
          {errors.subject && (
            <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="message">
          Message *
        </label>
        <Textarea
          id="message"
          placeholder="Tell us about your project or question..."
          rows={5}
          {...register("message")}
        />
        {errors.message && (
          <p className="text-xs text-destructive mt-1">{errors.message.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
