import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules must not be bundled.
  serverExternalPackages: ["better-sqlite3", "sharp"],
  output: "standalone",
};

export default nextConfig;
