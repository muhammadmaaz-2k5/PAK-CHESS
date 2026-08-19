import { useEffect, useState } from 'react';
import { PlayCard } from '../components/Card';
import { Footer } from '../components/Footer';
import { useThemeContext } from '../context/themeContext';
import { Trophy, Users, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBackendUrl } from '../config';

interface LeaderboardUser {
  id: string;
  name: string;
  rating: number;
}

export const Landing = () => {
  const { theme } = useThemeContext();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    fetch(`${getBackendUrl()}/v1/games/leaderboard`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.leaderboard) {
          setLeaderboard(data.leaderboard.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="w-full">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-6">
          <div className="w-full lg:w-3/5 flex flex-col items-center">
            <div className="relative group rounded-2xl overflow-hidden shadow-2xl border-4 border-stone-800 bg-bgAuxiliary max-w-[540px] w-full aspect-square flex items-center justify-center">
              <img
                src="/chessboard.jpeg"
                alt="Chessboard Hero"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                <span className="text-xs uppercase tracking-widest text-green-400 font-extrabold">
                  Real-Time Multiplayer
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  Match with players worldwide
                </h2>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/5 flex justify-center">
            <PlayCard />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
          <div className="p-6 rounded-2xl bg-bgAuxiliary border border-white/5 shadow-lg flex items-start gap-4">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-xl">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Instant Matchmaking</h3>
              <p className="text-xs text-textSecondary mt-1">
                Queue up with a single click and get paired in seconds with zero delay.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-bgAuxiliary border border-white/5 shadow-lg flex items-start gap-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Live Rating Updates</h3>
              <p className="text-xs text-textSecondary mt-1">
                Compete for rating points, track performance, and climb the ranks.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-bgAuxiliary border border-white/5 shadow-lg flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Validated Rules & Clocks</h3>
              <p className="text-xs text-textSecondary mt-1">
                Powered by chess.js engine with precision countdown clocks and move notation.
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        {leaderboard.length > 0 && (
          <div id="leaderboard" className="my-12 p-8 rounded-3xl bg-bgAuxiliary border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl">
                  <Trophy size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Top Rated Players</h3>
                  <p className="text-xs text-textSecondary">Leaderboard of active chess players</p>
                </div>
              </div>
              <Link
                to="/leaderboard"
                className="text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
              >
                View Full Leaderboard →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {leaderboard.map((player, idx) => (
                <div
                  key={player.id}
                  className="p-4 rounded-xl bg-bgDark border border-white/5 flex items-center gap-3"
                >
                  <span className="w-6 text-center font-bold text-stone-500 text-sm">
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center font-bold text-xs text-white">
                    {player.name ? player.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">
                      {player.name || 'Anonymous'}
                    </p>
                    <p className="text-[11px] text-green-400 font-mono font-bold">
                      {player.rating} ELO
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community & Open Source Callout */}
        <div className="mt-16 bg-gradient-to-r from-stone-900 to-bgAuxiliary border border-white/10 text-textMain w-full px-8 md:px-14 py-12 rounded-3xl shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-white">Open Source & Community Driven</h2>
              <p className="text-sm text-textSecondary max-w-xl">
                Contribute to the chess codebase, report bugs, or request new features on our GitHub repository.
              </p>
            </div>
            <a
              href="https://github.com/muhammadmaaz-2k5/PAK-CHESS"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl border border-white/20 bg-stone-800 hover:bg-stone-700 font-bold text-sm flex items-center gap-3 transition-all shrink-0"
            >
              <img className="w-6 h-6" src="/github.svg" alt="GitHub" />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};
