import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import ToastProvider from "@/components/ToastProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { THEME_COLORS, themeInitScript } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Worship Team",
    template: "%s · Worship Team",
  },
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
  // A single, unconditional theme-color. The pre-paint script below rewrites it
  // to match the user's saved Light/Dark/Auto choice — a media-query pair here
  // would follow the OS instead, so Dark-in-app on a light phone would leave a
  // light status bar. See `src/lib/theme.ts`.
  themeColor: THEME_COLORS.light,
  width: "device-width",
  initialScale: 1,
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Resolve the saved Light/Dark/System theme before first paint so there
            is no flash of the wrong theme. Mirrors the logic in ThemeToggle. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ServiceWorkerRegister />
        <ToastProvider>
          <div className="flex-1">{children}</div>
          {showNav && <BottomNav isAdmin={isAdmin} />}
        </ToastProvider>
      </body>
    </html>
  );
}
