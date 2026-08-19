import { atom } from 'recoil';

export const isBoardFlippedAtom = atom<boolean>({
  key: 'isBoardFlippedAtom',
  default: false,
});

export const movesAtom = atom<any[]>({
  key: 'movesAtom',
  default: [],
});

export const userSelectedMoveIndexAtom = atom<number | null>({
  key: 'userSelectedMoveIndexAtom',
  default: null,
});
