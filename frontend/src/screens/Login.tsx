import { useNavigate, Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { userAtom } from '../store/atoms/user';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { getBackendUrl } from '../config';

const Login = () => {
  const navigate = useNavigate();
  const guestName = useRef<HTMLInputElement>(null);
  const setUser = useSetRecoilState(userAtom);
  const [loading, setLoading] = useState(false);

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      const name = (guestName.current && guestName.current.value.trim()) || '';
      const response = await fetch(`${getBackendUrl()}/auth/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (userData.token) {
          localStorage.setItem('chess_jwt_token', userData.token);
        }
        localStorage.setItem('chess_user', JSON.stringify(userData));
        navigate('/game/random');
      } else {
        alert('Failed to sign in as guest');
      }
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const google = () => {
    window.open(`${getBackendUrl()}/auth/google`, '_self');
  };

  const github = () => {
    window.open(`${getBackendUrl()}/auth/github`, '_self');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bgMain text-textMain p-4">
      <div className="w-full max-w-md mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-textSecondary hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div className="bg-bgAuxiliary rounded-3xl shadow-2xl border border-white/10 p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <img src="/chess.png" alt="Chess Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Sign In to Pak <span className="text-green-500">Chess</span>
          </h1>
          <p className="text-xs text-textSecondary mt-2">
            Enter your display name to start playing immediately
          </p>
        </div>

        {/* Guest Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-2">
              Guest Player Username
            </label>
            <input
              type="text"
              ref={guestName}
              placeholder="e.g. ChessMaster99"
              onKeyDown={(e) => {
                if (e.key === 'Enter') loginAsGuest();
              }}
              className="w-full px-4 py-3 bg-bgDark border border-white/10 rounded-xl text-white placeholder-stone-500 text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-3.5 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg hover:shadow-green-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            onClick={loginAsGuest}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus size={18} /> Play as Guest
              </>
            )}
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="px-3 text-xs text-stone-500 font-bold uppercase">Or Continue With</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={google}
              className="flex items-center justify-center gap-2.5 px-4 py-3 bg-bgDark hover:bg-stone-800 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              <img src="/google.svg" alt="Google" className="w-4 h-4" />
              <span>Google</span>
            </button>

            <button
              onClick={github}
              className="flex items-center justify-center gap-2.5 px-4 py-3 bg-bgDark hover:bg-stone-800 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              <img src="/github.svg" alt="GitHub" className="w-4 h-4" />
              <span>GitHub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
