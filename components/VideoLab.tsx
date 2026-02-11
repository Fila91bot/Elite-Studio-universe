
import React, { useState, useRef } from 'react';
import { VideoTask } from '../types';

interface VideoLabProps {
  tasks: VideoTask[];
  onGenerate: (prompt: string, resolution: '720p' | '1080p', aspectRatio: '16:9' | '9:16', useHighQuality: boolean, sourceImage?: string) => Promise<void>;
  freeCreditsRemaining: number;
  onOpenBilling: () => void;
}

const VideoLab: React.FC<VideoLabProps> = ({ tasks, onGenerate, freeCreditsRemaining, onOpenBilling }) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [useHighQualityModel, setUseHighQualityModel] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOutOfCredits = freeCreditsRemaining <= 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (isOutOfCredits) {
      onOpenBilling();
      return;
    }
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onGenerate(prompt, resolution, aspectRatio, useHighQualityModel, sourceImage || undefined);
      setPrompt('');
      setSourceImage(null);
    } catch (err) {
      console.error(err);
      alert("Failed to initiate generation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h3 className="text-2xl font-bold text-white">Cinematic Motion Designer</h3>
              {freeCreditsRemaining !== Infinity && (
                <div className="flex items-center gap-2 px-3 py-1 bg-violet-600/20 border border-violet-500/30 rounded-full">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOutOfCredits ? 'bg-red-500' : 'bg-violet-400 animate-pulse'}`}></div>
                  <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">
                    {isOutOfCredits ? '0 Free Credits Left' : `${freeCreditsRemaining} Free Trial Credits`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
              <span className={`text-xs font-bold transition-colors ${!useHighQualityModel ? 'text-indigo-400' : 'text-slate-500'}`}>FAST</span>
              <button
                onClick={() => setUseHighQualityModel(!useHighQualityModel)}
                className={`w-10 h-5 rounded-full relative transition-colors ${useHighQualityModel ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${useHighQualityModel ? 'left-6' : 'left-1'}`}></div>
              </button>
              <span className={`text-xs font-bold transition-colors ${useHighQualityModel ? 'text-indigo-400' : 'text-slate-500'}`}>PRO</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Image Upload Zone */}
            <div className="lg:col-span-1">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-[16/9] lg:aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${sourceImage ? 'border-indigo-500/50 bg-slate-900' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900'}`}
              >
                {sourceImage ? (
                  <>
                    <img src={sourceImage} className="w-full h-full object-cover" alt="Source" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Animate Source Image</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            {/* Controls Zone */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={sourceImage ? "Describe how you want this image to move..." : "Describe a cinematic scene from scratch..."}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] resize-none"
              />
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Aspect:</span>
                  <button 
                    onClick={() => setAspectRatio('16:9')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    16:9 Landscape
                  </button>
                  <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    9:16 Portrait
                  </button>
                </div>

                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                </select>

                <button
                  onClick={handleGenerate}
                  disabled={isSubmitting || (!prompt.trim() && !sourceImage && !isOutOfCredits)}
                  className={`flex-1 min-w-[200px] py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 ${
                    isOutOfCredits 
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white'
                  }`}
                >
                  {isSubmitting ? 'Initiating Pipeline...' : isOutOfCredits ? 'Unlock Unlimited Access' : sourceImage ? 'Animate Image with Veo' : 'Generate Video'}
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">
            {isOutOfCredits 
              ? 'Free monthly limit reached. Please connect a billing account to continue using Veo models.'
              : `Note: Animation engine optimized for ${aspectRatio} format. Source image will be used as the starting frame.`
            }
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pb-12 scroll-smooth">
          {tasks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-800 space-y-4 border-2 border-dashed border-slate-900 rounded-3xl">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-widest">Studio Pipeline Standby</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {tasks.map(task => (
                <div key={task.id} className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col group transition-all">
                  {task.status === 'processing' ? (
                    <div className="w-full aspect-video bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent animate-pulse"></div>
                      <div className="w-16 h-16 border-4 border-slate-800 rounded-full relative z-10">
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div className="mt-6 text-center z-10">
                        <p className="text-white font-medium animate-pulse">{task.progressMessage}</p>
                        <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">{task.resolution} Master Render</p>
                      </div>
                    </div>
                  ) : task.status === 'failed' ? (
                    <div className="w-full aspect-video bg-red-950/20 flex flex-col items-center justify-center p-8 text-center">
                      <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-red-400 font-medium">{task.progressMessage}</p>
                    </div>
                  ) : (
                    <video src={task.url} controls className="w-full aspect-video bg-black" />
                  )}
                  
                  <div className="p-6">
                    <p className="text-slate-400 text-sm italic font-medium">"{task.prompt}"</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                        {task.status === 'completed' ? 'VEO ENGINE OUTPUT' : 'IN PRODUCTION'}
                      </span>
                      {task.url && (
                        <a href={task.url} download className="text-indigo-400 text-xs hover:underline">Download MP4</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoLab;
