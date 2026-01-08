import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@boxtrack/shared",
    "@boxtrack/ui",
    "react-qr-code",
    // React Native Web support
    "react-native",
    "react-native-web",
    "react-native-svg",
    // gluestack-ui packages
    "@gluestack-ui/core",
    "@gluestack-ui/overlay",
    "@gluestack-ui/utils",
    "@legendapp/motion",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      // Alias react-native to react-native-web
      "react-native": "react-native-web",
    },
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ".tsx",
      ".ts",
      ".js",
      ".json",
    ],
  },
  // Webpack fallback for compatibility (e.g., custom builds)
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web",
    };
    config.resolve.extensions = [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ".tsx",
      ".ts",
      ".js",
      ...config.resolve.extensions.filter(
        (ext: string) => !ext.includes(".native")
      ),
    ];
    return config;
  },
};

export default nextConfig;
