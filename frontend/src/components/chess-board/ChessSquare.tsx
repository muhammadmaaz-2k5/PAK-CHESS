import { Color, PieceSymbol, Square } from 'chess.js';

interface ChessSquareProps {
  square: {
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null;
}

const ChessSquare = ({ square }: ChessSquareProps) => {
  return (
    <div className="h-full w-full flex items-center justify-center select-none pointer-events-none">
      {square ? (
        <img
          className="w-[85%] h-[85%] object-contain drop-shadow-md select-none pointer-events-none transition-transform"
          src={`/${square.color === 'b' ? `b${square.type}` : `w${square.type}`}.png`}
          alt={`${square.color}${square.type}`}
          draggable={false}
        />
      ) : null}
    </div>
  );
};

export default ChessSquare;
