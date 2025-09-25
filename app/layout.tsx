import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

// SEO + Social Media Meta Tags
export const metadata = {
  title: "Luxury Jewelry – Crafted for Moments That Last Forever",
  description:
    "Discover Aurielle's handcrafted fine jewelry collection. Ethical gold, conflict-free diamonds, and timeless elegance for life's most precious moments.",
  keywords: [
    "luxury jewelry",
    "fine jewelry",
    "handcrafted jewelry",
    "ethical diamonds",
    "gold rings",
    "engagement rings",
    "Aurielle Jewelry",
  ],
  openGraph: {
    type: "website",
    url: "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGpld2Vscnl8ZW58MHwwfDB8fHww",
    title: "Aurielle Jewelry – Crafted for Moments That Last Forever",
    description:
      "Discover Aurielle's handcrafted fine jewelry collection. Ethical gold, conflict-free diamonds, and timeless elegance for life's most precious moments.",
    siteName: "Aurielle Jewelry",
    images: [
      {
        url: "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGpld2Vscnl8ZW58MHwwfDB8fHww",
        width: 1200,
        height: 630,
        alt: "Aurielle Jewelry Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurielle Jewelry – Crafted for Moments That Last Forever",
    description:
      "Discover Aurielle's handcrafted fine jewelry collection. Ethical gold, conflict-free diamonds, and timeless elegance for life's most precious moments.",
    images: ["https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGpld2Vscnl8ZW58MHwwfDB8fHww"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
