import type { Metadata } from "next";
import NextImage from "next/image";
import Link from "next/link";
import "./globals.css";
import { Montserrat } from "next/font/google";
import { Providers } from "./providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "ØMF Prosjektbank",
  description: "Referansedatabase for Ø.M. Fjeld",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${montserrat.variable} antialiased bg-gray-50 dark:bg-omf-dark text-omf-dark dark:text-white transition-colors duration-300 font-sans`}>
        <Providers>
          <nav className="bg-omf-dark text-white p-4 shadow-md border-b-4 border-omf-lime sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center relative">
              <Link href="/" className="z-10 flex-shrink-0">
                <NextImage
                  src="/om-fjeld-logo-v2.png"
                  alt="Ø.M. Fjeld Logo"
                  width={200}
                  height={50}
                  className="h-10 w-auto cursor-pointer"
                  priority
                />
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 text-base font-semibold">
                <Link href="/" className="hover:text-omf-cyan transition-colors">Prosjekter</Link>
                <Link href="/cv-bank" className="hover:text-omf-cyan transition-colors">CV-bank</Link>
                {/* Add more links if needed */}
              </div>
              <div className="w-[120px] md:w-[200px] flex-shrink-0 pointer-events-none" aria-hidden="true" />
            </div>
          </nav>
          <main className="container mx-auto p-4 min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
