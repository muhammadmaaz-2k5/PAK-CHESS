import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { userAtom, UserState } from '../atoms/user';
import { getBackendUrl } from '../../config';

export const useUser = (): UserState | null => {
  const [user, setUser] = useRecoilState(userAtom);

  useEffect(() => {
    // If user with token is already loaded in memory
    if (user && user.token) return;

    // Check localStorage first
    const savedUserJson = localStorage.getItem('chess_user');
    const savedToken = localStorage.getItem('chess_jwt_token');

    if (savedUserJson && savedToken) {
      try {
        const parsed = JSON.parse(savedUserJson);
        if (parsed && parsed.token) {
          setUser(parsed);
          return;
        }
      } catch (e) {}
    }

    const initUser = async () => {
      const backendUrl = getBackendUrl();
      try {
        const token = savedToken || user?.token;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // 1. Try refreshing session
        const res = await fetch(`${backendUrl}/auth/refresh`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          const userData: UserState = {
            id: data.id,
            name: data.name || 'Chess Player',
            token: data.token || token || '',
            isGuest: data.isGuest,
            rating: data.rating || 1200,
          };
          setUser(userData);
          if (data.token) {
            localStorage.setItem('chess_jwt_token', data.token);
          }
          localStorage.setItem('chess_user', JSON.stringify(userData));
          return;
        }

        // 2. If no valid session, auto-provision guest account
        const guestName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
        const guestRes = await fetch(`${backendUrl}/auth/guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: guestName }),
        });

        if (guestRes.ok) {
          const guestData = await guestRes.json();
          const userData: UserState = {
            id: guestData.id,
            name: guestData.name || guestName,
            token: guestData.token || '',
            isGuest: true,
            rating: guestData.rating || 1200,
          };
          setUser(userData);
          if (guestData.token) {
            localStorage.setItem('chess_jwt_token', guestData.token);
          }
          localStorage.setItem('chess_user', JSON.stringify(userData));
        }
      } catch (err) {
        console.warn('[useUser] Failed to authenticate user, using client-side guest:', err);
        // Fallback client guest if backend unreachable
        const fallbackGuest: UserState = {
          id: 'guest_' + Math.random().toString(36).substring(2, 9),
          name: 'Guest Player',
          token: 'guest_token',
          isGuest: true,
          rating: 1200,
        };
        setUser(fallbackGuest);
      }
    };

    initUser();
  }, []);

  return user;
};
