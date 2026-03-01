export enum AppView {
  CHAT = 'chat',
  LIVE = 'live',
  CODE = 'code',
  SETTINGS = 'settings'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}

export interface CodeAnalysisResult {
  id: string;
  code: string;
  language: string;
  analysis: string;
  issues: CodeIssue[];
  documentation: string;
  timestamp: number;
}

export interface CodeIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface CodeTask {
  id: string;
  code: string;
  language: string;
  status: 'idle' | 'analyzing' | 'documenting' | 'completed' | 'failed';
  mode: 'review' | 'document' | 'optimize';
  progressMessage: string;
  result?: CodeAnalysisResult;
  timestamp: number;
}

export interface UsageStats {
  codeAnalysisCount: number;
  month: number;
  year: number;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}