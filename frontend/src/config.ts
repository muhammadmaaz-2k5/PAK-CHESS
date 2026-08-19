export const getBackendUrl = (): string => {
  if (import.meta.env.VITE_APP_BACKEND_URL) {
    return import.meta.env.VITE_APP_BACKEND_URL;
  }
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `${protocol}//${hostname}:3000`;
};

export const getWsUrl = (): string => {
  if (import.meta.env.VITE_APP_WS_URL) {
    return import.meta.env.VITE_APP_WS_URL;
  }
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `${protocol}//${hostname}:8080`;
};
