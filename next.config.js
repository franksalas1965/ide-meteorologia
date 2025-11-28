//@type {import('next').NextConfig} 
const nextConfig = {
  // Configuración básica
  output: process.env.NEXT_OUTPUT || "standalone",
  reactStrictMode: true,
  transpilePackages: ["@mui/material", "@mui/icons-material"],

  // Configuración para imágenes
  images: {
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "true",
    domains: process.env.NEXT_IMAGE_DOMAINS
      ? process.env.NEXT_IMAGE_DOMAINS.split(",")
      : [],
    remotePatterns: [
      {
        protocol: process.env.NEXT_IMAGE_PROTOCOL || "http",
        hostname: process.env.NEXT_IMAGE_HOSTNAME || "localhost",
        port: process.env.NEXT_IMAGE_PORT || "8080",
        pathname: process.env.NEXT_IMAGE_PATHNAME || "/geoserver/**",
      },
    ],
    disableStaticImages: true,
  },

  // Rewrites para GeoServer (configurables via env)
  async rewrites() {
    const rewrites = [];

    // GeoCuba proxies
    if (process.env.GEOGUBA_BASE_URL) {
      rewrites.push(
        {
          source: "/proxy/geocuba/:path*",
          destination: `${process.env.GEOGUBA_BASE_URL}/:path*`,
        },
        {
          source: "/proxy/geocuba/geoserver/:path*",
          destination: `${process.env.GEOGUBA_BASE_URL}/geoserver/:path*`,
        }
      );
    }

    // Mapas GeoCuba
    if (process.env.MAPAS_GEOGUBA_URL) {
      rewrites.push(
        {
          source: "/proxy/mapas.geocuba.cu/geoserver/:path*",
          destination: `${process.env.MAPAS_GEOGUBA_URL}/geoserver/:path*`,
        },
        {
          source: "/proxy/mapas.geocuba.cu/mrgeo/productos/sentinel_nc/:path*",
          destination: `${process.env.MAPAS_GEOGUBA_URL}/mrgeo/productos/sentinel_nc/:path*`,
        }
      );
    }

    // MINAG GeoCuba
    if (process.env.MINAG_GEOGUBA_URL) {
      rewrites.push({
        source: "/proxy/minag.geocuba.cu/geoserver/:path*",
        destination: `${process.env.MINAG_GEOGUBA_URL}/geoserver/:path*`,
      });
    }

    // GeoServer local
    if (process.env.GEOSERVER_URL) {
      rewrites.push({
        source: "/geoserver/catastro/:path*",
        destination: `${process.env.GEOSERVER_URL}/:path*`,
      });
    }

    // Servicios meteorológicos (si necesitan proxy)
    if (process.env.OPENWEATHER_PROXY_URL) {
      rewrites.push({
        source: "/proxy/openweather/:path*",
        destination: `${process.env.OPENWEATHER_PROXY_URL}/:path*`,
      });
    }

    if (process.env.RAINVIEWER_PROXY_URL) {
      rewrites.push({
        source: "/proxy/rainviewer/:path*",
        destination: `${process.env.RAINVIEWER_PROXY_URL}/:path*`,
      });
    }

    return rewrites;
  },

  // Headers para APIs espaciales
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type,Authorization",
          },
        ],
      },
      {
        source: "/proxy/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },

  // Optimizaciones para Leaflet
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
      use: [
        {
          loader: "url-loader",
          options: {
            limit: 8192,
            publicPath: "/_next/static/images",
            outputPath: "static/images/",
            name: "[name]-[hash].[ext]",
          },
        },
      ],
    });

    if (isServer) {
      config.externals.push("leaflet");
    }

    return config;
  },

  // Configuración experimental
  experimental: {
    serverActions: true,
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },

  // Variables de entorno que se exponen al cliente
  env: {
    NEXT_PUBLIC_OPENWEATHER_API_KEY:
      process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
    NEXT_PUBLIC_GEOSERVER_URL: process.env.NEXT_PUBLIC_GEOSERVER_URL,
    NEXT_PUBLIC_CONFIG_URL: process.env.NEXT_PUBLIC_CONFIG_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  },
};

module.exports = nextConfig;
