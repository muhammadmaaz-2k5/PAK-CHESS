import { useState, useEffect, useRef } from 'react';
import { Chess, Square, Move, Color } from 'chess.js';
import LetterNotation from '../components/chess-board/LetterNotation';
import LegalMoveIndicator from '../components/chess-board/LegalMoveIndicator';
import ChessSquare from '../components/chess-board/ChessSquare';
import NumberNotation from '../components/chess-board/NumberNotation';
import { Sparkles, RotateCcw, Swords, Shield, Crown, Bomb, Flame, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';

interface VariantInfo {
  id: string;
  name: string;
  icon: any;
  tagline: string;
  rules: string;
  color: string;
}

const VARIANTS: VariantInfo[] = [
  {
    id: 'standard',
    name: 'Standard Classical',
    icon: Swords,
    tagline: 'Standard chess rules and tournament time controls',
    rules: 'Checkmate the opponent king or run down their clock to achieve victory.',
    color: 'text-green-400',
  },
  {
    id: 'koth',
    name: 'King of the Hill',
    icon: Crown,
    tagline: 'Occupy the four center squares with your King',
    rules: 'In addition to standard checkmate, moving your King to d4, e4, d5, or e5 instantly wins the match!',
    color: 'text-yellow-400',
  },
  {
    id: 'three-check',
    name: 'Three-Check',
    icon: Flame,
    tagline: 'Deliver 3 checks to the opponent King to win',
    rules: 'Deliver check to the enemy King 3 times throughout the match to claim instant victory.',
    color: 'text-orange-400',
  },
  {
    id: 'chess960',
    name: 'Chess960 (Fischer Random)',
    icon: Sparkles,
    tagline: 'Randomized back-rank pieces setup',
    rules: 'Pieces on the 1st and 8th ranks are placed in a randomized configuration with opposite-colored bishops.',
    color: 'text-purple-400',
  },
];

export const Variants = () => {
  const [selectedVariant, setSelectedVariant] = useState<string>('koth');
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [moves, setMoves] = useState<Move[]>([]);
  const [from, setFrom] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [whiteChecks, setWhiteChecks] = useState(0);
  const [blackChecks, setBlackChecks] = useState(0);
  const [boxSize, setBoxSize] = useState<number>(68);

  const { width, height } = useWindowSize();
  const moveAudio = useRef<HTMLAudioElement | null>(null);
  const captureAudio = useRef<HTMLAudioElement | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    moveAudio.current = new Audio('/move.wav');
    captureAudio.current = new Audio('/capture.wav');

    const handleResize = () => {
      if (boardRef.current) {
        const available = Math.min(boardRef.current.parentElement?.clientWidth || 600, window.innerHeight - 200, 540);
        setBoxSize(Math.max(38, Math.floor((available - 20) / 8)));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetVariantGame = (variantId = selectedVariant) => {
    chess.reset();

    if (variantId === 'chess960') {
      // Generate randomized 960 rank
      const pieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'].sort(() => Math.random() - 0.5);
      const fenBackRank = pieces.join('');
      const customFen = `${fenBackRank}/pppppppp/8/8/8/8/PPPPPPPP/${fenBackRank.toUpperCase()} w KQkq - 0 1`;
      try {
        chess.load(customFen);
      } catch (e) {
        chess.reset();
      }
    }

    setBoard(chess.board());
    setMoves([]);
    setFrom(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameResult(null);
    setWhiteChecks(0);
    setBlackChecks(0);
  };

  const handleSquareClick = (squareRep: Square, squarePiece: any) => {
    if (gameResult) return;

    if (!from) {
      if (!squarePiece || squarePiece.color !== chess.turn()) return;
      setFrom(squareRep);
      setLegalMoves(chess.moves({ square: squareRep, verbose: true }).map((m) => m.to));
      return;
    }

    if (from === squareRep) {
      setFrom(null);
      setLegalMoves([]);
      return;
    }

    try {
      const moveResult = chess.move({
        from,
        to: squareRep,
        promotion: 'q',
      });

      if (moveResult) {
        if (moveResult.captured) {
          captureAudio.current?.play().catch(() => {});
        } else {
          moveAudio.current?.play().catch(() => {});
        }

        setMoves((prev) => [...prev, moveResult]);
        setBoard(chess.board());
        setLastMove({ from: moveResult.from, to: moveResult.to });
        setFrom(null);
        setLegalMoves([]);

        // 1. King of the Hill rule check
        if (selectedVariant === 'koth' && moveResult.piece === 'k') {
          const centerSquares = ['d4', 'e4', 'd5', 'e5'];
          if (centerSquares.includes(moveResult.to)) {
            const winner = moveResult.color === 'w' ? 'White' : 'Black';
            setGameResult(`👑 ${winner} Won by King of the Hill (Occupied Center)!`);
            return;
          }
        }

        // 2. Three-Check rule check
        if (selectedVariant === 'three-check' && chess.inCheck()) {
          if (moveResult.color === 'w') {
            const newCount = whiteChecks + 1;
            setWhiteChecks(newCount);
            if (newCount >= 3) {
              setGameResult('🔥 White Won by delivering 3 Checks!');
              return;
            }
          } else {
            const newCount = blackChecks + 1;
            setBlackChecks(newCount);
            if (newCount >= 3) {
              setGameResult('🔥 Black Won by delivering 3 Checks!');
              return;
            }
          }
        }

        // Standard Checkmate / Draw
        if (chess.isCheckmate()) {
          const winner = chess.turn() === 'w' ? 'Black' : 'White';
          setGameResult(`🏆 ${winner} Won by Checkmate!`);
        } else if (chess.isDraw()) {
          setGameResult('Draw by Stalemate / Rules');
        }
      }
    } catch (e) {
      if (squarePiece && squarePiece.color === chess.turn()) {
        setFrom(squareRep);
        setLegalMoves(chess.moves({ square: squareRep, verbose: true }).map((m) => m.to));
      } else {
        setFrom(null);
        setLegalMoves([]);
      }
    }
  };

  const currentVariant = VARIANTS.find((v) => v.id === selectedVariant) || VARIANTS[0];
  const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      {gameResult && <Confetti width={width} height={height} numberOfPieces={160} recycle={false} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-textSecondary hover:text-white transition-colors">
          <ChevronLeft size={16} /> Home
        </Link>
        <h1 className="text-2xl font-extrabold text-white">Chess Variants Arena</h1>
        <button
          onClick={() => resetVariantGame()}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-1.5"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Variant Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {VARIANTS.map((v) => {
          const isSelected = selectedVariant === v.id;
          const Icon = v.icon;

          return (
            <button
              key={v.id}
              onClick={() => {
                setSelectedVariant(v.id);
                resetVariantGame(v.id);
              }}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-br from-bgAuxiliary to-stone-900 border-green-500 shadow-lg shadow-green-500/10'
                  : 'bg-bgAuxiliary border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-xl bg-bgDark ${v.color}`}>
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">{v.name}</h3>
              </div>
              <p className="text-[11px] text-textSecondary line-clamp-2">{v.tagline}</p>
            </button>
          );
        })}
      </div>

      {/* Interactive Board Arena */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        <div className="flex flex-col items-center w-full lg:w-auto" ref={boardRef}>
          {/* Rules Banner */}
          <div className="w-full max-w-[540px] mb-3 bg-bgAuxiliary p-3.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-textMain">
              <span className="font-bold text-green-400">Rules:</span>
              <span className="text-textSecondary">{currentVariant.rules}</span>
            </div>
            {selectedVariant === 'three-check' && (
              <div className="flex gap-3 font-mono font-bold text-xs shrink-0 pl-3 border-l border-white/10">
                <span className="text-green-400">W: {whiteChecks}/3</span>
                <span className="text-red-400">B: {blackChecks}/3</span>
              </div>
            )}
          </div>

          {/* Board */}
          <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-stone-800 bg-bgAuxiliary select-none">
            {board.map((row, i) => {
              const rowIndex = 8 - i;
              return (
                <div key={rowIndex} className="flex relative">
                  <NumberNotation isMainBoxColor={rowIndex % 2 === 0} label={rowIndex.toString()} />
                  {row.map((square, j) => {
                    const colIndex = j % 8;
                    const isMainBoxColor = (rowIndex + colIndex) % 2 !== 0;
                    const squareRep = (String.fromCharCode(97 + colIndex) + '' + rowIndex) as Square;

                    const isHighlighted =
                      from === squareRep ||
                      squareRep === lastMove?.from ||
                      squareRep === lastMove?.to;
                    const isKingInCheck = square?.type === 'k' && square?.color === chess.turn() && chess.inCheck();
                    const isCenterKoth = selectedVariant === 'koth' && ['d4', 'e4', 'd5', 'e5'].includes(squareRep);

                    return (
                      <div
                        key={j}
                        onClick={() => handleSquareClick(squareRep, square)}
                        style={{ width: boxSize, height: boxSize }}
                        className={`relative cursor-pointer transition-colors duration-150 flex items-center justify-center ${
                          isKingInCheck
                            ? 'bg-[#E63946] animate-pulse'
                            : isHighlighted
                            ? isMainBoxColor
                              ? 'bg-boardSelected'
                              : 'bg-boardHighlight'
                            : isMainBoxColor
                            ? 'bg-boardDark'
                            : 'bg-boardLight'
                        }`}
                      >
                        <div className="w-full h-full flex items-center justify-center relative">
                          {isCenterKoth && (
                            <div className="absolute inset-1 border border-yellow-400/40 rounded pointer-events-none" />
                          )}
                          {square && <ChessSquare square={square} />}
                          {rowIndex === 1 && <LetterNotation label={labels[colIndex]} isMainBoxColor={colIndex % 2 !== 0} />}
                          {!!from && legalMoves.includes(squareRep) && (
                            <LegalMoveIndicator isMainBoxColor={isMainBoxColor} isPiece={!!square?.type} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-[540px] mt-3 flex items-center justify-between text-xs text-textSecondary px-2">
            <span className="font-semibold text-white">{chess.turn() === 'w' ? 'White to move' : 'Black to move'}</span>
            <span>{moves.length} moves played</span>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4">
          {gameResult && (
            <div className="p-6 bg-gradient-to-br from-bgAuxiliary to-stone-900 border-2 border-yellow-500/50 rounded-2xl shadow-xl text-center animate-in fade-in">
              <h2 className="text-xl font-extrabold text-yellow-400">{gameResult}</h2>
              <button
                onClick={() => resetVariantGame()}
                className="mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all w-full"
              >
                Play Again
              </button>
            </div>
          )}

          <div className="bg-bgAuxiliary border border-white/10 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-sm text-white mb-2">About {currentVariant.name}</h3>
            <p className="text-xs text-textSecondary leading-relaxed">{currentVariant.rules}</p>
          </div>

          <div className="bg-bgAuxiliary border border-white/10 rounded-2xl p-4 shadow-xl flex-1 max-h-[280px] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs font-bold text-textSecondary uppercase">
              <span>Moves Log</span>
              <span className="font-mono text-green-400">{moves.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 py-2 font-mono text-xs text-textSecondary">
              {moves.length === 0 ? (
                <p className="text-center italic text-stone-500 py-6">Play a move to begin!</p>
              ) : (
                moves.map((m, idx) => (
                  <div key={idx} className="flex justify-between py-0.5 px-2 bg-bgDark/40 rounded">
                    <span>#{idx + 1} {m.color === 'w' ? 'White' : 'Black'}</span>
                    <span className="font-bold text-white">{m.san}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Variants;
