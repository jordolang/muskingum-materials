import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadsTableProps {
  leads: Lead[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No leads found</h2>
          <p className="text-muted-foreground">
            Leads will appear here as visitors submit inquiries.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => {
        const messagePreview = lead.message
          ? lead.message.length > 100
            ? lead.message.substring(0, 100) + "..."
            : lead.message
          : null;

        return (
          <Link key={lead.id} href={`/admin/leads/${lead.id}`}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-sm">{lead.name}</p>
                      <StatusBadge status={lead.status} />
                      <SourceBadge source={lead.source} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        )}
                        {lead.company && (
                          <p className="text-xs font-medium mt-1">{lead.company}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        {messagePreview && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {messagePreview}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-purple-100 text-purple-800",
    converted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (!source || source === "website") {
    return <Badge variant="outline" className="text-xs">Website</Badge>;
  }
  return (
    <Badge variant="outline" className="text-xs capitalize">
      {source}
    </Badge>
  );
}
