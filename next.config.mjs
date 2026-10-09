/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "agentproject-three.vercel.app",
        pathname: "/runaki-logo.jpeg",
      },
    ],
  },
};

export default nextConfig;
