import { ReactNode, MouseEventHandler } from 'react';

interface GameModeProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  disabled?: boolean;
}

const GameModeComponent = ({
  icon,
  title,
  description,
  onClick,
  disabled = false,
}: GameModeProps) => (
  <div
    onClick={disabled ? undefined : onClick}
    className={`bg-bgAuxiliary flex items-start space-x-4 rounded-xl p-4 transition-all duration-200 border border-white/5 shadow-md ${
      disabled
        ? 'opacity-60 cursor-not-allowed'
        : 'cursor-pointer hover:bg-stone-700/50 hover:border-white/10 hover:translate-x-1'
    }`}
  >
    <div className="p-2 rounded-lg bg-bgDark border border-white/5">{icon}</div>

    <div className="space-y-1 flex-1">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-textMain">{title}</p>
        {disabled && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
            Coming Soon
          </span>
        )}
      </div>
      <p className="text-xs text-textSecondary">{description}</p>
    </div>
  </div>
);

export default GameModeComponent;
