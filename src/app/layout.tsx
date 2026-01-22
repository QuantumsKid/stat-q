import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLinks, SkipLink } from "@/components/ui/skip-link";
import { GlobalScreenReaderAnnouncer } from "@/components/accessibility/ScreenReaderAnnouncer";
import "./globals.css";



export const metadata: Metadata = {
  title: "StatQ - Advanced Survey Platform",
  description: "Create, manage, and analyze surveys with advanced quantitative insights",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body
        className="antialiased font-sans"
      >
        <NextIntlClientProvider messages={messages}>
          <SkipLinks>
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <SkipLink href="#navigation">Skip to navigation</SkipLink>
          </SkipLinks>
          <GlobalScreenReaderAnnouncer />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
