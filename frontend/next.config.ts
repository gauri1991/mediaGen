import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR WebSocket connections from LAN IPs so React hydrates
  // correctly when the app is accessed from devices other than localhost.
  allowedDevOrigins: ['192.168.1.34'],
};

export default nextConfig;
