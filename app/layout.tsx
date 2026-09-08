// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://leanquest.github.io"),
  title: "LeanQuest — The Proof Dungeon",
  description:
    "Choose Champion or Apprentice and battle through 55 paired Lean proof lessons using terms or tactics.",
  icons: {
    icon: "/assets/cc0_images/favicon.svg",
    shortcut: "/assets/cc0_images/favicon.svg",
  },
  openGraph: {
    title: "LeanQuest",
    description: "Choose your proof path and defeat 55 dungeon guardians with Lean.",
    images: [{ url: "/assets/cc0_images/og-v0.1.2.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LeanQuest — The Proof Dungeon",
    description: "Master term or tactic proofs across two complete dungeon campaigns.",
    images: ["/assets/cc0_images/og-v0.1.2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
