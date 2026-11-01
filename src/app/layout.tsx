import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Stardos_Stencil } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/lib/i18n";
import { MESSAGES } from "@/lib/messages";

const sans = Barlow({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const heading = Barlow_Condensed({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});
const stencil = Stardos_Stencil({ variable: "--font-stencil", subsets: ["latin"], weight: ["700"] });

export const metadata: Metadata = {
  title: "ChaosGone",
  description: "Basement inventory with photo recognition",
  appleWebApp: { capable: true, title: "ChaosGone" },
};

export const viewport: Viewport = {
  themeColor: "#2b3138",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${sans.variable} ${heading.variable} ${stencil.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} messages={MESSAGES[locale]}>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:py-8">{children}</main>
          <Toaster position="top-center" />
        </I18nProvider>
      </body>
    </html>
  );
}
