import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Stride — your health, in rhythm", description: "A personal space for strength, food and recovery.", manifest: "/manifest.json" };
export const viewport: Viewport = { themeColor: "#f6f6f2", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
