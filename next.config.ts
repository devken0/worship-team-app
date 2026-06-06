import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained `.next/standalone` server (server.js + only the
  // traced node_modules) so the Docker runtime image needs no `npm install`.
  // See Dockerfile.
  output: "standalone",

  // Allow testing the dev server from phones on the LAN. Next.js blocks
  // cross-origin requests to dev-only assets by default, which prevents
  // client JS from hydrating when you open the app via the machine's LAN IP
  // (so taps like the YouTube play button do nothing). Add your LAN subnet.
  allowedDevOrigins: ["192.168.10.56", "192.168.10.*", "worship.jibie.duckdns.org."],
};

export default nextConfig;
