import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/prisma";
import { CmsSettings } from "@/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JVMODAS | Moda Fitness de Alta Performance",
  description:
    "E-commerce oficial da JVMODAS. Leggings zero transparência, tops de alta sustentação, conjuntos seamless e macacões com tecnologia de compressão inteligente.",
  keywords: [
    "moda fitness",
    "legging zero transparência",
    "top alta sustentação",
    "roupas de academia",
    "conjunto canelado",
    "fitness wear brasil",
    "JVMODAS",
  ],
  authors: [{ name: "JVMODAS" }],
  openGraph: {
    title: "JVMODAS | Moda Fitness de Alta Performance",
    description:
      "Supere seus limites com estilo e conforto. Conheça a Coleção 2026 com frete grátis e até 12x sem juros.",
    type: "website",
    locale: "pt_BR",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialCms: CmsSettings | null = null;
  try {
    initialCms = (await prisma.cmsSettings.findUnique({
      where: { id: "default" },
    })) as CmsSettings | null;
  } catch (e) {
    console.error("Could not fetch initial CMS settings in layout", e);
  }

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers initialCms={initialCms}>{children}</Providers>
      </body>
    </html>
  );
}
