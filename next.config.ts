import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only. The default bottom-left badge sits on top of BackToTop, and the
  // other bottom corner holds SectionNav's menu button below lg. Both top
  // corners are clear of the site's fixed controls; top-right would cover the
  // top end of the ScrollProgress rail.
  devIndicators: {
    position: "top-left",
  },
  images: {
    qualities: [75, 80],
  },
};

export default nextConfig;
