import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSA Payment Kiosk",
  description: "Self-service payment kiosk powered by Square",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
