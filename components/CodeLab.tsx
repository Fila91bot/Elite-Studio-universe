import React, { useState, useRef } from 'react';
import { CodeTask, CodeAnalysisResult } from '../types';
import { GeminiService } from '../services/geminiService';

const CodeLab: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [selectedMode, setSelectedMode] = useState<'review' | 'document' | 'optimize'>('review');
  const [isProcessing, setIsProcessing] = useState(false);
  const [codeHistory, setCodeHistory] = useState<CodeTask[]>([]);
  const [currentResult, setCurrentResult] = useState<CodeAnalysisResult | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'rust', label: 'Rust' },
    { value: 'go', label: 'Go' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCode(reader.result as string);
        const ext = file.name.split('.').pop()?.toLowerCase();
        const extMap: Record<string, string> = {
          'ts': 'typescript', 'js': 'javascript', 'py': 'python', 'java': 'java',
          'cpp': 'cpp', 'c': 'cpp', 'rs': 'rust', 'go': 'go',
          'html': 'html', 'css': 'css', 'json': 'json'
        };
        if (ext && extMap[ext]) setLanguage(extMap[ext]);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyzeCode = async () => {
    if (!code.trim() || isProcessing) return;

    setIsProcessing(true);
    setProgressMessage('Inicijalizacija analize...');
    const taskId = Date.now().toString();

    try {
      let result = '';

      if (selectedMode === 'review') {
        setProgressMessage('Analiziranje koda za greške i probleme...');
        result = await GeminiService.analyzeCode(code, language);
      } else if (selectedMode === 'document') {
        setProgressMessage('Generisanje dokumentacije...');
        result = await GeminiService.generateDocumentation(code, language);
      } else if (selectedMode === 'optimize') {
        setProgressMessage('Optimizacija koda...');
        result = await GeminiService.optimizeCode(code, language);
      }

      const newResult: CodeAnalysisResult = {
        id: taskId,
        code,
        language,
        analysis: result,
        issues: [],
        documentation: selectedMode === 'document' ? result : '',
        timestamp: Date.now(),
      };

      setCurrentResult(newResult);
      setCodeHistory(prev => [{ 
        id: taskId, 
        code, 
        language, 
        status: 'completed', 
        mode: selectedMode,
        progressMessage: 'Analiza gotova',
        result: newResult,
        timestamp: Date.now()
      }, ...prev]);
    } catch (err: any) {
      console.error('Code analysis failed:', err);
      setProgressMessage('Greška pri analizi. Pokušajte ponovno.');
      alert('Analiza nije uspjela: ' + (err?.message || 'Nepoznata greška'));
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopirano u clipboard!');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      <div className="flex-1 flex gap-8 p-8 overflow-hidden">
        
        {/* LEFT PANEL - CODE INPUT */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Programming Language</label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isProcessing}
            placeholder="Zalijepite vaš kod ovdje ili učitajte datoteku..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none custom-scrollbar"
          />

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              📁 Učitaj File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".ts,.js,.py,.java,.cpp,.rs,.go,.html,.css,.json"
              className="hidden"
            />
            <button
              onClick={() => setCode('')}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Obriši
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - ANALYSIS RESULT */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mode Analize</label>
            <div className="grid grid-cols-3 gap-2">
              {(['review', 'document', 'optimize'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    selectedMode === mode
                      ? 'bg-indigo-600 border border-indigo-500 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {mode === 'review' && '🔍 Pregled'}
                  {mode === 'document' && '📚 Docs'}
                  {mode === 'optimize' && '⚡ Optimizuj'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyzeCode}
            disabled={isProcessing || !code.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {progressMessage}
              </>
            ) : (
              '▶ Analiziraj Kod'
            )}
          </button>

          <div className="flex-1 overflow-y-auto bg-slate-900/50 border border-slate-800 rounded-lg p-4 custom-scrollbar">
            {currentResult ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase">Rezultat Analize</h4>
                  <button
                    onClick={() => copyToClipboard(currentResult.analysis)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    📋 Kopiraj
                  </button>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{currentResult.analysis}</p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600">
                <p className="text-[10px] uppercase tracking-widest">Odaberite način analize i analizirajte kod</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY PANEL */}
      {codeHistory.length > 0 && (
        <div className="h-40 border-t border-slate-800 bg-slate-900/50 overflow-x-auto p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Istorija Analiza</p>
          <div className="flex gap-4">
            {codeHistory.map(task => (
              <button
                key={task.id}
                onClick={() => setCurrentResult(task.result || null)}
                className="flex-shrink-0 p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-indigo-500 transition-all"
              >
                <p className="text-[10px] font-bold text-slate-300 uppercase">{task.mode}</p>
                <p className="text-[10px] text-slate-500 mt-1">📝 {task.language.toUpperCase()}</p>
                <p className="text-[8px] text-slate-600 mt-1">{new Date(task.timestamp).toLocaleTimeString()}</p>
                {task.result && (
                  <p className="text-[8px] text-green-400 mt-1">✓ Gotovo</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeLab;