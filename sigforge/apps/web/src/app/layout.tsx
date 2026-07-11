import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SigForge",
  description: "Animated, interactive email signatures for teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
