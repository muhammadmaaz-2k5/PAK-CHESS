import { useState } from 'react';
import { Button } from './Button';
import { Link, Check } from 'lucide-react';

export const ShareGame = ({
  className = '',
  gameId,
}: {
  className?: string;
  gameId: string;
}) => {
  const url = `${window.location.origin}/game/${gameId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={`flex flex-col items-center gap-y-4 p-6 bg-bgAuxiliary border border-white/10 rounded-xl shadow-xl ${className}`}>
      <h3 className="text-2xl font-bold tracking-tight text-green-500">
        Play with Friends
      </h3>
      <p className="text-sm text-textSecondary text-center">
        Share this link with your opponent to play together
      </p>

      <div
        onClick={handleCopy}
        className="flex items-center gap-x-2 bg-bgDark px-4 py-2.5 rounded-lg border border-white/10 text-sm text-blue-400 hover:text-blue-300 cursor-pointer max-w-full overflow-hidden truncate transition-colors"
      >
        <Link size={16} className="shrink-0" />
        <span className="truncate">{url}</span>
      </div>

      <Button onClick={handleCopy} className="text-base py-2.5 px-6 flex items-center gap-2">
        {copied ? (
          <>
            <Check size={18} /> Copied to Clipboard!
          </>
        ) : (
          'Copy Link'
        )}
      </Button>
    </div>
  );
};
