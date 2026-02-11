
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiService, decode, encode, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';

const LiveLab: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const frameIntervalRef = useRef<number | null>(null);

  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(79, 70, 229)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  }, []);

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    cancelAnimationFrame(animationRef.current);
    setIsActive(false);
  }, []);

  const startSession = async () => {
    try {
      cleanup();
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: useCamera });
      streamRef.current = stream;

      if (useCamera && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      drawVisualizer();

      const sessionPromise = GeminiService.connectLive({
        onOpen: () => {
          setIsActive(true);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            sessionPromise.then(session => {
              if (session) session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);

          if (useCamera) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && ctx) {
                canvas.width = 320;
                canvas.height = 240;
                ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
                sessionPromise.then(session => {
                  if (session) session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                });
              }
            }, 1000);
          }
        },
        onMessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            const currentOut = outputAudioContextRef.current;
            if (!currentOut) return;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentOut.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), currentOut, 24000, 1);
            const source = currentOut.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(currentOut.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }
        },
        onError: (e) => { cleanup(); }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      cleanup();
    }
  };

  useEffect(() => { return () => cleanup(); }, [cleanup]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-12 overflow-hidden relative">
      <div className="z-10 flex flex-col items-center gap-6 text-center max-w-2xl w-full">
        <h2 className="text-4xl font-black text-white tracking-tighter italic">ELITE MULTIMODAL ENGINE</h2>
        
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => !isActive && setUseCamera(!useCamera)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${useCamera ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
          >
            Camera: {useCamera ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="relative w-full aspect-video bg-slate-900/50 rounded-3xl border border-slate-800/50 overflow-hidden flex items-center justify-center">
          {useCamera && <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" />}
          <canvas ref={canvasRef} width={800} height={200} className="w-full h-40 opacity-80" />
        </div>

        <button
          onClick={isActive ? cleanup : startSession}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 border-8 ${
            isActive ? 'bg-slate-950 border-red-500 text-red-500 animate-pulse' : 'bg-indigo-600 border-slate-900 text-white shadow-2xl hover:scale-105'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">{isActive ? 'Stop' : 'Connect'}</span>
        </button>
      </div>
    </div>
  );
};

export default LiveLab;
