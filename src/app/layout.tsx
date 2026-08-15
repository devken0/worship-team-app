import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import ToastProvider from "@/components/ToastProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { themeInitScript } from "@/lib/theme";

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
  // No `themeColor` here on purpose. The status bar has to follow the user's
  // saved Light/Dark/Auto choice rather than the OS, so the pre-paint script
  // below owns the <meta> tag entirely — see `src/lib/theme.ts`. Declaring it
  // here as well produces two conflicting tags after hydration.
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
        {/* Visible only when focused. Lets keyboard users jump past the sticky
            header and straight to the page content. Targets the `id="main"` on
            the shared `Page` wrapper. */}
        <a
          href="#main"
          className="sr-only rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <ServiceWorkerRegister />
        <ToastProvider>
          <div className="flex-1">{children}</div>
          {showNav && <BottomNav isAdmin={isAdmin} />}
        </ToastProvider>
      </body>
    </html>
  );
}
