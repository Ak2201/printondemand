/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // fabric's node build requires 'canvas'; we only use it in the browser
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};
export default nextConfig;
