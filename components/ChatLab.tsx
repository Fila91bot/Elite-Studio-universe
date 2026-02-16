
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { GeminiService, QuotaError, AuthError } from '../services/geminiService';

const CHAT_STORAGE_KEY = 'elite_studio_chat_history';

const ChatLab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [
      { id: '1', role: 'model', text: 'Elite Studio pipeline online. How can I assist with your creative workflow today?', timestamp: Date.now() }
    ];
  });
  
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [useSearch, setUseSearch] = useState(false);
  const [quotaWait, setQuotaWait] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    let timer: any;
    if (quotaWait !== null && quotaWait > 0) {
      timer = setInterval(() => setQuotaWait(q => (q !== null && q > 0) ? q - 1 : null), 1000);
    }
    return () => clearInterval(timer);
  }, [quotaWait]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImg = attachedImage;
    setInput('');
    setAttachedImage(null);
    setIsTyping(true);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, modelMsg]);

    try {
      let streamedText = "";
      await GeminiService.chatStream(
        currentInput || "Analyze this image", 
        selectedModel, 
        useSearch, 
        currentImg || undefined,
        (chunk) => {
          streamedText += chunk;
          setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: streamedText } : m));
        }
      );
      setQuotaWait(null);
    } catch (err: any) {
      let finalMsg = "An unknown error occurred.";
      if (err instanceof QuotaError) {
        setQuotaWait(err.retryAfterSeconds || 60);
        finalMsg = err.message;
      } else if (err instanceof AuthError) {
        finalMsg = err.message;
      } else {
        finalMsg = err?.message || String(err);
      }
      
      setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: finalMsg } : m));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 max-w-5xl mx-auto border-x border-slate-800/50 relative view-transition">
      <div className="absolute top-4 left-8 right-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Pipeline Active</span>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${showConfig ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          Model Config
        </button>
      </div>

      {showConfig && (
        <div className="absolute top-14 right-8 w-72 p-6 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-40 animate-in fade-in zoom-in duration-200">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Core Engine</h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Select Model</label>
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                <option value="gemini-flash-lite-latest">Gemini Lite</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Search Grounding</span>
              <button
                onClick={() => setUseSearch(!useSearch)}
                className={`w-8 h-4 rounded-full relative transition-colors ${useSearch ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${useSearch ? 'left-4.5' : 'left-0.5'}`}></div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 pt-20 space-y-10 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`relative max-w-[85%] rounded-2xl px-6 py-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-900/40 border border-slate-800/60 text-slate-200'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text || (isTyping && msg.role === 'model' ? "Thinking..." : "")}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl">
        <div className="relative flex items-center gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={quotaWait !== null}
            placeholder={quotaWait ? `Quota exhausted. Please wait ${quotaWait}s...` : "Type your command..."}
            className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || (!input.trim() && !attachedImage) || quotaWait !== null}
            className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatLab;
