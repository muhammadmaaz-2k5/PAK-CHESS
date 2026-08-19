import { useState, useEffect, useRef } from 'react';
import { Chess, Move, Square, Color, PieceSymbol } from 'chess.js';
import LetterNotation from '../components/chess-board/LetterNotation';
import LegalMoveIndicator from '../components/chess-board/LegalMoveIndicator';
import ChessSquare from '../components/chess-board/ChessSquare';
import NumberNotation from '../components/chess-board/NumberNotation';
import { BOT_PROFILES, BotDifficulty, BotProfile, getBestMove, evaluateBoard } from '../utils/aiEngine';
import { Bot, RotateCcw, Lightbulb, Play, RefreshCw, Trophy, Sparkles, ChevronLeft, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';

export const PlayComputer = () => {
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<Color>('w');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moves, setMoves] = useState<Move[]>([]);
  const [from, setFrom] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [gameResult, setGameResult] = useState<{ status: string; winner: string } | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [evaluation, setEvaluation] = useState<number>(0);
  const [boxSize, setBoxSize] = useState<number>(70);

  const { width, height } = useWindowSize();
  const moveAudio = useRef<HTMLAudioElement | null>(null);
  const captureAudio = useRef<HTMLAudioElement | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const currentBot: BotProfile = BOT_PROFILES.find((b) => b.id === selectedDifficulty) || BOT_PROFILES[1];

  useEffect(() => {
    moveAudio.current = new Audio('/move.wav');
    captureAudio.current = new Audio('/capture.wav');

    const handleResize = () => {
      if (boardRef.current) {
        const available = Math.min(boardRef.current.parentElement?.clientWidth || 600, window.innerHeight - 200, 560);
        setBoxSize(Math.max(38, Math.floor((available - 20) / 8)));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetGame = (difficulty = selectedDifficulty, color = playerColor) => {
    chess.reset();
    setBoard(chess.board());
    setMoves([]);
    setFrom(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameResult(null);
    setHint(null);
    setEvaluation(0);
    setIsBotThinking(false);

    if (color === 'b') {
      triggerBotMove(difficulty);
    }
  };

  const checkGameOver = () => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Black (AI)' : 'White (You)';
      setGameResult({ status: 'Checkmate', winner });
      return true;
    }
    if (chess.isDraw()) {
      setGameResult({ status: 'Draw', winner: 'Stalemate / Draw' });
      return true;
    }
    return false;
  };

  const triggerBotMove = (difficulty: BotDifficulty) => {
    setIsBotThinking(true);
    setTimeout(() => {
      try {
        const bestMove = getBestMove(chess, difficulty);
        if (bestMove) {
          const moveResult = chess.move(bestMove);
          if (moveResult) {
            if (moveResult.captured) {
              captureAudio.current?.play().catch(() => {});
            } else {
              moveAudio.current?.play().catch(() => {});
            }

            setMoves((prev) => [...prev, moveResult]);
            setBoard(chess.board());
            setLastMove({ from: moveResult.from, to: moveResult.to });
            setEvaluation(evaluateBoard(chess));
            checkGameOver();
          }
        }
      } catch (err) {
        console.error('Bot move calculation error:', err);
      } finally {
        setIsBotThinking(false);
      }
    }, 400 + Math.random() * 400); // realistic human-like thinking delay
  };

  const handleSquareClick = (squareRepresentation: Square, squarePiece: any) => {
    if (gameResult || isBotThinking) return;
    if (chess.turn() !== playerColor) return;

    if (!from) {
      if (!squarePiece || squarePiece.color !== playerColor) return;
      setFrom(squareRepresentation);
      setLegalMoves(chess.moves({ square: squareRepresentation, verbose: true }).map((m) => m.to));
      return;
    }

    if (from === squareRepresentation) {
      setFrom(null);
      setLegalMoves([]);
      return;
    }

    // Attempt move
    try {
      let moveResult = chess.move({
        from,
        to: squareRepresentation,
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
        setHint(null);
        setEvaluation(evaluateBoard(chess));

        const isOver = checkGameOver();
        if (!isOver) {
          triggerBotMove(selectedDifficulty);
        }
      }
    } catch (e) {
      if (squarePiece && squarePiece.color === playerColor) {
        setFrom(squareRepresentation);
        setLegalMoves(chess.moves({ square: squareRepresentation, verbose: true }).map((m) => m.to));
      } else {
        setFrom(null);
        setLegalMoves([]);
      }
    }
  };

  const handleUndo = () => {
    if (moves.length === 0 || isBotThinking) return;
    chess.undo(); // Undo AI
    chess.undo(); // Undo Player
    setBoard(chess.board());
    setMoves((prev) => prev.slice(0, -2));
    setLastMove(null);
    setGameResult(null);
    setHint(null);
    setEvaluation(evaluateBoard(chess));
  };

  const handleHint = () => {
    if (chess.turn() !== playerColor || isBotThinking) return;
    const best = getBestMove(chess, 'master');
    if (best) {
      setHint(best);
      setFrom(best.from as Square);
      setLegalMoves([best.to]);
    }
  };

  const isFlipped = playerColor === 'b';
  const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      {gameResult && gameResult.winner.includes('You') && (
        <Confetti width={width} height={height} numberOfPieces={180} recycle={false} />
      )}

      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-textSecondary hover:text-white transition-colors">
          <ChevronLeft size={16} /> Home
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-textSecondary font-semibold">Bot Difficulty:</span>
          <div className="flex gap-1.5 bg-bgAuxiliary p-1 rounded-xl border border-white/10">
            {BOT_PROFILES.map((bot) => (
              <button
                key={bot.id}
                onClick={() => {
                  setSelectedDifficulty(bot.id);
                  resetGame(bot.id, playerColor);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedDifficulty === bot.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-textSecondary hover:text-white'
                }`}
              >
                <span>{bot.avatar}</span>
                <span className="hidden sm:inline">{bot.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75">({bot.rating})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Left Side: Chessboard */}
        <div className="flex flex-col items-center w-full lg:w-auto" ref={boardRef}>
          {/* Top Opponent (AI Bot) */}
          <div className="w-full max-w-[560px] flex items-center justify-between mb-3 px-2 bg-bgAuxiliary p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="text-2xl p-1.5 bg-bgDark rounded-xl border border-white/5">{currentBot.avatar}</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-white">{currentBot.name}</p>
                  <span className="text-[11px] font-mono text-yellow-400 font-bold">[{currentBot.rating}]</span>
                </div>
                <p className="text-[11px] text-textSecondary">{isBotThinking ? '🤖 Calculating move...' : 'Waiting for turn'}</p>
              </div>
            </div>
            {isBotThinking && (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold animate-pulse">
                <Sparkles size={14} /> Thinking...
              </div>
            )}
          </div>

          {/* Board Grid */}
          <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-stone-800 bg-bgAuxiliary select-none">
            {(isFlipped ? board.slice().reverse() : board).map((row, i) => {
              const rowIndex = isFlipped ? i + 1 : 8 - i;
              return (
                <div key={rowIndex} className="flex relative">
                  <NumberNotation isMainBoxColor={isFlipped ? rowIndex % 2 !== 0 : rowIndex % 2 === 0} label={rowIndex.toString()} />
                  {(isFlipped ? row.slice().reverse() : row).map((square, j) => {
                    const colIndex = isFlipped ? 7 - (j % 8) : j % 8;
                    const isMainBoxColor = (rowIndex + colIndex) % 2 !== 0;
                    const squareRep = (String.fromCharCode(97 + colIndex) + '' + rowIndex) as Square;

                    const isHighlighted =
                      from === squareRep ||
                      squareRep === lastMove?.from ||
                      squareRep === lastMove?.to ||
                      hint?.from === squareRep ||
                      hint?.to === squareRep;
                    const isKingInCheck = square?.type === 'k' && square?.color === chess.turn() && chess.inCheck();

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
                          {square && <ChessSquare square={square} />}
                          {isFlipped
                            ? rowIndex === 8 && <LetterNotation label={labels[colIndex]} isMainBoxColor={colIndex % 2 === 0} />
                            : rowIndex === 1 && <LetterNotation label={labels[colIndex]} isMainBoxColor={colIndex % 2 !== 0} />}
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

          {/* Bottom Player (You) */}
          <div className="w-full max-w-[560px] flex items-center justify-between mt-3 px-2 bg-bgAuxiliary p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 font-bold text-xs text-white flex items-center justify-center shadow">
                YOU
              </div>
              <div>
                <p className="font-bold text-sm text-white">You ({playerColor === 'w' ? 'White' : 'Black'})</p>
                <p className="text-[11px] text-green-400 font-semibold">
                  {chess.turn() === playerColor ? 'Your Turn' : 'Bot is calculating...'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const nextColor = playerColor === 'w' ? 'b' : 'w';
                  setPlayerColor(nextColor);
                  resetGame(selectedDifficulty, nextColor);
                }}
                className="p-2 bg-bgDark hover:bg-stone-800 rounded-lg text-xs font-semibold text-textSecondary hover:text-white border border-white/5 transition-colors"
                title="Switch Play as Black / White"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Game Controls & Move Log */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4">
          {/* Game Over Alert Box */}
          {gameResult && (
            <div className="p-6 bg-gradient-to-br from-bgAuxiliary to-stone-900 border-2 border-yellow-500/50 rounded-2xl shadow-xl text-center animate-in fade-in">
              <Trophy size={32} className="mx-auto text-yellow-400 mb-2" />
              <h2 className="text-2xl font-black text-white">{gameResult.status}</h2>
              <p className="text-sm font-semibold text-green-400 mt-1">{gameResult.winner} Won!</p>
              <button
                onClick={() => resetGame()}
                className="mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all w-full"
              >
                Play Rematch
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="bg-bgAuxiliary p-4 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between gap-2">
            <button
              onClick={handleUndo}
              disabled={moves.length === 0 || isBotThinking}
              className="flex-1 py-2.5 bg-bgDark hover:bg-stone-800 disabled:opacity-30 rounded-xl text-xs font-bold text-textMain border border-white/5 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Undo</span>
            </button>
            <button
              onClick={handleHint}
              disabled={chess.turn() !== playerColor || isBotThinking || !!gameResult}
              className="flex-1 py-2.5 bg-bgDark hover:bg-stone-800 disabled:opacity-30 rounded-xl text-xs font-bold text-amber-400 border border-white/5 transition-all flex items-center justify-center gap-1.5"
            >
              <Lightbulb size={14} />
              <span>Hint</span>
            </button>
            <button
              onClick={() => resetGame()}
              className="flex-1 py-2.5 bg-bgDark hover:bg-stone-800 rounded-xl text-xs font-bold text-red-400 border border-white/5 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>New</span>
            </button>
          </div>

          {/* Move History Table */}
          <div className="bg-bgAuxiliary border border-white/10 rounded-2xl p-4 shadow-xl flex-1 max-h-[320px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs font-bold text-textSecondary uppercase tracking-wider">
              <span>Move History</span>
              <span className="font-mono text-green-400">{moves.length} Moves</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1 font-mono text-xs">
              {moves.length === 0 ? (
                <p className="text-stone-500 text-center italic py-10">Make your first move against {currentBot.name}!</p>
              ) : (
                Array.from({ length: Math.ceil(moves.length / 2) }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 px-3 rounded-lg bg-bgDark/60 text-textMain">
                    <span className="w-8 text-stone-500">{idx + 1}.</span>
                    <span className="flex-1 font-bold text-white">{moves[idx * 2]?.san}</span>
                    <span className="flex-1 text-textSecondary">{moves[idx * 2 + 1]?.san || ''}</span>
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

export default PlayComputer;
