import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, Calendar, Building2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { ContractorApprovalForm } from "@/components/admin/contractor-approval-form";

interface ContractorDetailPageProps {
  params: Promise<{ userId: string }>;
}

function ApprovalBadge({ approved }: { approved: boolean }) {
  if (approved) {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        Approved
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
      Pending
    </Badge>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null | undefined }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default async function ContractorDetailPage({ params }: ContractorDetailPageProps) {
  // Check admin authentication
  const user = await requireAdmin();
  if (!user) {
    redirect("/admin");
  }

  const { userId } = await params;

  let contractor;
  try {
    contractor = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        isContractor: true,
        contractorDiscount: true,
        netTermsApproved: true,
        netTermsCreditLimit: true,
        netTermsLength: true,
        netTermsBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch {
    // DB not ready
  }

  if (!contractor) notFound();
  if (!contractor.isContractor) {
    // Not a contractor, redirect to contractors list
    redirect("/admin/contractors");
  }

  const creditLimit = contractor.netTermsCreditLimit || 0;
  const creditUsed = contractor.netTermsBalance;
  const creditAvailable = creditLimit - creditUsed;
  const creditPercent = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/contractors"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Contractors
        </Link>
        <h1 className="text-2xl font-bold font-heading">
          {contractor.name || "Unnamed Contractor"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Member since{" "}
          {new Date(contractor.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex flex-wrap items-center gap-3">
        <ApprovalBadge approved={contractor.netTermsApproved} />
        {contractor.contractorDiscount && contractor.contractorDiscount > 0 && (
          <Badge variant="outline" className="text-xs">
            {contractor.contractorDiscount}% Contractor Discount
          </Badge>
        )}
      </div>

      {/* Contractor Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={Mail} label="Email" value={contractor.email} />
            <InfoItem icon={Phone} label="Phone" value={contractor.phone} />
            <InfoItem icon={Building2} label="Company" value={contractor.company} />
            <InfoItem icon={User} label="User ID" value={contractor.userId} />
          </div>
        </CardContent>
      </Card>

      {/* Net Terms Approval */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Net Terms Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractorApprovalForm
            userId={contractor.userId}
            currentApproval={contractor.netTermsApproved}
            currentCreditLimit={contractor.netTermsCreditLimit || undefined}
            currentTermsLength={contractor.netTermsLength || undefined}
          />
        </CardContent>
      </Card>

      {/* Credit Summary (only show if approved) */}
      {contractor.netTermsApproved && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Credit Limit</p>
                <p className="text-2xl font-bold">${creditLimit.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Balance Due</p>
                <p className="text-2xl font-bold text-destructive">
                  ${creditUsed.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Available Credit</p>
                <p className="text-2xl font-bold text-green-600">
                  ${creditAvailable.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Credit Usage Bar */}
            {creditLimit > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Credit Usage</p>
                  <p className="text-sm font-medium">{creditPercent.toFixed(1)}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      creditPercent > 90 ? "bg-red-500" :
                      creditPercent > 70 ? "bg-yellow-500" :
                      "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(100, creditPercent)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Payment Terms */}
            <Separator />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                <span className="text-muted-foreground">Payment Terms:</span>{" "}
                <span className="font-medium">Net {contractor.netTermsLength || 30}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
