import { atom } from 'recoil';

export interface UserState {
  id: string;
  name: string;
  token?: string;
  isGuest?: boolean;
  rating?: number;
}

export const userAtom = atom<UserState | null>({
  key: 'userAtom',
  default: (() => {
    // Check localStorage fallback
    try {
      const saved = localStorage.getItem('chess_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  })(),
});
