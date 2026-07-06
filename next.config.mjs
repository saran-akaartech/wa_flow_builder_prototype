/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fonts are loaded via <link> in app/layout.tsx and render client-side.
  // Disabling build-time font inlining keeps builds fast and offline-safe.
  optimizeFonts: false,
};
export default nextConfig;
