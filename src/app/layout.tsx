import type { Metadata } from "next";
import {
  Fraunces,
  Hanken_Grotesk,
  JetBrains_Mono,
  Tiro_Devanagari_Hindi,
  Tiro_Telugu,
} from "next/font/google";
import { IntroSplash } from "@/components/IntroSplash";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: "variable",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: "variable",
});

// Serif companions to Fraunces, used only for the greeting splash's Hindi and
// Telugu words: Fraunces has no Devanagari or Telugu glyphs, and these two are
// designed specifically to pair with a Latin literary serif rather than sit
// next to it as a mismatched sans.
const tiroDevanagari = Tiro_Devanagari_Hindi({
  variable: "--font-tiro-devanagari",
  subsets: ["devanagari"],
  weight: "400",
});

const tiroTelugu = Tiro_Telugu({
  variable: "--font-tiro-telugu",
  subsets: ["telugu"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Bhagath Samalla",
  description:
    "Backend engineer: Python, Django, AWS. CS grad, MGIT Hyderabad, 2026.",
  openGraph: {
    title: "Bhagath Samalla",
    description:
      "Backend engineer: Python, Django, AWS. CS grad, MGIT Hyderabad, 2026.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${jetbrainsMono.variable} ${tiroDevanagari.variable} ${tiroTelugu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-mist font-body">
        <IntroSplash />
        {children}
      </body>
    </html>
  );
}
