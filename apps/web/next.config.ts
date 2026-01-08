import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@boxtrack/shared", "@boxtrack/ui"],
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
