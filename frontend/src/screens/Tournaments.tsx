import { useState } from 'react';
import { Trophy, Users, Clock, Zap, Plus, Search, ShieldCheck, ChevronRight, Check, Award, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Tournament {
  id: string;
  title: string;
  format: 'Arena' | 'Swiss';
  timeControl: string;
  status: 'ongoing' | 'upcoming' | 'completed';
  registeredPlayers: number;
  maxPlayers: number;
  prize: string;
  startTime: string;
  duration: string;
  isJoined?: boolean;
}

export const Tournaments = () => {
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: 'tourney-1',
      title: 'Pak Chess Weekly Blitz Arena',
      format: 'Arena',
      timeControl: '3 min + 2 sec',
      status: 'ongoing',
      registeredPlayers: 38,
      maxPlayers: 100,
      prize: '1,500 ELO Trophy',
      startTime: 'Live Now',
      duration: '60 min',
      isJoined: false,
    },
    {
      id: 'tourney-2',
      title: 'Grandmaster Rapid Championship',
      format: 'Swiss',
      timeControl: '10 min + 0 sec',
      status: 'upcoming',
      registeredPlayers: 24,
      maxPlayers: 64,
      prize: 'Gold Grandmaster Badge',
      startTime: 'Starts in 45 mins',
      duration: '5 Rounds',
      isJoined: false,
    },
    {
      id: 'tourney-3',
      title: 'Bullet Brawl Friday Rush',
      format: 'Arena',
      timeControl: '1 min + 0 sec',
      status: 'upcoming',
      registeredPlayers: 56,
      maxPlayers: 128,
      prize: 'Speed Master Title',
      startTime: 'Tomorrow, 8:00 PM',
      duration: '45 min',
      isJoined: false,
    },
    {
      id: 'tourney-4',
      title: 'Independence Day Open Cup',
      format: 'Swiss',
      timeControl: '5 min + 3 sec',
      status: 'completed',
      registeredPlayers: 64,
      maxPlayers: 64,
      prize: 'Champion Trophy 🏆',
      startTime: 'Finished',
      duration: '6 Rounds',
      isJoined: false,
    },
  ]);

  // Form state for creating custom tournament
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState<'Arena' | 'Swiss'>('Arena');
  const [newTimeControl, setNewTimeControl] = useState('3 min + 2 sec');

  const handleJoin = (id: string) => {
    setTournaments((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, isJoined: !t.isJoined, registeredPlayers: t.isJoined ? t.registeredPlayers - 1 : t.registeredPlayers + 1 }
          : t
      )
    );
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTourney: Tournament = {
      id: `tourney-${Date.now()}`,
      title: newTitle.trim(),
      format: newFormat,
      timeControl: newTimeControl,
      status: 'upcoming',
      registeredPlayers: 1,
      maxPlayers: 64,
      prize: 'Tournament Crown',
      startTime: 'Starting Soon',
      duration: newFormat === 'Arena' ? '60 min' : '5 Rounds',
      isJoined: true,
    };

    setTournaments((prev) => [newTourney, ...prev]);
    setShowCreateModal(false);
    setNewTitle('');
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-bgAuxiliary via-stone-900 to-bgAuxiliary p-8 rounded-3xl border border-white/10 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20 shadow-inner">
              <Trophy size={30} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Pak Chess Tournaments
              </h1>
              <p className="text-xs md:text-sm text-textSecondary mt-1">
                Compete in Arena & Swiss tournaments, earn trophies, and climb the ranks
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-green-600/30 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={18} />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'ongoing', 'upcoming', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === tab
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-bgAuxiliary text-textSecondary hover:text-white border border-white/5'
            }`}
          >
            {tab === 'all' ? 'All Tournaments' : tab}
          </button>
        ))}
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTournaments.map((tourney) => {
          const isLive = tourney.status === 'ongoing';

          return (
            <div
              key={tourney.id}
              className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isLive
                  ? 'bg-gradient-to-br from-bgAuxiliary to-stone-900 border-green-500/40 shadow-xl shadow-green-500/5'
                  : 'bg-bgAuxiliary border-white/10 hover:border-white/20 shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse'
                        : tourney.status === 'upcoming'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {isLive && <span className="w-2 h-2 rounded-full bg-green-400"></span>}
                    {tourney.status}
                  </span>
                  <span className="text-xs font-bold text-textSecondary bg-bgDark px-3 py-1 rounded-lg border border-white/5">
                    {tourney.format}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{tourney.title}</h3>

                <div className="grid grid-cols-2 gap-3 my-4 p-3.5 bg-bgDark/80 rounded-xl border border-white/5 text-xs text-textSecondary">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-stone-400" />
                    <span>{tourney.timeControl}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-stone-400" />
                    <span>{tourney.registeredPlayers} / {tourney.maxPlayers} Players</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-yellow-400" />
                    <span className="text-yellow-300 font-semibold">{tourney.prize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-orange-400" />
                    <span>{tourney.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-textSecondary font-semibold">{tourney.startTime}</span>

                {tourney.status === 'completed' ? (
                  <button disabled className="px-5 py-2 bg-stone-800 text-stone-500 rounded-xl text-xs font-bold cursor-not-allowed">
                    Completed
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(tourney.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tourney.isJoined
                        ? 'bg-emerald-700 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-600/30'
                    }`}
                  >
                    {tourney.isJoined ? (
                      <>
                        <Check size={14} /> Registered
                      </>
                    ) : (
                      'Register / Join'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bgAuxiliary border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-extrabold text-white mb-2">Create New Tournament</h2>
            <p className="text-xs text-textSecondary mb-6">Host an Arena or Swiss chess tournament for your community</p>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-2">Tournament Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lahore Blitz Arena"
                  required
                  className="w-full px-4 py-2.5 bg-bgDark border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-2">Format</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-bgDark border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                  >
                    <option value="Arena">Arena (Fast Queue)</option>
                    <option value="Swiss">Swiss (Rounds)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-2">Time Control</label>
                  <select
                    value={newTimeControl}
                    onChange={(e) => setNewTimeControl(e.target.value)}
                    className="w-full px-3 py-2.5 bg-bgDark border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                  >
                    <option value="1 min + 0 sec">Bullet (1+0)</option>
                    <option value="3 min + 2 sec">Blitz (3+2)</option>
                    <option value="5 min + 0 sec">Blitz (5+0)</option>
                    <option value="10 min + 0 sec">Rapid (10+0)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-textSecondary hover:text-white font-bold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
