import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata: Metadata = {
  title: "Create New Campaign",
  description: "Create a new email marketing campaign to send to newsletter subscribers.",
};

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Create New Campaign</h1>
        <p className="text-sm text-muted-foreground">
          Build and send email campaigns to your newsletter subscribers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignForm />
        </CardContent>
      </Card>
    </div>
  );
}
