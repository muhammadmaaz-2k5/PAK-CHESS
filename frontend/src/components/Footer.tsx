import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-20 py-12 text-textSecondary border-t border-white/5 bg-bgDark/40">
      <div className="w-[96%] max-w-screen-lg mx-auto flex flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>•</span>
          <Link to="/game/random" className="hover:text-white transition-colors">Play Online</Link>
          <span>•</span>
          <Link to="/computer" className="hover:text-white transition-colors">Play Computer</Link>
          <span>•</span>
          <Link to="/tournaments" className="hover:text-white transition-colors">Tournaments</Link>
          <span>•</span>
          <Link to="/variants" className="hover:text-white transition-colors">Variants</Link>
          <span>•</span>
          <Link to="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <span>•</span>
          <Link to="/settings/themes" className="hover:text-white transition-colors">Board Themes</Link>
        </div>

        <div className="flex gap-4 mt-2">
          <a
            href="https://github.com/muhammadmaaz-2k5/PAK-CHESS"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 hover:text-white transition-colors text-textSecondary"
            title="Star on GitHub"
          >
            <Github size={18} />
          </a>
        </div>

        <p className="text-xs text-stone-500 mt-2">
          Pak Chess • Built with React, Node.js, Prisma, Neon DB, and Socket.IO
        </p>
      </div>
    </footer>
  );
};
