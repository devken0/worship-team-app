import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import ToastProvider from "@/components/ToastProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Worship Team",
  description:
    "Schedules, assignments, songs, and recordings for our worship team.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Worship Team",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === "admin";
  // Hide the nav until onboarding is finished — a half-set-up user is pinned to
  // /welcome and shouldn't have tabs to wander off to before setting a password.
  const showNav = !!user && !!user.profile?.onboarded;

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <ToastProvider>
          <div className={`flex-1 ${showNav ? "has-bottom-nav" : ""}`}>
            {children}
          </div>
          {showNav && <BottomNav isAdmin={isAdmin} />}
        </ToastProvider>
      </body>
    </html>
  );
}
