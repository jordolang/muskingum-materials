"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface SubscriberFormData {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
}

interface SubscriberFormProps {
  subscriber?: SubscriberFormData;
}

export function SubscriberForm({ subscriber }: SubscriberFormProps) {
  const router = useRouter();
  const isEdit = Boolean(subscriber);

  const [email, setEmail] = useState(subscriber?.email ?? "");
  const [name, setName] = useState(subscriber?.name ?? "");
  const [active, setActive] = useState(subscriber?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !email.trim()) {
      setError("Email is required.");
      return;
    }

    setSubmitting(true);
    try {
      // On edit, email is the unique key and is not changed; PATCH sends name + active only.
      const payload = isEdit
        ? { name: name.trim() || undefined, active }
        : { email: email.trim(), name: name.trim() || undefined, active };

      const res = await fetch(
        isEdit ? `/api/admin/subscribers/${subscriber!.id}` : "/api/admin/subscribers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || "Failed to save subscriber.");
        return;
      }

      router.push("/admin/subscribers");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Subscriber Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="subscriber@example.com"
              required={!isEdit}
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after creation.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Subscriber name"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <Label htmlFor="active" className="cursor-pointer">
              Active (subscribed)
            </Label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Subscriber"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/subscribers")}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
