/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  webpack: (config) => {
    // fabric's node build requires 'canvas'; we only use it in the browser
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};
export default nextConfig;
