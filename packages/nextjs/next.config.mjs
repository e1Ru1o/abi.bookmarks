// @ts-check
// eslint-disable-next-line @typescript-eslint/no-var-requires
import path from "path";
import { fileURLToPath } from "url";
import { withPlausibleProxy } from "next-plausible";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo: trace from the repo root for efficient serverless function bundles
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  transpilePackages: [
    "@rainbow-me/rainbowkit",
    "@vanilla-extract/css",
    "@vanilla-extract/dynamic",
    "@vanilla-extract/sprinkles",
    "viem",
  ],
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

export default withPlausibleProxy()(nextConfig);
