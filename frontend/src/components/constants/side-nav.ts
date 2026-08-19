import { PuzzleIcon, LogInIcon, LogOutIcon, SettingsIcon, TrophyIcon, HomeIcon, BotIcon, AwardIcon, SparklesIcon } from 'lucide-react';
import { getBackendUrl } from '../../config';

export const UpperNavItems = [
  {
    title: 'Home',
    icon: HomeIcon,
    href: '/',
    color: 'text-green-500',
  },
  {
    title: 'Play Online',
    icon: PuzzleIcon,
    href: '/game/random',
    color: 'text-emerald-400',
  },
  {
    title: 'Computer',
    icon: BotIcon,
    href: '/computer',
    color: 'text-cyan-400',
  },
  {
    title: 'Tournaments',
    icon: AwardIcon,
    href: '/tournaments',
    color: 'text-amber-400',
  },
  {
    title: 'Variants',
    icon: SparklesIcon,
    href: '/variants',
    color: 'text-purple-400',
  },
  {
    title: 'Leaderboard',
    icon: TrophyIcon,
    href: '/leaderboard',
    color: 'text-yellow-400',
  },
];

export const LowerNavItems = [
  {
    title: 'Login',
    icon: LogInIcon,
    href: '/login',
    color: 'text-green-500',
  },
  {
    title: 'Logout',
    icon: LogOutIcon,
    href: `${getBackendUrl()}/auth/logout`,
    color: 'text-red-400',
  },
  {
    title: 'Settings',
    icon: SettingsIcon,
    href: '/settings/themes',
    color: 'text-stone-400',
  },
];
