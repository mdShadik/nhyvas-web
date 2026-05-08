import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { NavBar } from "@/components/common/NavBar/NavBar";
import { MobileTopBar } from "@/components/common/NavBar/MobileTopBar";
import { cn } from "@/lib/utils";
import { pageBgClass } from "@/constant";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nhyvas",
  description: "Find and explore rentals across Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "min-h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className={cn(pageBgClass, "min-h-dvh flex flex-col")}>
        <Providers>
          <MobileTopBar />
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
