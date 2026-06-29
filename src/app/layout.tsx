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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://zaproshenya.site'),
  title: {
    default: "Запрошення ✦ Безкоштовне створення запрошень",
    template: "%s | Запрошення ✦"
  },
  description: "Надсилайте красиві запрошення з датою, часом і місцем. Отримуйте чіткі відповіді — без «ну давай якось» у чаті. Безкоштовний додаток українською. Зареєструйтесь або увійдіть → zaproshenya.site",
  keywords: ["запрошення", "зустрічі", "запросити друга", "календар", "події", "кава", "побачення", "запрошення сайт"],
  authors: [{ name: "Запрошення" }],
  creator: "Запрошення",
  publisher: "Запрошення",
  alternates: {
    canonical: 'https://zaproshenya.site',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Запрошення ✦ Безкоштовне створення запрошень",
    description: "Надсилайте красиві запрошення з датою, часом і місцем. Отримуйте чіткі відповіді — без «ну давай якось» у чаті.",
    url: "https://zaproshenya.site",
    siteName: "Запрошення",
    locale: "uk_UA",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Запрошення ✦"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Запрошення ✦",
    description: "Надсилайте красиві запрошення з датою, часом і місцем. Отримуйте чіткі відповіді — без «ну давай якось» у чаті.",
    images: ["/icon.png"],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '96x96' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Запрошення",
              "alternateName": ["Запрошення ✦", "Zaproshenya"],
              "url": "https://zaproshenya.site",
              "description": "Надсилайте красиві запрошення з датою, часом і місцем.",
              "inLanguage": "uk",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://zaproshenya.site/login"
                },
                "query": "Увійти"
              }
            })
          }}
        />
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
