import React from 'react';
import { ArrowLeft, Activity, Radio, Sparkles } from 'lucide-react';
import { User, ActiveScreen } from '../../types';
import { PWAInstallButton } from '../PWAInstallButton';

interface TopAppBarProps {
  user: User | null;
  activeScreen: ActiveScreen;
  onNavigateBack: () => void;
  onOpenProfile: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  user,
  activeScreen,
  onNavigateBack,
  onOpenProfile,
}) => {
  const isSubScreen =
    activeScreen === 'sentence_list' ||
    activeScreen === 'my_recordings' ||
    activeScreen === 'profile_settings' ||
    activeScreen === 'consent' ||
    activeScreen === 'admin_profile';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-teal-100/70 px-4 h-15 flex items-center justify-between gap-3 shadow-[0_2px_12px_rgba(15,118,110,0.03)]">
      {/* Left Slot: Back Button or ReVoice Audio Wordmark */}
      <div className="flex items-center gap-2.5">
        {isSubScreen ? (
          <button
            type="button"
            onClick={onNavigateBack}
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-teal-50/80 transition active:scale-95 border border-slate-200/60"
            aria-label="Navigate back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 ring-2 ring-teal-500/10">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">
              Re<span className="text-teal-600 font-extrabold">Voice</span> Audio
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              Clinical Audio
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium -mt-0.5">
            Healthcare Speech Corpus
          </span>
        </div>
      </div>

      {/* Right Slot: Install Button & User Profile Pill */}
      <div className="flex items-center gap-2">
        <PWAInstallButton />

        {user && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200/80 hover:border-teal-200 transition active:scale-95 shadow-xs group"
            title={`${user.name} (${user.phone || user.email}) - ${user.role === 'admin' ? 'Staff Admin' : 'Participant'}`}
          >
            <div
              className={`w-6 h-6 rounded-lg text-white font-bold text-[11px] flex items-center justify-center shadow-xs ${
                user.role === 'admin'
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 ring-1 ring-indigo-400'
                  : 'bg-gradient-to-tr from-teal-600 to-emerald-500'
              }`}
            >
              {user.name
                .split(' ')
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-xs font-semibold text-slate-800 max-w-[110px] truncate">
                {user.name.split(' ')[0]}
              </span>
              {user.role === 'admin' && (
                <span className="text-[9px] font-bold text-indigo-700 leading-none">
                  Staff Admin
                </span>
              )}
            </div>
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                user.role === 'admin'
                  ? 'bg-indigo-500 ring-2 ring-indigo-200'
                  : 'bg-emerald-500 ring-2 ring-emerald-200'
              }`}
            />
          </button>
        )}
      </div>
    </header>
  );
};
