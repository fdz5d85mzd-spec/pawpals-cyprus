import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { routing } from "@/i18n/routing";
import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { TrialBanner } from "@/components/TrialBanner";
import { SignupPopup } from "@/components/SignupPopup";
import { AffiliatePopup } from "@/components/AffiliatePopup";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AffiliateTracker } from "@/components/AffiliateTracker";
import "../globals.css";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  title: "Skorama",
  description: "Στατιστικό μοντέλο πρόβλεψης ποδοσφαίρου — Poisson + Dixon-Coles.",
  metadataBase: new URL("https://skorama.xyz"),
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Skorama" },
};

export const viewport = { themeColor: "#0B0B0D" };

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Rendered server-side (not via next/script in a client component) so the
  // tag is present in the raw HTML <head> on every request — that's what
  // Google's AdSense site-verification checks for, and what lets us skip it
  // for PRO sessions without a client-side flash of the ad script.
  const session = await getServerSession(authOptions);
  const showAds = !!ADSENSE_CLIENT_ID && session?.user?.plan !== "PRO";

  return (
    <html lang={locale}>
      {showAds && (
        <head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body className="min-h-screen w-full bg-bg font-sans flex flex-col">
        <NextIntlClientProvider>
          <Providers>
            <Nav />
            <TrialBanner />
            <div className="flex-1">{children}</div>
            <Footer />
            <SignupPopup />
            <AffiliatePopup />
            <InstallAppBanner />
          </Providers>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
        <AffiliateTracker />
        <Analytics />
      </body>
    </html>
  );
}
