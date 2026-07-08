import type { ReactNode } from "react";

export const metadata = {
  title: "Sanity Studio",
  description: "Content management for Muskingum Materials website",
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
