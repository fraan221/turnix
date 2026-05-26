/** @type {import("next").NextConfig} */
module.exports = {
  output: "standalone",
  serverExternalPackages: ["pdfkit"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/overcoming-',
        destination: "/overcoming",
        permanent: true,
      },
    ];
  },
  allowedDevOrigins: ["sections-nelson-show-course.trycloudflare.com"],
};
