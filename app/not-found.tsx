import Link from "next/link";
import { FileQuestion, ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";

export default function NotFound() {
  return (
    <div className="flex min-h-[72vh] flex-col items-center justify-center py-16 px-4 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-8xl font-bold font-heading text-muted-foreground/20 mb-2 leading-none">
        404
      </p>
      <h1 className="text-2xl font-bold font-heading mb-3">Page Not Found</h1>
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        We couldn&apos;t find the page you&apos;re looking for. It may have
        moved or the link may be incorrect.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Browse Products</Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Contact Us
          </Button>
        </Link>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Or call us directly:{" "}
        <a
          href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
          className="text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          <Phone className="h-3 w-3" />
          {BUSINESS_INFO.phone}
        </a>
      </p>
    </div>
  );
}
