export function Waitopponent() {
  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-bgAuxiliary border border-white/10 rounded-xl shadow-2xl max-w-sm text-center">
      <div className="w-12 h-12 mb-4 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      <h5 className="text-xl font-bold text-textMain tracking-wide mb-1">
        Searching for Opponent...
      </h5>
      <p className="text-sm text-textSecondary">
        Matching with an online player around your rating
      </p>
    </div>
  );
}
