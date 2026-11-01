import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules must not be bundled.
  serverExternalPackages: ["better-sqlite3", "sharp"],
  output: "standalone",
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
