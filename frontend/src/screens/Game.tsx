import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { ChessBoard, isPromoting } from '../components/ChessBoard';
import { useSocket } from '../hooks/useSocket';
import { Chess, Move, Color } from 'chess.js';
import { useNavigate, useParams } from 'react-router-dom';
import MovesTable from '../components/MovesTable';
import { useUser } from '../store/hooks/useUser';
import { UserAvatar, Player } from '../components/UserAvatar';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { movesAtom, userSelectedMoveIndexAtom } from '../store/atoms/chessBoard';
import GameEndModal, { GameResult, Result } from '../components/GameEndModal';
import { Waitopponent } from '../components/ui/waitopponent';
import { ShareGame } from '../components/ShareGame';
import ExitGameModel from '../components/ExitGameModel';
import Loader from '../components/Loader';
import { Clock, MessageSquare, Send, AlertTriangle } from 'lucide-react';

export const INIT_GAME = 'init_game';
export const MOVE = 'move';
export const OPPONENT_DISCONNECTED = 'opponent_disconnected';
export const GAME_OVER = 'game_over';
export const JOIN_ROOM = 'join_room';
export const GAME_JOINED = 'game_joined';
export const GAME_ALERT = 'game_alert';
export const GAME_ADDED = 'game_added';
export const GAME_TIME = 'game_time';
export const GAME_ENDED = 'game_ended';
export const EXIT_GAME = 'exit_game';
export const CHAT_MESSAGE = 'chat_message';

const GAME_TIME_MS = 10 * 60 * 1000;

export interface Metadata {
  blackPlayer: Player;
  whitePlayer: Player;
}

interface ChatItem {
  sender: string;
  text: string;
  senderId?: string;
}

