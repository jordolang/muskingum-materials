export const metadata = {
  title: "Sanity Studio | Muskingum Materials",
  description: "Content management for Muskingum Materials website",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
