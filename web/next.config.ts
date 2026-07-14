import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Prisma as a real node require in server routes instead of letting the
  // bundler inline the wasm/edge client, which has no native query engine and
  // fails with P6001 ("the URL must start with the protocol prisma://").
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