export const Game = () => {
  const socket = useSocket();
  const { gameId } = useParams();
  const user = useUser();
  const navigate = useNavigate();

  const [chess, _setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [added, setAdded] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameMetadata, setGameMetadata] = useState<Metadata | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [player1TimeConsumed, setPlayer1TimeConsumed] = useState(0);
  const [player2TimeConsumed, setPlayer2TimeConsumed] = useState(0);
  const [gameID, setGameID] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // In-game Chat state
  const [chatMessages, setChatMessages] = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const setMoves = useSetRecoilState(movesAtom);
  const userSelectedMoveIndex = useRecoilValue(userSelectedMoveIndexAtom);
  const userSelectedMoveIndexRef = useRef(userSelectedMoveIndex);

  useEffect(() => {
    userSelectedMoveIndexRef.current = userSelectedMoveIndex;
  }, [userSelectedMoveIndex]);

  // Audio effect
  const moveAudio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    moveAudio.current = new Audio('/move.wav');
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Game] Received WS event:', message.type, message);

        switch (message.type) {
          case GAME_ADDED:
            setAdded(true);
            setGameID(message.gameId);
            break;

          case INIT_GAME:
            chess.reset();
            setBoard(chess.board());
            setMoves([]);
            setStarted(true);
            setAdded(false);
            setResult(null);
            setAlertMessage(null);
            setGameID(message.payload.gameId);
            setGameMetadata({
              blackPlayer: message.payload.blackPlayer,
              whitePlayer: message.payload.whitePlayer,
            });
            navigate(`/game/${message.payload.gameId}`, { replace: true });
            break;

          case MOVE:
            const { move, player1TimeConsumed: p1Time, player2TimeConsumed: p2Time } = message.payload;
            if (p1Time !== undefined) setPlayer1TimeConsumed(p1Time);
            if (p2Time !== undefined) setPlayer2TimeConsumed(p2Time);

            if (userSelectedMoveIndexRef.current !== null) {
              setMoves((prev) => [...prev, move]);
              return;
            }

            try {
              if (isPromoting(chess, move.from, move.to)) {
                chess.move({
                  from: move.from,
                  to: move.to,
                  promotion: move.promotion || 'q',
                });
              } else {
                chess.move({ from: move.from, to: move.to });
              }
              setMoves((prev) => [...prev, move]);
              setBoard(chess.board());
              moveAudio.current?.play().catch(() => {});
            } catch (err) {
              console.error('Error executing move:', err);
            }
            break;

          case GAME_JOINED:
            setGameMetadata({
              blackPlayer: message.payload.blackPlayer,
              whitePlayer: message.payload.whitePlayer,
            });
            setPlayer1TimeConsumed(message.payload.player1TimeConsumed || 0);
            setPlayer2TimeConsumed(message.payload.player2TimeConsumed || 0);
            setStarted(true);
            setAdded(false);

            chess.reset();
            if (message.payload.moves && message.payload.moves.length > 0) {
              message.payload.moves.forEach((m: Move) => {
                try {
                  if (isPromoting(chess, m.from, m.to)) {
                    chess.move({ ...m, promotion: 'q' });
                  } else {
                    chess.move(m);
                  }
                } catch (e) {}
              });
              setMoves(message.payload.moves);
            }
            setBoard(chess.board());
            break;

          case OPPONENT_DISCONNECTED:
            setAlertMessage('Opponent disconnected. Abandonment countdown started...');
            break;

          case GAME_ALERT:
            setAlertMessage(message.payload?.message || 'Game Notification');
            setTimeout(() => setAlertMessage(null), 4000);
            break;

          case CHAT_MESSAGE:
            if (message.payload) {
              setChatMessages((prev) => [...prev, message.payload]);
              setTimeout(() => {
                chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
            break;

          case GAME_TIME:
            if (message.payload?.player1TimeConsumed !== undefined) {
              setPlayer1TimeConsumed(message.payload.player1TimeConsumed);
            }
            if (message.payload?.player2TimeConsumed !== undefined) {
              setPlayer2TimeConsumed(message.payload.player2TimeConsumed);
            }
            break;

          case GAME_ENDED:
            let wonBy = 'Game Completed';
            if (message.payload.status === 'PLAYER_EXIT') {
              wonBy = 'Resignation / Abandonment';
            } else if (message.payload.status === 'TIME_UP') {
              wonBy = 'Time Out';
            } else if (message.payload.reason) {
              wonBy = message.payload.reason;
            } else {
              wonBy = message.payload.result !== 'DRAW' ? 'Checkmate' : 'Draw';
            }

            setResult({
              result: message.payload.result,
              by: wonBy,
              status: message.payload.status,
            });
            setStarted(false);
            setAdded(false);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Socket message parse error:', err);
      }
    };

    socket.addEventListener('message', handleMessage);

    if (gameId && gameId !== 'random') {
      socket.send(
        JSON.stringify({
          type: JOIN_ROOM,
          payload: { gameId },
        }),
      );
    }

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, gameId]);

  // Live timer interval
  useEffect(() => {
    if (started && !result) {
      const interval = setInterval(() => {
        if (chess.turn() === 'w') {
          setPlayer1TimeConsumed((p) => p + 100);
        } else {
          setPlayer2TimeConsumed((p) => p + 100);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [started, result, chess]);

  const getTimerDisplay = (timeConsumed: number) => {
    const timeLeftMs = Math.max(0, GAME_TIME_MS - timeConsumed);
    const minutes = Math.floor(timeLeftMs / (1000 * 60));
    const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    const isLowTime = timeLeftMs < 60 * 1000;

    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border shadow-sm ${
          isLowTime
            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
            : 'bg-bgDark text-textMain border-white/10'
        }`}
      >
        <Clock size={14} className="text-textSecondary" />
        <span>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    );
  };

  const handleExit = () => {
    if (socket && socket.readyState === 1) {
      socket.send(
        JSON.stringify({
          type: EXIT_GAME,
          payload: { gameId: gameId || gameID },
        }),
      );
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || socket.readyState !== 1) return;

    socket.send(
      JSON.stringify({
        type: CHAT_MESSAGE,
        payload: {
          gameId: gameId || gameID,
          text: chatInput.trim(),
        },
      }),
    );
    setChatInput('');
  };

  const myColor: Color = user?.id === gameMetadata?.blackPlayer?.id ? 'b' : 'w';

  if (!socket) {
    return <Loader message="Connecting to Chess Server..." />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      {result && (
        <GameEndModal
          blackPlayer={gameMetadata?.blackPlayer}
          whitePlayer={gameMetadata?.whitePlayer}
          gameResult={result}
          onNewGame={() => {
            setResult(null);
            setMoves([]);
            chess.reset();
            setBoard(chess.board());
            navigate('/game/random');
            if (socket && socket.readyState === 1) {
              socket.send(JSON.stringify({ type: INIT_GAME }));
            }
          }}
        />
      )}

      {alertMessage && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-300 text-sm font-medium animate-in fade-in">
          <AlertTriangle size={16} />
          <span>{alertMessage}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Left Side: Chess Board and Player Info */}
        <div className="flex flex-col items-center w-full lg:w-auto">
          {/* Top Player (Opponent) */}
          {started && (
            <div className="w-full max-w-[600px] flex items-center justify-between mb-3 px-2">
              <UserAvatar gameMetadata={gameMetadata} self={false} />
              {getTimerDisplay(
                myColor === 'w' ? player2TimeConsumed : player1TimeConsumed,
              )}
            </div>
          )}

          {/* Core Chessboard */}
          <div className="w-full flex justify-center">
            <ChessBoard
              started={started}
              gameId={gameId || gameID}
              myColor={myColor}
              chess={chess}
              setBoard={setBoard}
              socket={socket}
              board={board}
            />
          </div>

          {/* Bottom Player (Self) */}
          {started && (
            <div className="w-full max-w-[600px] flex items-center justify-between mt-3 px-2">
              <UserAvatar gameMetadata={gameMetadata} self={true} />
              {getTimerDisplay(
                myColor === 'w' ? player1TimeConsumed : player2TimeConsumed,
              )}
            </div>
          )}
        </div>

        {/* Right Side: Game Controls, Move History, & In-Game Chat */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
          {!started ? (
            <div className="p-8 bg-bgAuxiliary border border-white/10 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center min-h-[350px]">
              {added ? (
                <div className="flex flex-col items-center space-y-6 w-full">
                  <Waitopponent />
                  {gameID && <ShareGame gameId={gameID} />}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <img src="/lightning-bolt.png" alt="Play" className="w-8 h-8 object-contain" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Ready for a Match?</h2>
                  <p className="text-xs text-textSecondary max-w-xs">
                    Get paired with another online player of similar rating and play real-time classical chess.
                  </p>
                  <Button
                    onClick={() => {
                      if (socket && socket.readyState === 1) {
                        socket.send(JSON.stringify({ type: INIT_GAME }));
                      } else {
                        alert('Connecting to chess server... Please wait a moment.');
                      }
                    }}
                    className="w-full"
                  >
                    Start Quick Match
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-bgAuxiliary border border-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    myColor === chess.turn() ? 'bg-green-500 animate-ping' : 'bg-stone-500'
                  }`}
                />
                <span className="text-sm font-bold text-white">
                  {myColor === chess.turn() ? 'Your Turn' : "Opponent's Turn"}
                </span>
              </div>
              <ExitGameModel onClick={handleExit} />
            </div>
          )}

          {/* Moves History Table */}
          <div className="h-[280px]">
            <MovesTable />
          </div>

          {/* In-game Chat Box */}
          {started && (
            <div className="bg-bgAuxiliary border border-white/10 rounded-xl p-3 flex flex-col h-[200px] shadow-md">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-xs font-semibold text-textSecondary">
                <MessageSquare size={14} />
                <span>Room Chat</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 py-2 text-xs">
                {chatMessages.length === 0 ? (
                  <p className="text-stone-500 text-center italic mt-6">No messages yet. Say hello!</p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-lg ${
                        msg.senderId === user?.id ? 'bg-green-900/30 text-green-300 ml-4' : 'bg-bgDark mr-4 text-textMain'
                      }`}
                    >
                      <span className="font-bold mr-1">{msg.sender}:</span>
                      <span>{msg.text}</span>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-white/5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a chat message..."
                  className="flex-1 bg-bgDark border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-green-500"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
