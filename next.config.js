/** @type {import("next").NextConfig} */
module.exports = {
  output: "standalone",

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
