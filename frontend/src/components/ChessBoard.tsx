import { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
import { MouseEvent, memo, useEffect, useState, useRef } from 'react';
import LetterNotation from './chess-board/LetterNotation';
import LegalMoveIndicator from './chess-board/LegalMoveIndicator';
import ChessSquare from './chess-board/ChessSquare';
import NumberNotation from './chess-board/NumberNotation';
import { drawArrow } from '../utils/canvas';
import { useRecoilState } from 'recoil';
import { isBoardFlippedAtom, movesAtom, userSelectedMoveIndexAtom } from '../store/atoms/chessBoard';

export const MOVE = 'move';

export function isPromoting(chess: Chess, from: Square, to: Square) {
  if (!from) return false;
  try {
    const piece = chess.get(from);
    if (!piece || piece.type !== 'p') return false;
    if (piece.color !== chess.turn()) return false;
    if (!['1', '8'].some((it) => to.endsWith(it))) return false;
    return chess.moves({ square: from, verbose: true }).some((it) => it.to === to);
  } catch (err) {
    return false;
  }
}

export const ChessBoard = memo(
  ({
    gameId,
    started,
    myColor,
    chess,
    board,
    socket,
    setBoard,
  }: {
    myColor: Color;
    gameId: string;
    started: boolean;
    chess: Chess;
    setBoard: React.Dispatch<
      React.SetStateAction<
        ({
          square: Square;
          type: PieceSymbol;
          color: Color;
        } | null)[][]
      >
    >;
    board: ({
      square: Square;
      type: PieceSymbol;
      color: Color;
    } | null)[][];
    socket: WebSocket | null;
  }) => {
    const [isFlipped, setIsFlipped] = useRecoilState(isBoardFlippedAtom);
    const [userSelectedMoveIndex, setUserSelectedMoveIndex] = useRecoilState(userSelectedMoveIndexAtom);
    const [moves, setMoves] = useRecoilState(movesAtom);
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
    const [rightClickedSquares, setRightClickedSquares] = useState<string[]>([]);
    const [arrowStart, setArrowStart] = useState<string | null>(null);

    const [from, setFrom] = useState<null | Square>(null);
    const isMyTurn = myColor === chess.turn();
    const [legalMoves, setLegalMoves] = useState<string[]>([]);

    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const [boxSize, setBoxSize] = useState<number>(75);

    // Audio references
    const moveAudio = useRef<HTMLAudioElement | null>(null);
    const captureAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      moveAudio.current = new Audio('/move.wav');
      captureAudio.current = new Audio('/capture.wav');
    }, []);

    // Responsive board resize
    useEffect(() => {
      const updateSize = () => {
        if (boardRef.current) {
          const containerWidth = boardRef.current.parentElement?.clientWidth || window.innerWidth;
          const containerHeight = window.innerHeight - 200;
          const available = Math.min(containerWidth - 32, containerHeight, 600);
          const computedBox = Math.floor(available / 8);
          setBoxSize(Math.max(38, Math.min(75, computedBox)));
        }
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
      if (myColor === 'b') {
        setIsFlipped(true);
      }
    }, [myColor]);

    const clearCanvas = () => {
      setRightClickedSquares([]);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const handleRightClick = (squareRep: string) => {
      if (rightClickedSquares.includes(squareRep)) {
        setRightClickedSquares((prev) => prev.filter((sq) => sq !== squareRep));
      } else {
        setRightClickedSquares((prev) => [...prev, squareRep]);
      }
    };

    const handleDrawArrow = (squareRep: string) => {
      if (arrowStart && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawArrow({
            ctx,
            start: arrowStart,
            end: squareRep,
            isFlipped,
            squareSize: boxSize,
          });
        }
        setArrowStart(null);
      }
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>, squareRep: string) => {
      e.preventDefault();
      if (e.button === 2) {
        setArrowStart(squareRep);
      }
    };

    const handleMouseUp = (e: MouseEvent<HTMLDivElement>, squareRep: string) => {
      e.preventDefault();
      if (!started) return;

      if (e.button === 2) {
        if (arrowStart === squareRep) {
          handleRightClick(squareRep);
        } else {
          handleDrawArrow(squareRep);
        }
      } else {
        clearCanvas();
      }
    };

    useEffect(() => {
      clearCanvas();
      const lMove = moves[moves.length - 1];
      if (lMove) {
        setLastMove({
          from: lMove.from,
          to: lMove.to,
        });
      } else {
        setLastMove(null);
      }
    }, [moves]);

    useEffect(() => {
      if (userSelectedMoveIndex !== null && moves[userSelectedMoveIndex]) {
        const move = moves[userSelectedMoveIndex];
        setLastMove({
          from: move.from,
          to: move.to,
        });
        if (move.after) {
          chess.load(move.after);
        }
        setBoard(chess.board());
        return;
      }
    }, [userSelectedMoveIndex]);

    return (
      <div className="flex relative justify-center items-center select-none" ref={boardRef}>
        <div className="rounded-lg overflow-hidden shadow-2xl border-2 border-stone-800 bg-bgAuxiliary">
          {(isFlipped ? board.slice().reverse() : board).map((row, i) => {
            const rowIndex = isFlipped ? i + 1 : 8 - i;
            return (
              <div key={rowIndex} className="flex relative">
                <NumberNotation
                  isMainBoxColor={isFlipped ? rowIndex % 2 !== 0 : rowIndex % 2 === 0}
                  label={rowIndex.toString()}
                />
                {(isFlipped ? row.slice().reverse() : row).map((square, j) => {
                  const colIndex = isFlipped ? 7 - (j % 8) : j % 8;
                  const isMainBoxColor = (rowIndex + colIndex) % 2 !== 0;
                  const isPiece: boolean = !!square;
                  const squareRepresentation = (String.fromCharCode(97 + colIndex) + '' + rowIndex) as Square;

                  const isHighlightedSquare =
                    from === squareRepresentation ||
                    squareRepresentation === lastMove?.from ||
                    squareRepresentation === lastMove?.to;
                  const isRightClickedSquare = rightClickedSquares.includes(squareRepresentation);
                  const isKingInCheckSquare =
                    square?.type === 'k' && square?.color === chess.turn() && chess.inCheck();

                  return (
                    <div
                      key={j}
                      onClick={() => {
                        if (!started) return;

                        if (userSelectedMoveIndex !== null) {
                          chess.reset();
                          moves.forEach((move) => {
                            try {
                              chess.move({ from: move.from, to: move.to, promotion: 'q' });
                            } catch (e) {}
                          });
                          setBoard(chess.board());
                          setUserSelectedMoveIndex(null);
                          return;
                        }

                        if (!from && square?.color !== chess.turn()) return;
                        if (!isMyTurn) return;

                        if (from !== squareRepresentation) {
                          setFrom(squareRepresentation);
                          if (isPiece) {
                            try {
                              const validMoves = chess
                                .moves({ verbose: true, square: square?.square })
                                .map((m) => m.to);
                              setLegalMoves(validMoves);
                            } catch (e) {
                              setLegalMoves([]);
                            }
                          }
                        } else {
                          setFrom(null);
                          setLegalMoves([]);
                        }

                        if (!isPiece) {
                          setLegalMoves([]);
                        }

                        if (!from) {
                          setFrom(squareRepresentation);
                          try {
                            const validMoves = chess
                              .moves({ verbose: true, square: square?.square })
                              .map((m) => m.to);
                            setLegalMoves(validMoves);
                          } catch (e) {
                            setLegalMoves([]);
                          }
                        } else {
                          try {
                            let moveResult: Move | null = null;
                            if (isPromoting(chess, from, squareRepresentation)) {
                              moveResult = chess.move({
                                from,
                                to: squareRepresentation,
                                promotion: 'q',
                              });
                            } else {
                              moveResult = chess.move({
                                from,
                                to: squareRepresentation,
                              });
                            }

                            if (moveResult) {
                              if (moveResult.captured) {
                                captureAudio.current?.play().catch(() => {});
                              } else {
                                moveAudio.current?.play().catch(() => {});
                              }

                              setMoves((prev) => [...prev, moveResult!]);
                              setFrom(null);
                              setLegalMoves([]);
                              setBoard(chess.board());

                              if (socket && socket.readyState === 1) {
                                socket.send(
                                  JSON.stringify({
                                    type: MOVE,
                                    payload: {
                                      gameId,
                                      move: moveResult,
                                    },
                                  }),
                                );
                              }
                            }
                          } catch (e) {
                            setFrom(null);
                            setLegalMoves([]);
                          }
                        }
                      }}
                      style={{
                        width: boxSize,
                        height: boxSize,
                      }}
                      className={`relative cursor-pointer transition-colors duration-150 flex items-center justify-center ${
                        isRightClickedSquare
                          ? isMainBoxColor
                            ? 'bg-[#CF664E]'
                            : 'bg-[#E87764]'
                          : isKingInCheckSquare
                          ? 'bg-[#E63946] animate-pulse'
                          : isHighlightedSquare
                          ? isMainBoxColor
                            ? 'bg-boardSelected'
                            : 'bg-boardHighlight'
                          : isMainBoxColor
                          ? 'bg-boardDark'
                          : 'bg-boardLight'
                      }`}
                      onContextMenu={(e) => e.preventDefault()}
                      onMouseDown={(e) => handleMouseDown(e, squareRepresentation)}
                      onMouseUp={(e) => handleMouseUp(e, squareRepresentation)}
                    >
                      <div className="w-full h-full flex items-center justify-center relative">
                        {square && <ChessSquare square={square} />}
                        {isFlipped
                          ? rowIndex === 8 && <LetterNotation label={labels[colIndex]} isMainBoxColor={colIndex % 2 === 0} />
                          : rowIndex === 1 && <LetterNotation label={labels[colIndex]} isMainBoxColor={colIndex % 2 !== 0} />}
                        {!!from && legalMoves.includes(squareRepresentation) && (
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

        <canvas
          ref={(ref) => setCanvas(ref)}
          width={boxSize * 8}
          height={boxSize * 8}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 20,
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    );
  },
);

export default ChessBoard;
