import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@boxtrack/shared", "@boxtrack/ui", "react-qr-code"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
