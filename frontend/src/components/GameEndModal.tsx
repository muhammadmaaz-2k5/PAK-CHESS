import React, { useState } from 'react';
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';
import { Player } from './UserAvatar';

export enum Result {
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
}

export interface GameResult {
  result: Result;
  by?: string;
  status?: string;
}

interface ModalProps {
  blackPlayer?: Player;
  whitePlayer?: Player;
  gameResult: GameResult;
  onNewGame?: () => void;
}

const GameEndModal: React.FC<ModalProps> = ({
  blackPlayer,
  whitePlayer,
  gameResult,
  onNewGame,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { width, height } = useWindowSize();

  const closeModal = () => {
    setIsOpen(false);
  };

  const isWhiteWinner = gameResult.result === Result.WHITE_WINS;
  const isBlackWinner = gameResult.result === Result.BLACK_WINS;
  const isDraw = gameResult.result === Result.DRAW;

  const PlayerDisplay = ({
    player,
    isWhite,
  }: {
    player?: Player;
    isWhite: boolean;
  }) => {
    const isWinner = isWhite ? isWhiteWinner : isBlackWinner;
    const borderColor = isDraw
      ? 'border-amber-400'
      : isWinner
      ? 'border-green-400 shadow-green-500/50 shadow-lg'
      : 'border-stone-600 opacity-70';

    return (
      <div className="flex flex-col items-center">
        <div className={`border-4 rounded-full p-2.5 bg-stone-900 transition-all ${borderColor}`}>
          <img
            src={isWhite ? '/wk.png' : '/bk.png'}
            alt={`${isWhite ? 'White' : 'Black'} King`}
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="text-center mt-2">
          <p className="text-white font-semibold text-sm truncate max-w-[100px]">
            {player?.name || (isWhite ? 'White' : 'Black')}
          </p>
          {player?.rating ? (
            <p className="text-xs text-textSecondary">{player.rating}</p>
          ) : null}
        </div>
      </div>
    );
  };

  const getWinnerMessage = (result: Result) => {
    switch (result) {
      case Result.BLACK_WINS:
        return 'Black Wins!';
      case Result.WHITE_WINS:
        return 'White Wins!';
      default:
        return "It's a Draw!";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {!isDraw && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>
        <div className="relative rounded-2xl shadow-2xl bg-bgAuxiliary border border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 text-center">
            <div className="mb-4">
              <h2 className="text-4xl font-extrabold text-yellow-400 tracking-wide drop-shadow-md">
                {getWinnerMessage(gameResult.result)}
              </h2>
              {gameResult.by && (
                <p className="text-sm font-medium text-textSecondary mt-1">
                  by {gameResult.by}
                </p>
              )}
            </div>

            <div className="flex justify-around items-center bg-bgDark/80 border border-white/5 rounded-xl p-6 my-6">
              <PlayerDisplay isWhite={true} player={whitePlayer} />
              <div className="text-xl font-bold text-textSecondary">VS</div>
              <PlayerDisplay isWhite={false} player={blackPlayer} />
            </div>

            <div className="flex gap-3 justify-center mt-6">
              {onNewGame && (
                <button
                  className="px-6 py-3 text-white font-bold bg-green-600 hover:bg-green-500 rounded-lg shadow-lg hover:shadow-green-600/30 transition-all flex-1"
                  onClick={() => {
                    closeModal();
                    onNewGame();
                  }}
                >
                  New Game
                </button>
              )}
              <button
                className="px-6 py-3 text-textSecondary hover:text-white bg-stone-700 hover:bg-stone-600 rounded-lg font-medium transition-all"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameEndModal;
