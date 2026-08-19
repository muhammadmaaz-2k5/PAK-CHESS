export interface Theme {
  name: string;
  className: string;
  darkColor: string;
  lightColor: string;
}

export const THEMES: Theme[] = [
  {
    name: 'Green',
    className: 'green',
    darkColor: '#739552',
    lightColor: '#ebecd0',
  },
  {
    name: 'Wood',
    className: 'wood',
    darkColor: '#b58863',
    lightColor: '#f0d9b5',
  },
  {
    name: 'Glass',
    className: 'glass',
    darkColor: '#4b7399',
    lightColor: '#eae9d2',
  },
  {
    name: 'Ocean',
    className: 'ocean',
    darkColor: '#407b9a',
    lightColor: '#cde6e9',
  },
  {
    name: 'Dark Neon',
    className: 'dark-neon',
    darkColor: '#2b2b2b',
    lightColor: '#4a4a4a',
  },
];
