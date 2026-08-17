import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
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
      className={`${fraunces.variable} ${hanken.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-mist font-body">
        {children}
      </body>
    </html>
  );
}
