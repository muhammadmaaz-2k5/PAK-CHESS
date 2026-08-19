import { useUser } from '../store/hooks/useUser';

export interface Player {
  id: string;
  name: string;
  isGuest?: boolean;
  rating?: number;
}

export interface Metadata {
  blackPlayer: Player;
  whitePlayer: Player;
}

interface UserAvatarProps {
  gameMetadata: Metadata | null;
  self?: boolean;
}

export const UserAvatar = ({ gameMetadata, self }: UserAvatarProps) => {
  const user = useUser();
  if (!gameMetadata) return null;

  let player: Player;
  if (gameMetadata.blackPlayer?.id === user?.id) {
    player = self ? gameMetadata.blackPlayer : gameMetadata.whitePlayer;
  } else {
    player = self ? gameMetadata.whitePlayer : gameMetadata.blackPlayer;
  }

  return (
    <div className="text-textMain flex items-center gap-2 font-medium">
      <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center text-xs font-bold text-white border border-white/10">
        {player?.name?.charAt(0)?.toUpperCase() || 'P'}
      </div>
      <p>{player?.name || 'Anonymous'}</p>
      {player?.rating ? (
        <span className="text-xs text-textSecondary font-normal">({player.rating})</span>
      ) : null}
      {player?.isGuest && <span className="text-xs text-amber-500/80">[Guest]</span>}
    </div>
  );
};
