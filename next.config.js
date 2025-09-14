/** @type {import("next").NextConfig} */
module.exports = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/overcoming-',
        destination: '/overcoming',
        permanent: true,
      },
    ]
  },
}
