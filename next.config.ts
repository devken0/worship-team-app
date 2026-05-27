import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow testing the dev server from phones on the LAN. Next.js blocks
  // cross-origin requests to dev-only assets by default, which prevents
  // client JS from hydrating when you open the app via the machine's LAN IP
  // (so taps like the YouTube play button do nothing). Add your LAN subnet.
  allowedDevOrigins: ["192.168.10.56", "192.168.10.*"],
};

export default nextConfig;
