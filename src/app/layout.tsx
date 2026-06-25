import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/Toast";

const playfair = Playfair_Display({
  subsets: ["cyrillic", "latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Запрошення ✦",
  description: "Створюйте та надсилайте запрошення на зустрічі. Безкоштовний додаток українською.",
};

export const viewport = {
  themeColor: "#c9922a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <script src="https://unpkg.com/@phosphor-icons/web@2.1.1" async></script>
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main id="app">{children}</main>
          <BottomNav />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
