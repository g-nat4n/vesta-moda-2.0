import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com https://www.mercadopago.com https://www.mercadopago.com.br",
              "style-src 'self' 'unsafe-inline' https://http2.mlstatic.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com https://http2.mlstatic.com",
              "connect-src 'self' https://api.mercadopago.com https://www.mercadopago.com https://www.mercadopago.com.br https://http2.mlstatic.com",
              "frame-src 'self' https://www.mercadopago.com https://www.mercadopago.com.br https://http2.mlstatic.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://www.mercadopago.com https://www.mercadopago.com.br",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
