import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skorama",
  description: "Στατιστικό μοντέλο πρόβλεψης ποδοσφαίρου — Poisson + Dixon-Coles.",
  metadataBase: new URL("https://skorama.xyz"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body className="min-h-screen w-full bg-bg font-sans flex flex-col">
        <Providers>
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
