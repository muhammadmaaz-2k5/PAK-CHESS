import { useState, useEffect } from 'react';
import { getBackendUrl } from '../config';
import { Trophy, Medal, Search, Flame, ArrowUpRight, Award, Shield, User, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';

interface LeaderboardUser {
  id: string;
  name: string;
  username?: string;
  rating: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  createdAt: string;
}

export const Leaderboard = () => {
  const [players, setPlayers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'winRate' | 'totalGames'>('rating');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/v1/games/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.leaderboard) {
          setPlayers(data.leaderboard);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredPlayers = players
    .filter((p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'winRate') return b.winRate - a.winRate;
      if (sortBy === 'totalGames') return b.totalGames - a.totalGames;
      return 0;
    });

  const topThree = filteredPlayers.slice(0, 3);
  const restPlayers = filteredPlayers.slice(3);

  return (
    <div className="w-full max-w-6xl mx-auto py-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-bgAuxiliary to-stone-900 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20 shadow-inner">
              <Trophy size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Pak Chess Leaderboard
              </h1>
              <p className="text-xs md:text-sm text-textSecondary mt-1">
                Global rankings and match performance of active chess grandmasters & players
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchLeaderboard}
            className="p-3 bg-bgDark hover:bg-stone-800 rounded-xl text-textSecondary hover:text-white transition-colors border border-white/10"
            title="Refresh Leaderboard"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            to="/game/random"
            className="flex-1 md:flex-initial px-6 py-3 bg-green-600 hover:bg-green-500 font-bold text-sm text-white rounded-xl shadow-lg hover:shadow-green-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Play & Climb</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {loading && players.length === 0 ? (
        <Loader fullScreen={false} message="Loading live chess leaderboard..." />
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
              {/* #2 Rank */}
              {topThree[1] && (
                <div className="bg-bgAuxiliary border border-white/10 rounded-2xl p-6 text-center shadow-lg relative order-2 md:order-1 hover:border-stone-400/40 transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-stone-300 text-stone-900 font-extrabold text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Medal size={14} /> #2 SILVER
                  </div>
                  <div className="w-16 h-16 rounded-full bg-stone-700 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 border-2 border-stone-300 shadow-md">
                    {topThree[1].name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-base text-white truncate">{topThree[1].name}</h3>
                  <div className="text-xl font-extrabold text-yellow-400 font-mono my-1">
                    {topThree[1].rating} <span className="text-xs text-textSecondary font-sans font-normal">ELO</span>
                  </div>
                  <div className="flex justify-around text-xs text-textSecondary mt-3 pt-3 border-t border-white/5">
                    <span>{topThree[1].totalGames} games</span>
                    <span className="text-green-400">{topThree[1].winRate}% win rate</span>
                  </div>
                </div>
              )}

              {/* #1 Champion */}
              {topThree[0] && (
                <div className="bg-gradient-to-b from-yellow-500/10 to-bgAuxiliary border-2 border-yellow-500/40 rounded-3xl p-8 text-center shadow-2xl relative order-1 md:order-2 scale-105 hover:border-yellow-400 transition-all">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 font-black text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 tracking-wider">
                    <Trophy size={15} /> #1 CHAMPION
                  </div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 border-4 border-yellow-400 shadow-xl">
                    {topThree[0].name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-extrabold text-lg text-white truncate">{topThree[0].name}</h3>
                  <div className="text-3xl font-black text-yellow-400 font-mono my-1">
                    {topThree[0].rating} <span className="text-sm text-yellow-200/80 font-sans font-medium">ELO</span>
                  </div>
                  <div className="flex justify-around text-xs text-textSecondary mt-4 pt-4 border-t border-white/10">
                    <span className="font-semibold text-white">{topThree[0].wins} Wins</span>
                    <span className="text-green-400 font-bold">{topThree[0].winRate}% Win Rate</span>
                    <span>{topThree[0].totalGames} Total</span>
                  </div>
                </div>
              )}

              {/* #3 Rank */}
              {topThree[2] && (
                <div className="bg-bgAuxiliary border border-white/10 rounded-2xl p-6 text-center shadow-lg relative order-3 md:order-3 hover:border-amber-700/40 transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 font-extrabold text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Medal size={14} /> #3 BRONZE
                  </div>
                  <div className="w-16 h-16 rounded-full bg-stone-700 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 border-2 border-amber-600 shadow-md">
                    {topThree[2].name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-base text-white truncate">{topThree[2].name}</h3>
                  <div className="text-xl font-extrabold text-yellow-400 font-mono my-1">
                    {topThree[2].rating} <span className="text-xs text-textSecondary font-sans font-normal">ELO</span>
                  </div>
                  <div className="flex justify-around text-xs text-textSecondary mt-3 pt-3 border-t border-white/5">
                    <span>{topThree[2].totalGames} games</span>
                    <span className="text-green-400">{topThree[2].winRate}% win rate</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search and Filters Controls */}
          <div className="bg-bgAuxiliary p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 mb-6 shadow-md">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player name..."
                className="w-full pl-10 pr-4 py-2.5 bg-bgDark border border-white/10 rounded-xl text-white placeholder-stone-500 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-textSecondary font-semibold">Sort by:</span>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'rating'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-bgDark text-textSecondary hover:text-white'
                }`}
              >
                Top Rating
              </button>
              <button
                onClick={() => setSortBy('winRate')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'winRate'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-bgDark text-textSecondary hover:text-white'
                }`}
              >
                Win Rate
              </button>
              <button
                onClick={() => setSortBy('totalGames')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'totalGames'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-bgDark text-textSecondary hover:text-white'
                }`}
              >
                Most Games
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-bgAuxiliary rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-textMain">
                <thead className="bg-bgDark/80 border-b border-white/10 text-xs uppercase text-textSecondary font-semibold">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4 text-center">Rating</th>
                    <th className="px-6 py-4 text-center">Record (W-L-D)</th>
                    <th className="px-6 py-4 text-center">Win Rate</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-stone-500">
                        No players found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((player, idx) => (
                      <tr
                        key={player.id}
                        className="hover:bg-stone-800/40 transition-colors font-medium"
                      >
                        <td className="px-6 py-4 font-mono font-bold">
                          {idx === 0 ? (
                            <span className="text-yellow-400 font-extrabold">🥇 #1</span>
                          ) : idx === 1 ? (
                            <span className="text-stone-300 font-extrabold">🥈 #2</span>
                          ) : idx === 2 ? (
                            <span className="text-amber-600 font-extrabold">🥉 #3</span>
                          ) : (
                            <span className="text-stone-400">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-700 border border-white/10 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white truncate max-w-[180px]">{player.name}</p>
                            {player.username && (
                              <p className="text-[11px] text-textSecondary">@{player.username}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-extrabold text-green-400">
                          {player.rating}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-mono">
                          <span className="text-green-400 font-bold">{player.wins}W</span>{' '}
                          <span className="text-stone-500">/</span>{' '}
                          <span className="text-red-400 font-bold">{player.losses}L</span>{' '}
                          <span className="text-stone-500">/</span>{' '}
                          <span className="text-stone-300">{player.draws}D</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-bgDark rounded-full h-2 overflow-hidden border border-white/5">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full"
                                style={{ width: `${Math.min(100, player.winRate)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-stone-300">
                              {player.winRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to="/game/random"
                            className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            Challenge
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
