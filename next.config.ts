import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the filesystem root to this project. Without it Turbopack walks up and
  // picks a stray lockfile in a parent directory as the workspace root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
