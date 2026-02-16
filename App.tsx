
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, VideoTask, UsageStats } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatLab from './components/ChatLab';
import LiveLab from './components/LiveLab';
import ImageLab from './components/ImageLab';
import VideoLab from './components/VideoLab';
import SettingsLab from './components/SettingsLab';
import ApiKeyGuard from './components/ApiKeyGuard';
import { GeminiService, AuthError } from './services/geminiService';

const USAGE_STORAGE_KEY = 'gemini_studio_usage_stats';
const FREE_VIDEO_LIMIT = 2;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.CHAT);
  const [isApiKeyValidated, setIsApiKeyValidated] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const [usageStats, setUsageStats] = useState<UsageStats>(() => {
    try {
      const saved = localStorage.getItem(USAGE_STORAGE_KEY);
      const now = new Date();
      const defaultStats = { videoCount: 0, month: now.getMonth(), year: now.getFullYear() };
      
      if (saved) {
        const parsed = JSON.parse(saved) as UsageStats;
        if (parsed.month !== now.getMonth() || parsed.year !== now.getFullYear()) {
          return defaultStats;
        }
        return parsed;
      }
      return defaultStats;
    } catch (e) {
      return { videoCount: 0, month: new Date().getMonth(), year: new Date().getFullYear() };
    }
  });

  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);

  useEffect(() => {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usageStats));
  }, [usageStats]);

  const checkApiKey = useCallback(async () => {
    // Sigurnosni timeout od 2 sekunde
    const timer = setTimeout(() => {
      setCheckingKey(false);
    }, 2000);

    try {
      const studio = (window as any).aistudio;
      if (studio && typeof studio.hasSelectedApiKey === 'function') {
        // Sandbox okruženje
        const hasKey = await studio.hasSelectedApiKey();
        setIsApiKeyValidated(hasKey);
        setIsStandalone(false);
      } else {
        // Lokalno/Standalone okruženje
        setIsStandalone(true);
        const envKey = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : '';
        setIsApiKeyValidated(!!envKey);
      }
    } catch (err) {
      console.warn("API Key Check failed, defaulting to Restricted Mode.");
      setIsStandalone(true);
    } finally {
      clearTimeout(timer);
      setCheckingKey(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenKeySelection = async () => {
    const studio = (window as any).aistudio;
    if (studio && typeof studio.openSelectKey === 'function') {
      await studio.openSelectKey();
      setIsApiKeyValidated(true);
    } else {
      // Ako smo lokalno, samo osvježi provjeru
      checkApiKey();
    }
  };

  const handleKeySelected = () => {
    setIsApiKeyValidated(true);
  };

  const incrementVideoUsage = () => {
    setUsageStats(prev => ({ ...prev, videoCount: prev.videoCount + 1 }));
  };

  const startVideoGeneration = async (
    prompt: string, 
    resolution: '720p' | '1080p', 
    aspectRatio: '16:9' | '9:16',
    useHighQuality: boolean,
    sourceImage?: string
  ) => {
    const taskId = Date.now().toString();
    const newTask: VideoTask = {
      id: taskId,
      prompt: prompt || 'Mastering Cinematic sequence...',
      status: 'processing',
      progressMessage: 'Initializing Neural Pipeline...',
      timestamp: Date.now(),
      resolution
    };

    setVideoTasks(prev => [newTask, ...prev]);

    try {
      const url = await GeminiService.generateVideo(
        prompt,
        resolution,
        aspectRatio,
        useHighQuality,
        sourceImage,
        (msg) => {
          setVideoTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, progressMessage: msg } : t
          ));
        }
      );

      setVideoTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'completed', url, progressMessage: 'Sequence Finalized' } : t
      ));
      
      if (!isApiKeyValidated) {
        incrementVideoUsage();
      }
    } catch (err) {
      console.error("Video task failed:", err);
      
      if (err instanceof AuthError) {
        setIsApiKeyValidated(false); 
        handleOpenKeySelection();
      }

      setVideoTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'failed', 
          progressMessage: err instanceof Error ? err.message : 'Pipeline Error' 
        } : t
      ));
    }
  };

  if (checkingKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-400 font-bold tracking-widest uppercase text-xs">Validating Environment</p>
        </div>
      </div>
    );
  }

  const hasFreeCredits = usageStats.videoCount < FREE_VIDEO_LIMIT;
  const isPremiumView = [AppView.VIDEO, AppView.IMAGE, AppView.LIVE].includes(activeView);
  
  // Ako nema ključa i nema kredita, pokaži Guard
  if (isPremiumView && !isApiKeyValidated && !hasFreeCredits) {
    return <ApiKeyGuard onKeySelected={handleKeySelected} isStandalone={isStandalone} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case AppView.CHAT: return <ChatLab />;
      case AppView.LIVE: return <LiveLab />;
      case AppView.IMAGE: return <ImageLab />;
      case AppView.VIDEO: return (
        <VideoLab 
          tasks={videoTasks} 
          onGenerate={startVideoGeneration}
          freeCreditsRemaining={isApiKeyValidated ? Infinity : FREE_VIDEO_LIMIT - usageStats.videoCount}
          onOpenBilling={handleOpenKeySelection}
        />
      );
      case AppView.SETTINGS: return <SettingsLab />;
      default: return <ChatLab />;
    }
  };

  const activeTasksCount = videoTasks.filter(t => t.status === 'processing').length;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeView={activeView} activeTasksCount={activeTasksCount} />
        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
