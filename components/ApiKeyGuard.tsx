
import React from 'react';

interface ApiKeyGuardProps {
  onKeySelected: () => void;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ onKeySelected }) => {
  const handleSelectKey = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        // Assuming success as per instructions to avoid race conditions
        onKeySelected();
      } else {
        alert("This app requires the Google AI Studio environment to facilitate API key selection for premium models.");
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
          <h2 className="text-2xl font-bold text-white">Studio Authentication</h2>
          <p className="text-slate-400">Premium creative tools (Veo, Gemini 3 Pro) require a pay-as-you-go API key.</p>
        </div>

        <button
          onClick={handleSelectKey}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
        >
          Select Studio API Key
        </button>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            A link to the billing documentation (<a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline text-indigo-400">ai.google.dev/billing</a>) must be provided in the dialog.
          </p>
          <p className="text-[10px] text-slate-700 uppercase tracking-widest font-bold">Secure Hardware-Accelerated Tunnel</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyGuard;
