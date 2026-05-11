import type { Metadata } from "next";
import "./globals.css";
import ThemeInit from "@/components/ThemeInit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://vaultex.space";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Vaultex — AI Privacy Gateway for Financial Services",
    template: "%s | Vaultex",
  },
  description:
    "Vaultex tokenizes PII before it reaches any LLM, then reverses it on the way back. Built for banks, lenders, and fintech teams. GLBA, GDPR, and CCPA aligned.",
  keywords: [
    "AI PII tokenization gateway",
    "LLM data privacy financial services",
    "GLBA compliance AI tool",
    "GDPR compliant LLM proxy",
    "CCPA AI gateway",
    "banking AI security proxy",
    "Presidio NER gateway",
    "reversible PII tokenization",
    "enterprise LLM compliance",
    "fintech data privacy platform",
  ],
  authors: [{ name: "Vaultex" }],
  creator: "Vaultex",
  publisher: "Vaultex",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Vaultex",
    title: "Vaultex — AI Privacy Gateway for Financial Services",
    description:
      "Stop LLMs from seeing customer SSNs, account numbers, and PII. Vaultex tokenizes in real-time, preserves analytics, and logs everything for regulators.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Vaultex — AI Privacy Gateway for Financial Services" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaultex — Zero PII to AI. Full Analytics. Built for Banking.",
    description: "The AI privacy gateway purpose-built for regulated financial institutions.",
    creator: "@vaultexai",
    images: ["/og-image.png"],
  },
  alternates: { canonical: APP_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Vaultex",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Linux, Windows, macOS (Docker)",
  description:
    "AI-native PII tokenization gateway for financial services. Strips sensitive data before LLM calls, preserves analytics, enables role-based decryption, and logs for GLBA/GDPR/CCPA compliance.",
  url: APP_URL,
  publisher: { "@type": "Organization", name: "Vaultex", url: APP_URL },
  offers: [
    { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "USD" },
    {
      "@type": "Offer",
      name: "Professional",
      price: "299",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
