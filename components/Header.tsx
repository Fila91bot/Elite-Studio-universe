
import React, { useEffect, useState } from 'react';
import { AppView } from '../types';

interface HeaderProps {
  activeView: AppView;
  activeTasksCount?: number;
}

const Header: React.FC<HeaderProps> = ({ activeView, activeTasksCount = 0 }) => {
  const [load, setLoad] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoad(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(8, Math.min(prev + change, 45));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    switch (activeView) {
      case AppView.CHAT: return 'Conversational Intelligence';
      case AppView.LIVE: return 'Real-time Audio Engine';
      case AppView.IMAGE: return 'Creative Visual Generation';
      case AppView.VIDEO: return 'Cinematic Motion Engine';
      case AppView.SETTINGS: return 'Studio Configuration';
      default: return 'Elite Studio';
    }
  };

  const getModel = () => {
    switch (activeView) {
      case AppView.CHAT: return 'Gemini 3 Pro';
      case AppView.LIVE: return 'Gemini 2.5 Flash Native';
      case AppView.IMAGE: return 'Imagen 4 Ultra';
      case AppView.VIDEO: return 'Veo 3.1 Pro';
      default: return '';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-xl z-30 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-white tracking-tight">{getTitle()}</h2>
        <div className="h-4 w-[1px] bg-slate-800"></div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{getModel()}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Compute Load</span>
            <span className="text-[10px] font-mono text-indigo-400 w-8 text-right">{load}%</span>
          </div>
          <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-1000 ease-in-out" 
              style={{ width: `${load}%` }}
            ></div>
          </div>
        </div>

        {activeTasksCount > 0 && (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Rendering ({activeTasksCount})</span>
            <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-white">Pro Producer</p>
            <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Verified Studio ID</p>
          </div>
          <img className="w-8 h-8 rounded-full ring-2 ring-slate-800 hover:ring-indigo-500 transition-all cursor-pointer" src="https://picsum.photos/64/64?seed=studio" alt="avatar" />
        </div>
      </div>
    </header>
  );
};

export default Header;
