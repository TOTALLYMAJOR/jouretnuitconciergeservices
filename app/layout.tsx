import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jouretnuitconcierge.services"),
  title: {
    default: "Jour et Nuit Concierge | Business Readiness & Growth Consulting",
    template: "%s | Jour et Nuit Concierge",
  },
  description:
    "Strategic business consulting for entrepreneurs seeking stronger credit readiness, professional documents, compliance support, education, and confident growth.",
  keywords: [
    "business credit consulting",
    "business funding readiness",
    "business document preparation",
    "business formation guidance",
    "entrepreneur coaching",
  ],
  openGraph: {
    title: "Build a Business People Are Ready to Believe In",
    description: "Business readiness, documentation, education, and growth strategy for entrepreneurs.",
    type: "website",
    siteName: "Jour et Nuit Concierge",
  },
  robots: { index: true, follow: true },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
