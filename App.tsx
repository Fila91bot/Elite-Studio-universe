
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
import { GeminiService } from './services/geminiService';

const USAGE_STORAGE_KEY = 'gemini_studio_usage_stats';
const FREE_VIDEO_LIMIT = 2;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.CHAT);
  const [isApiKeyValidated, setIsApiKeyValidated] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState(true);
  
  const [usageStats, setUsageStats] = useState<UsageStats>(() => {
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
  });

  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);

  useEffect(() => {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usageStats));
  }, [usageStats]);

  const checkApiKey = useCallback(async () => {
    try {
      const studio = (window as any).aistudio;
      if (studio && typeof studio.hasSelectedApiKey === 'function') {
        const hasKey = await studio.hasSelectedApiKey();
        setIsApiKeyValidated(hasKey);
      } else {
        setIsApiKeyValidated(!!process.env.API_KEY);
      }
    } catch (err) {
      console.error("API Key Check Error:", err);
    } finally {
      setCheckingKey(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

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
      prompt: prompt || 'Animating image...',
      status: 'processing',
      progressMessage: 'Initializing pipeline...',
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
        t.id === taskId ? { ...t, status: 'completed', url, progressMessage: 'Finished' } : t
      ));
      
      if (!isApiKeyValidated) {
        incrementVideoUsage();
      }
    } catch (err) {
      console.error("Video task failed:", err);
      setVideoTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'failed', progressMessage: 'Failed to generate' } : t
      ));
    }
  };

  if (checkingKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Authenticating Studio...</p>
        </div>
      </div>
    );
  }

  const hasFreeCredits = usageStats.videoCount < FREE_VIDEO_LIMIT;
  if (!isApiKeyValidated && !hasFreeCredits) {
    return <ApiKeyGuard onKeySelected={handleKeySelected} />;
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
          onOpenBilling={async () => {
            const studio = (window as any).aistudio;
            if (studio) {
              await studio.openSelectKey();
              handleKeySelected();
            }
          }}
        />
      );
      case AppView.SETTINGS: return <SettingsLab />;
      default: return <ChatLab />;
    }
  };

  const activeTasksCount = videoTasks.filter(t => t.status === 'processing').length;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
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
