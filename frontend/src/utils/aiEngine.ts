import { Chess, Move, Square } from 'chess.js';

// Piece value evaluations for AI
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional piece-square tables
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'master';

export interface BotProfile {
  id: BotDifficulty;
  name: string;
  rating: number;
  avatar: string;
  depth: number;
  description: string;
}

export const BOT_PROFILES: BotProfile[] = [
  {
    id: 'easy',
    name: 'Novice Bot (Tariq)',
    rating: 800,
    avatar: '🤖',
    depth: 1,
    description: 'Makes casual moves and occasional tactical mistakes. Great for beginners!',
  },
  {
    id: 'medium',
    name: 'Club Player (Hamza)',
    rating: 1400,
    avatar: '♟️',
    depth: 2,
    description: 'Understands basic tactics, defends pieces, and attacks weaknesses.',
  },
  {
    id: 'hard',
    name: 'Master Bot (Zain)',
    rating: 1900,
    avatar: '👑',
    depth: 3,
    description: 'Deep tactical search, aggressive piece coordination, and solid defense.',
  },
  {
    id: 'master',
    name: 'Grandmaster AI (PakStock)',
    rating: 2500,
    avatar: '⚡',
    depth: 4,
    description: 'Calculates multiple moves ahead with positional evaluation and zero blunders.',
  },
];

/**
 * Evaluate static board position
 */
export function evaluateBoard(chess: Chess): number {
  let totalEvaluation = 0;
  const board = chess.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;

      const pieceValue = PIECE_VALUES[piece.type] || 0;
      let positionalBonus = 0;
      const squareIndex = i * 8 + j;

      if (piece.type === 'p') {
        positionalBonus = piece.color === 'w' ? PAWN_TABLE[squareIndex] : PAWN_TABLE[63 - squareIndex];
      } else if (piece.type === 'n') {
        positionalBonus = piece.color === 'w' ? KNIGHT_TABLE[squareIndex] : KNIGHT_TABLE[63 - squareIndex];
      } else if (piece.type === 'b') {
        positionalBonus = piece.color === 'w' ? BISHOP_TABLE[squareIndex] : BISHOP_TABLE[63 - squareIndex];
      }

      if (piece.color === 'w') {
        totalEvaluation += pieceValue + positionalBonus;
      } else {
        totalEvaluation -= pieceValue + positionalBonus;
      }
    }
  }

  return totalEvaluation;
}

/**
 * Minimax with Alpha-Beta Pruning
 */
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Get Best AI Move for difficulty
 */
export function getBestMove(chess: Chess, difficulty: BotDifficulty): Move | null {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // Easy bot: 40% random, 60% depth 1
  if (difficulty === 'easy') {
    if (Math.random() < 0.4) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
  }

  const isMaximizing = chess.turn() === 'w';
  let bestMove: Move | null = null;
  let bestValue = isMaximizing ? -Infinity : Infinity;

  const profile = BOT_PROFILES.find((p) => p.id === difficulty) || BOT_PROFILES[1];
  const depth = profile.depth;

  // Randomize move order slightly for variety
  const shuffledMoves = legalMoves.sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    chess.move(move);
    const boardValue = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();

    if (isMaximizing) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
  }

  return bestMove || legalMoves[0];
}
