export const getBackendUrl = (): string => {
  if (import.meta.env.VITE_APP_BACKEND_URL) {
    return import.meta.env.VITE_APP_BACKEND_URL;
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://backend-kappa-six-97.vercel.app';
  }
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `${protocol}//${hostname}:3000`;
};

export const getWsUrl = (): string => {
  if (import.meta.env.VITE_APP_WS_URL) {
    return import.meta.env.VITE_APP_WS_URL;
  }
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // If on Vercel and no external WebSocket server is configured
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    // Vercel serverless functions do not host persistent WebSockets on port 8080.
    // Use configured VITE_WS_URL or fallback gracefully to local/custom host.
    console.warn(
      '[Pak Chess] For online multiplayer on Vercel, set VITE_WS_URL in Vercel Environment Variables pointing to your persistent WS server (e.g. on Render, Railway, or EC2).'
    );
  }

  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `${protocol}//${hostname}:8080`;
};
