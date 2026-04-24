import type { ReactNode } from "react";

export const metadata = {
  title: "Sanity Studio | Muskingum Materials",
  description: "Content management for Muskingum Materials website",
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
