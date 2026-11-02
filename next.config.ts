import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules must not be bundled.
  serverExternalPackages: ["better-sqlite3", "sharp", "heic-convert", "pdfkit"],
  // Only the Docker image uses the standalone server; `next start` (e.g. under pm2) must not.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
