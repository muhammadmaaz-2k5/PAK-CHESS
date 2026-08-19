import { Move } from 'chess.js';
import { useEffect, useRef } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  isBoardFlippedAtom,
  movesAtom,
  userSelectedMoveIndexAtom,
} from '../store/atoms/chessBoard';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const MovesTable = () => {
  const [userSelectedMoveIndex, setUserSelectedMoveIndex] = useRecoilState(
    userSelectedMoveIndexAtom,
  );
  const setIsFlipped = useSetRecoilState(isBoardFlippedAtom);
  const moves = useRecoilValue(movesAtom);
  const movesTableRef = useRef<HTMLDivElement>(null);

  const movesArray = moves.reduce((result, _, index: number, array: Move[]) => {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, [] as Move[][]);

  useEffect(() => {
    if (movesTableRef && movesTableRef.current) {
      movesTableRef.current.scrollTo({
        top: movesTableRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [moves]);

  return (
    <div className="text-textSecondary relative w-full flex flex-col h-full bg-bgDark rounded-xl overflow-hidden border border-white/5 shadow-inner">
      <div className="px-4 py-3 bg-bgAuxiliary border-b border-white/10 font-bold text-sm text-textMain flex items-center justify-between">
        <span>Move History</span>
        <span className="text-xs text-textSecondary font-normal">{moves.length} moves played</span>
      </div>

      <div
        className="text-sm flex-1 max-h-[300px] md:max-h-[360px] overflow-y-auto"
        ref={movesTableRef}
      >
        {movesArray.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8 text-xs text-textSecondary italic">
            Moves will appear here as you play
          </div>
        ) : (
          movesArray.map((movePairs, index) => {
            return (
              <div
                key={index}
                className={`w-full py-1.5 px-4 font-mono flex items-center text-sm border-b border-white/[0.03] ${
                  index % 2 !== 0 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <span className="w-10 text-stone-500 font-semibold">{`${index + 1}.`}</span>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {movePairs.map((move, movePairIndex) => {
                    const currentIndex = index * 2 + movePairIndex;
                    const isLastIndex = currentIndex === moves.length - 1;
                    const isHighlighted =
                      userSelectedMoveIndex !== null
                        ? userSelectedMoveIndex === currentIndex
                        : isLastIndex;

                    return (
                      <div
                        key={movePairIndex}
                        className={`cursor-pointer px-2 py-1 rounded transition-colors flex items-center justify-between ${
                          isHighlighted
                            ? 'bg-green-600/30 text-green-400 font-bold'
                            : 'hover:bg-white/10 text-textMain'
                        }`}
                        onClick={() => {
                          setUserSelectedMoveIndex(currentIndex);
                        }}
                      >
                        <span>{move.san}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {moves.length > 0 && (
        <div className="w-full p-2.5 bg-bgAuxiliary border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => setIsFlipped((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-textSecondary hover:text-white transition-colors bg-stone-700/60 px-2.5 py-1.5 rounded"
            title="Flip the board"
          >
            <RefreshCw size={14} />
            <span>Flip</span>
          </button>

          <div className="flex gap-1 items-center">
            <button
              onClick={() => setUserSelectedMoveIndex(0)}
              disabled={userSelectedMoveIndex === 0}
              className="p-1.5 hover:text-white text-textSecondary disabled:opacity-30 rounded hover:bg-white/10"
              title="First move"
            >
              <ChevronFirst size={18} />
            </button>
            <button
              onClick={() => {
                setUserSelectedMoveIndex((prev) =>
                  prev !== null ? Math.max(0, prev - 1) : Math.max(0, moves.length - 2),
                );
              }}
              disabled={userSelectedMoveIndex === 0}
              className="p-1.5 hover:text-white text-textSecondary disabled:opacity-30 rounded hover:bg-white/10"
              title="Previous move"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => {
                setUserSelectedMoveIndex((prev) =>
                  prev !== null ? Math.min(moves.length - 1, prev + 1) : null,
                );
              }}
              disabled={userSelectedMoveIndex === null || userSelectedMoveIndex === moves.length - 1}
              className="p-1.5 hover:text-white text-textSecondary disabled:opacity-30 rounded hover:bg-white/10"
              title="Next move"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setUserSelectedMoveIndex(moves.length - 1)}
              disabled={userSelectedMoveIndex === null || userSelectedMoveIndex === moves.length - 1}
              className="p-1.5 hover:text-white text-textSecondary disabled:opacity-30 rounded hover:bg-white/10"
              title="Current move"
            >
              <ChevronLast size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovesTable;
