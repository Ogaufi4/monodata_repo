import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const display = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Indigenous Intelligence Botswana",
  description: "Contribute, preserve, and grow Botswana's indigenous knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      <body className="font-display antialiased">{children}</body>
    </html>
  );
}
