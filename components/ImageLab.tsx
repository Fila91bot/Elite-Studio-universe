
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { GeminiService } from '../services/geminiService';

const ImageLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [modelType, setModelType] = useState<'flash' | 'pro' | 'imagen'>('flash');

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const url = await GeminiService.generateImage(prompt, modelType);
      setImages(prev => [{
        id: Date.now().toString(),
        url,
        prompt,
        timestamp: Date.now()
      }, ...prev]);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert("Image generation failed. Ensure your API key has billing enabled.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 bg-slate-950 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 overflow-hidden">
          {/* Main Controls */}
          <div className="md:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <h3 className="text-lg font-semibold text-white">Visual Composer</h3>
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A cinematic drone shot of a neon cyberpunk garden..."
                  className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Generation Engine</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setModelType('flash')}
                      className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${modelType === 'flash' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      Gemini Flash (Balanced)
                    </button>
                    <button 
                      onClick={() => setModelType('pro')}
                      className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${modelType === 'pro' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      Gemini Pro (Smart)
                    </button>
                    <button 
                      onClick={() => setModelType('imagen')}
                      className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${modelType === 'imagen' ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      Imagen 4 (Ultra HD / DALL-E)
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    'Synthesize Image'
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <p className="text-xs text-indigo-400 leading-relaxed">
                <strong>Note:</strong> Imagen 4 and Pro generation requires an active billing project with higher quotas.
              </p>
            </div>
          </div>

          {/* Gallery View */}
          <div className="md:col-span-2 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {images.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4 border-2 border-dashed border-slate-900 rounded-3xl">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm uppercase tracking-widest font-medium">Gallery empty - awaiting creation</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {images.map(img => (
                    <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                      <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                        <p className="text-xs text-slate-300 line-clamp-2">{img.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageLab;
