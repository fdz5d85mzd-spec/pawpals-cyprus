import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { routing } from "@/i18n/routing";
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
  // Pins the locale for this request instead of letting next-intl infer it
  // from headers/cookies — that inference is a "dynamic API" that forces
  // every page in the tree to fully re-render on the server on every
  // request. Pinning it here (plus in each page below) is what actually
  // lets `export const revalidate` on those pages take effect.
  setRequestLocale(locale);

  return (
    <html lang={locale}>
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
