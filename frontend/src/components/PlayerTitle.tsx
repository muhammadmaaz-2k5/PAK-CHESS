import { Player } from './UserAvatar';

interface PlayerTitleProps {
  player: Player | undefined;
  isSelf?: boolean;
}

export const PlayerTitle = ({ player, isSelf }: PlayerTitleProps) => {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-textMain">
      <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center text-xs font-bold text-white border border-white/10">
        {player?.name?.charAt(0)?.toUpperCase() || 'P'}
      </div>
      <p>{player?.name || 'Player'}</p>
      {player?.rating ? (
        <span className="text-xs text-textSecondary font-normal">({player.rating})</span>
      ) : null}
      {player && player.isGuest && (
        <span className="text-xs text-amber-500/80 font-normal">[Guest]</span>
      )}
      {isSelf && <span className="text-xs text-green-500 font-normal">(You)</span>}
    </div>
  );
};
