import { THEMES } from '../constants/themes';
import { useThemeContext } from '../context/themeContext';
import { Check } from 'lucide-react';

export function Themes() {
  const { theme: currentTheme, setTheme } = useThemeContext();

  return (
    <div className="flex-1 py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textMain">Chessboard Themes</h1>
        <p className="text-sm text-textSecondary mt-1">
          Customize the appearance and square colors of your chessboard
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {THEMES.map((theme) => {
          const isSelected = currentTheme.className === theme.className;

          return (
            <div
              key={theme.name}
              className={`p-5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-green-500 bg-bgAuxiliary shadow-lg shadow-green-500/10'
                  : 'border-white/10 bg-bgAuxiliary/60 hover:bg-bgAuxiliary hover:border-white/20'
              }`}
              onClick={() => {
                setTheme(theme);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-textMain capitalize">{theme.name}</h2>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        <Check size={12} /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-textSecondary font-mono">{theme.darkColor} / {theme.lightColor}</p>
                </div>
              </div>

              {/* 2x2 Mini Board Preview */}
              <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-black/30 shadow-md">
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: theme.darkColor }}
                >
                  <img src="/bk.png" className="w-6 h-6 object-contain" alt="piece" />
                </div>
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: theme.lightColor }}
                >
                  <img src="/wn.png" className="w-6 h-6 object-contain" alt="piece" />
                </div>
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: theme.lightColor }}
                >
                  <img src="/br.png" className="w-6 h-6 object-contain" alt="piece" />
                </div>
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: theme.darkColor }}
                >
                  <img src="/wp.png" className="w-6 h-6 object-contain" alt="piece" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
