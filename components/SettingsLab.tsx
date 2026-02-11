
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';

interface ModelStatus {
  id: string;
  name: string;
  status: 'pending' | 'ok' | 'fail';
}

const SettingsLab: React.FC = () => {
  const [statuses, setStatuses] = useState<ModelStatus[]>([
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Chat)', status: 'pending' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (High-Reasoning)', status: 'pending' },
    { id: 'gemini-2.5-flash-image', name: 'Gemini Flash Image (Gen)', status: 'pending' },
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4 (Ultra Quality)', status: 'pending' },
    { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast (Video)', status: 'pending' },
  ]);
  const [isTesting, setIsTesting] = useState(false);

  const handleKeySelect = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
    }
  };

  const runDiagnostics = async () => {
    setIsTesting(true);
    const newStatuses = [...statuses];
    
    for (let i = 0; i < newStatuses.length; i++) {
      const model = newStatuses[i];
      const ok = await GeminiService.testModelAccess(model.id);
      newStatuses[i].status = ok ? 'ok' : 'fail';
      setStatuses([...newStatuses]);
      await new Promise(r => setTimeout(r, 500)); // Dramatic pause
    }
    setIsTesting(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white">Elite Studio Diagnostics</h2>
          <p className="text-slate-400 text-lg">Detailed hardware and engine validation for professional workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white">Core Auth</h3>
            <button onClick={handleKeySelect} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700">
              Switch API Provider
            </button>
            <button onClick={runDiagnostics} disabled={isTesting} className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
              {isTesting ? 'Validating Pipeline...' : 'Run Full Engine Sweep'}
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 space-y-6">
            <h3 className="text-xl font-bold text-indigo-400">Model Capability Matrix</h3>
            <div className="space-y-3">
              {statuses.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">{s.name}</span>
                  <div className={`w-2 h-2 rounded-full ${s.status === 'ok' ? 'bg-green-500 shadow-[0_0_8px_green]' : s.status === 'fail' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-slate-700 animate-pulse'}`}></div>
                </div>
              ))}
            </div>
            {statuses.some(s => s.status === 'fail') && (
              <p className="text-[10px] text-red-400 uppercase font-bold text-center">Billing required for failed models</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLab;
