
import React from 'react';

interface ApiKeyGuardProps {
  onKeySelected: () => void;
  isStandalone?: boolean;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ onKeySelected, isStandalone }) => {
  const handleSelectKey = async () => {
    try {
      const studio = (window as any).aistudio;
      if (studio && typeof studio.openSelectKey === 'function') {
        await studio.openSelectKey();
        onKeySelected();
      } else {
        alert("Na PC-u morate postaviti ključ u .env datoteku kao API_KEY=vaš_ključ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full p-10 rounded-[40px] bg-slate-900 border border-slate-800 shadow-2xl space-y-8 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-600/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Elite Authentication</h2>
          <p className="text-slate-400">
            {isStandalone 
              ? "Lokalni rad zahtijeva API ključ postavljen u okruženju sustava." 
              : "Premium kreativni alati zahtijevaju Pay-as-you-go API ključ."}
          </p>
        </div>

        {!isStandalone ? (
          <button
            onClick={handleSelectKey}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
          >
            Select Studio API Key
          </button>
        ) : (
          <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-left space-y-4">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Upute za PC (Standalone):</h4>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>Kreirajte datoteku naziva <code className="text-white font-mono bg-slate-950 px-1 rounded">.env</code> u korijenu mape.</li>
              <li>Unesite: <code className="text-white font-mono bg-slate-950 px-1 rounded">API_KEY=vaš_ključ_ovdje</code></li>
              <li>Restartajte lokalni server (Vite).</li>
            </ol>
            <p className="text-[10px] text-slate-500 italic mt-2">Bez ovoga, premium modeli (Veo, Imagen) neće raditi.</p>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Secure Hardware-Accelerated Session</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyGuard;
