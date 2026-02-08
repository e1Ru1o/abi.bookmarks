// @ts-check
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { withPlausibleProxy } from "next-plausible";
import path from "path";
import { fileURLToPath } from "url";

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
    // viem must be transpiled in production to avoid EMFILE on Vercel serverless,
    // but breaks dev mode due to @safe-global's nested viem CJS using import.meta
    ...(process.env.NODE_ENV === "production" ? ["viem"] : []),
  ],
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

export default withPlausibleProxy()(nextConfig);
