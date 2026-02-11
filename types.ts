
export enum AppView {
  CHAT = 'chat',
  LIVE = 'live',
  IMAGE = 'image',
  VIDEO = 'video',
  SETTINGS = 'settings'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface VideoTask {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressMessage: string;
  url?: string;
  timestamp: number;
  resolution: '720p' | '1080p';
}

export interface UsageStats {
  videoCount: number;
  month: number;
  year: number;
}

declare global {
  interface Window {
    // Note: window.aistudio is already defined by the environment with its own AIStudio type.
    webkitAudioContext: typeof AudioContext;
  }
}
