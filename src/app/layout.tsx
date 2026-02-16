import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  weight: ["400", "500", "700"],
  variable: "--font-ubuntu",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scary Prankster",
  description:
    "The dark of the Void is infinite but the light of Creation is endless.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${ubuntu.variable} antialiased bg-[#0a0a0c] text-[#e8e8e8]`}
      >
        {children}
      </body>
    </html>
  );
}
