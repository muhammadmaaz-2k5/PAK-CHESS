const LegalMoveIndicator = ({
  isPiece,
  isMainBoxColor,
}: {
  isPiece: boolean;
  isMainBoxColor: boolean;
}) => {
  return (
    <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {isPiece ? (
        <div
          className={`w-[52px] h-[52px] md:w-[60px] md:h-[60px] border-4 rounded-full opacity-60 ${
            isMainBoxColor ? 'border-black/30' : 'border-black/20'
          }`}
        />
      ) : (
        <div
          className={`w-4 h-4 md:w-5 md:h-5 rounded-full opacity-50 ${
            isMainBoxColor ? 'bg-black/40' : 'bg-black/30'
          }`}
        />
      )}
    </div>
  );
};

export default LegalMoveIndicator;
