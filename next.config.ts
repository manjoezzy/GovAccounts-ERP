import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: For Vercel deployment, do NOT set output: "standalone".
  // Only add it back if deploying to a VPS / Docker.
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "@prisma/client",
    "prisma",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
