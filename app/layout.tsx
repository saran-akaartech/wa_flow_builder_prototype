import type { Metadata } from "next";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "WhatsApp Flow Builder",
  description: "Visual drag-and-drop builder for WhatsApp bot flows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
