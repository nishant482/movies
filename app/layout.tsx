import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frame | The Movie Archive",
  description: "Explore the sample_mflix movie collection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
