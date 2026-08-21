import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Sora } from "next/font/google";
import { FanContentDisclaimer } from "@/components/layout/FanContentDisclaimer";
import "./globals.css";

// Sora (display) / Inter (body) feed design/tokens.json's --font-display and
// --font-body vars — see .claude/skills/ui-ux-pro-max/SKILL.md for why this
// product avoids the generic fan-site look.
const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Sora({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Pathory",
  description: "AI attack coaching for Clash of Clans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
        <body className="flex min-h-screen flex-col font-sans">
          <div className="flex-1">{children}</div>
          <FanContentDisclaimer />
        </body>
      </html>
    </ClerkProvider>
  );
}
