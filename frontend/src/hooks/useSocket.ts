import { useEffect, useState, useRef } from 'react';
import { useUser } from '../store/hooks/useUser';
import { getWsUrl } from '../config';

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const user = useUser();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = getWsUrl();
    const token = user?.token || localStorage.getItem('chess_jwt_token') || '';
    const connectUrl = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    let isUnmounted = false;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        const ws = new WebSocket(connectUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isUnmounted) {
            console.log('[Socket] Connected successfully to', connectUrl);
            setSocket(ws);
          }
        };

        ws.onclose = (event) => {
          if (!isUnmounted) {
            console.warn('[Socket] Disconnected from server (code:', event.code, ') - will retry...');
            setSocket(null);
            reconnectTimeout = setTimeout(connect, 2000);
          }
        };

        ws.onerror = (err) => {
          console.warn('[Socket] Connection error:', err);
        };
      } catch (err) {
        console.error('[Socket] Failed to initialize WebSocket:', err);
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      }
    };

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.token, user?.id]);

  return socket;
};
