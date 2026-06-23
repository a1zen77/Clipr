import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clipper — X/Twitter Video Clipper",
  description: "Clip videos from X/Twitter posts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ background: "#0E0F11" }}>
      <body className={inter.className} style={{ background: "#0E0F11", margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
