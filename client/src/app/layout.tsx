import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VocaLearn",
  description:
    "Master any language with VocaLearn's revolutionary AI voice technology. Get instant corrections, practice natural conversations, and improve fluency faster than ever before.",
  keywords:
    "language learning, AI voice feedback, speech recognition, pronunciation training, conversation practice, multilingual education",
  authors: [{ name: "VocaLearn Team" }],
  creator: "VocaLearn",
  publisher: "VocaLearn",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://vocalearn.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VocaLearn - AI-Powered Language Learning",
    description:
      "Master any language with real-time AI voice feedback and natural conversations.",
    url: "https://vocalearn.com",
    siteName: "VocaLearn",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VocaLearn - AI-Powered Language Learning",
    description:
      "Master any language with real-time AI voice feedback and natural conversations.",
    creator: "@vocalearn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
