// API URL - v produkci směřuje na Workers, v dev módu používá Vite proxy
export const API_BASE = import.meta.env.PROD
  ? 'https://progressor-api.zandl.workers.dev'
  : ''
