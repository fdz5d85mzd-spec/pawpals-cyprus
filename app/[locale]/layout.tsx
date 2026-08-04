import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "../globals.css";

export const metadata: Metadata = {
  title: "Skorama",
  description: "Στατιστικό μοντέλο πρόβλεψης ποδοσφαίρου — Poisson + Dixon-Coles.",
  metadataBase: new URL("https://skorama.xyz"),
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale}>
      <body className="min-h-screen w-full bg-bg font-sans flex flex-col">
        <NextIntlClientProvider>
          <Providers>
            <Nav />
            <div className="flex-1">{children}</div>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
