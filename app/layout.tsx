import type { Metadata } from "next";
import { Figtree, Newsreader } from "next/font/google";
import "./globals.css";

const sans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AlphaIQ",
  description: "The names you follow, in one quiet place.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className="dark">
      <body
          className={`${sans.variable} ${display.variable} antialiased`}
      >
      {children}
      </body>
      </html>
  );
}