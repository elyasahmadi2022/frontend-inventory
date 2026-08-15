import type { NextConfig } from "next";
import path from "path";

function normalizeApiProxyTarget(value?: string) {
  const target = value
    ?.trim()
    .replace(/^["'`[\s]+|["'`\]\s]+$/g, "")
    .replace(/\/$/, "");

  if (!target) return undefined;
  if (target.startsWith("http://") || target.startsWith("https://")) {
    return target;
  }
  return `https://${target}`;
}

const apiProxyTarget =
  normalizeApiProxyTarget(process.env.API_PROXY_TARGET) ||
  normalizeApiProxyTarget(process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:4000";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Keeps Turbopack rooted in this app when a parent directory also has a lockfile.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiProxyTarget}/uploads/:path*`,
      },
      {
        source: "/health",
        destination: `${apiProxyTarget}/health`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
