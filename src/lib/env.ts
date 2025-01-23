export const getBaseUrl = () => {
  // For Cloudflare Pages
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_BASE_PATH || "/";
  }
  return "/";
};
