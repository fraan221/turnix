export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_SITE_URL || "https://hypeh.com.ar";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};
