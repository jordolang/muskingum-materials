import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata: Metadata = {
  title: "Create New Campaign",
  description: "Create a new email marketing campaign to send to newsletter subscribers.",
};

export default async function NewCampaignPage() {
  const user = await currentUser();

  // Redirect non-admin users
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/account");
  }

  return (
    <div className="py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">Create New Campaign</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Build and send email campaigns to your newsletter subscribers. Choose a template,
            customize your message, and schedule delivery.
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
    </div>
  );
}
