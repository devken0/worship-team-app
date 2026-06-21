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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#17150f" },
  ],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
        <ServiceWorkerRegister />
        <ToastProvider>
          <div className="flex-1">{children}</div>
          {showNav && <BottomNav isAdmin={isAdmin} />}
        </ToastProvider>
      </body>
    </html>
  );
}
