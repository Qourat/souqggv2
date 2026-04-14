import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOUQ.GG — The Digital Product Market",
  description: "Discover, buy and sell digital products — code, templates, prompts, datasets, APIs and more.",
  openGraph: {
    title: "SOUQ.GG — The Digital Product Market",
    description: "The digital product marketplace for creators and builders.",
    url: "https://souq.gg",
    siteName: "SOUQ.GG",
  },
  twitter: {
    card: "summary",
    title: "SOUQ.GG — The Digital Product Market",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}