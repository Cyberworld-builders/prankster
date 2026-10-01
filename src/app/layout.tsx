import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Scary Prankster", description: "Three things on a counter. Take a closer look." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
