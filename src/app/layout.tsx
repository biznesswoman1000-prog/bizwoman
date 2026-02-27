// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/shared/toaster";
import { Providers } from "@/components/shared/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// ── Fetch settings server-side (runs at request time in dev, cached in prod) ──
async function getSiteSettings() {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/settings`, {
      // Revalidate every 5 minutes so metadata stays fresh without rebuilding
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.settings ?? null;
  } catch {
    return null;
  }
}

// ── Dynamic metadata ──────────────────────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();

  const siteName = s?.siteName || "EquipUniverse";
  const title = s?.metaTitle || siteName;
  const desc =
    s?.metaDescription ||
    "Premium business solutions, office supplies, and professional services for the modern business woman.";
  const keywords = s?.metaKeywords
    ? s.metaKeywords.split(",").map((k: string) => k.trim())
    : ["business", "office supplies", "professional", "Nigeria", "e-commerce"];
  const ogImage = s?.metaImage || undefined;

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description: desc,
    keywords,
    openGraph: {
      type: "website",
      locale: "en_NG",
      siteName,
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();

  const faviconUrl = s?.favicon || null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dynamic favicon from site settings */}
        {faviconUrl ? (
          <>
            <link rel="icon" href={faviconUrl} />
            <link rel="shortcut icon" href={faviconUrl} />
            <link rel="apple-touch-icon" href={faviconUrl} />
          </>
        ) : (
          <link rel="icon" href="/favicon.ico" />
        )}
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
