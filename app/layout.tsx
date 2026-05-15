import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://draft-career.vercel.app";
const themeScript = `
  (() => {
    try {
      const storedTheme = localStorage.getItem("draftcareer-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = storedTheme || (prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "DraftCareer",
  title: {
    default: "DraftCareer - Free Resume Builder and ATS Resume Maker",
    template: "%s | DraftCareer"
  },
  description: "Build a professional resume for free with DraftCareer. Choose ATS-friendly resume templates, preview instantly, save your resume, and export a polished PDF.",
  keywords: [
    "free resume builder",
    "resume maker",
    "ATS resume builder",
    "resume templates",
    "free CV maker",
    "online resume builder",
    "professional resume builder",
    "download resume PDF"
  ],
  authors: [{ name: "DraftCareer" }],
  creator: "DraftCareer",
  publisher: "DraftCareer",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DraftCareer",
    title: "DraftCareer - Free Resume Builder and ATS Resume Maker",
    description: "Create an ATS-friendly resume online with free templates, live preview, saved resume history, and PDF export.",
    images: [
      {
        url: "/icon.svg",
        width: 64,
        height: 64,
        alt: "DraftCareer logo"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "DraftCareer - Free Resume Builder",
    description: "Build an ATS-friendly resume online and export a polished PDF.",
    images: ["/icon.svg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  category: "resume builder"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster richColors duration={1800} position="top-right" />
      </body>
    </html>
  );
}
