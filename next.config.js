/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Configuración básica de imágenes
  images: {
    unoptimized: true,
    domains: ["localhost"],
  },

  // Rewrites básicos (sin variables de entorno complejas)
  async rewrites() {
    return [
      {
        source: "/api/proxy/[...path]",
        destination: "/api/proxy/[...path]",
      },
    ];
  },

  // Headers básicos
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
        ],
      },
    ];
  },

  // Webpack simplificado
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
