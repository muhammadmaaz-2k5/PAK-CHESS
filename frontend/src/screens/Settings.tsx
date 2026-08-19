import { Link, Outlet, useLocation } from 'react-router-dom';
import { Palette, Volume2, User, Shield } from 'lucide-react';

export const Settings = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Board Themes', path: '/settings/themes', icon: Palette },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white">Settings</h1>
        <p className="text-sm text-textSecondary mt-1">Manage your chessboard preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-56 shrink-0 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                    : 'text-textSecondary hover:bg-stone-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex-1 bg-bgAuxiliary/50 border border-white/5 rounded-2xl p-6 shadow-xl min-h-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
