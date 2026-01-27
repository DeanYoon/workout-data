import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, ThemeProvider, I18nProvider, BottomNavigation, ErrorBoundary, AutoInstallPrompt } from "@/components";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Fitness App",
    description: "Track your workout and progress",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Fitness App",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/icon.png", sizes: "32x32", type: "image/png" },
            { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
            { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
            { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
            { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
            { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
            { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
            { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        shortcut: [
            { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
        ],
        apple: [
            { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
            { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        ],
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}
            >
                <ThemeProvider>
                    <I18nProvider>
                        <ErrorBoundary>
                            <AuthProvider>
                                <div className="mx-auto min-h-screen max-w-md bg-white shadow-2xl dark:bg-black dark:shadow-zinc-900/20">
                                    <main className="min-h-screen pb-20">
                                        {children}
                                    </main>
                                    <BottomNavigation />
                                    <AutoInstallPrompt />
                                </div>
                            </AuthProvider>
                        </ErrorBoundary>
                    </I18nProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}



