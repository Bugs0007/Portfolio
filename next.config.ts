import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All four corners carry navigation; keep the dev badge off those controls.
  devIndicators: false,
  images: {
    // Preserve the supplied photo/screenshot bytes, dimensions and format.
    // Loading stays lazy; quality is never traded away for a smaller derivative.
    unoptimized: true,
  },
};

export default nextConfig;
