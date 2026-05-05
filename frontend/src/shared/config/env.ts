const n = import.meta.env;

export const env = {
  DEV: n.DEV as boolean,
  API_BASE_URL: (n.VITE_API_URL ?? '/api') as string,
  AUTH_MODE: (n.VITE_AUTH_MODE ?? '') as string,
  USE_MSW: (n.VITE_USE_MSW ?? '') as string,
} as const;
