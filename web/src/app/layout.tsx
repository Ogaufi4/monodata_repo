import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indigenous Intelligence Botswana",
  description: "Contribute, preserve, and grow Botswana's indigenous knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
