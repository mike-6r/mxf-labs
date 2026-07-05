import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SiteBackdrop } from "@/components/layout/site-backdrop";
import { siteConfig } from "@/lib/content";
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
  metadataBase: new URL(siteConfig.domain),
  title: {
    default: "MxF Labs | Full-Stack Development Studio",
    template: "%s | MxF Labs",
  },
  description: siteConfig.description,
  keywords: [
    "MxF Labs",
    "full-stack developer",
    "web development",
    "Discord bot development",
    "Minecraft plugin development",
    "custom software",
    "digital products",
  ],
  authors: [{ name: "MxF Labs" }],
  creator: "MxF Labs",
  publisher: "MxF Labs",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteConfig.domain,
  },
  openGraph: {
    type: "website",
    url: siteConfig.domain,
    siteName: "MxF Labs",
    title: "MxF Labs | Full-Stack Development Studio",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary",
    title: "MxF Labs | Full-Stack Development Studio",
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <SiteBackdrop />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
