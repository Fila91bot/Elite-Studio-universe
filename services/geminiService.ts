
import { GoogleGenAI, Modality, Type, GenerateContentResponse, LiveServerMessage } from "@google/genai";

export class QuotaError extends Error {
  retryAfterSeconds?: number;
  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'QuotaError';
    this.retryAfterSeconds = retryAfter;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiService {
  private static getAPIKey(): string {
    // 1. Provjeri process.env (Vite/Node standard)
    const envKey = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : '';
    if (envKey) return envKey;

    // 2. Provjeri globalni window (Shim za neke sandboxove)
    const windowKey = (window as any).process?.env?.API_KEY;
    if (windowKey) return windowKey;

    return '';
  }

  private static getAI() {
    const key = this.getAPIKey();
    if (!key) {
      console.warn("GeminiService: API Key missing. App will enter Restricted Mode.");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  public static async handleApiError(err: any): Promise<never> {
    console.error("Gemini API Error:", err);
    
    let errorMsg = "";
    try {
      if (typeof err === 'string') {
        const parsed = JSON.parse(err);
        errorMsg = parsed?.error?.message || err;
      } else {
        errorMsg = err?.message || JSON.stringify(err);
      }
    } catch (e) {
      errorMsg = err?.message || String(err);
    }

    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
      throw new AuthError("Vaš API ključ nema pristup ovom modelu. To se događa ako koristite 'Free Tier' ključ za 'Veo' ili 'Imagen 4' modele.");
    }

    if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429") || errorMsg.includes("quota")) {
      let waitSeconds = 60;
      const match = errorMsg.match(/retry in ([\d\.]+)s/);
      if (match) waitSeconds = Math.ceil(parseFloat(match[1]));
      throw new QuotaError("Kvota je potrošena (429). Molimo pričekajte ili koristite Pay-as-you-go ključ.", waitSeconds);
    }

    if (errorMsg.includes("API key not valid") || errorMsg.includes("401")) {
      throw new AuthError("API ključ nije validan. Molimo provjerite svoju .env datoteku.");
    }

    throw new Error(errorMsg);
  }

  static async chatStream(
    message: string, 
    model: string = 'gemini-3-flash-preview', 
    useSearch: boolean = false,
    imageB64?: string,
    onChunk?: (text: string) => void
  ): Promise<string> {
    try {
      const ai = this.getAI();
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: "You are the Elite Studio AI. Professional, creative, and precise.",
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
        }
      });

      let fullText = "";
      const result = await chat.sendMessageStream({ message: message });
      
      for await (const chunk of result) {
        const chunkText = chunk.text || "";
        fullText += chunkText;
        if (onChunk) onChunk(chunkText);
      }

      return fullText;
    } catch (err) {
      return this.handleApiError(err);
    }
  }

  static async testModelAccess(model: string): Promise<boolean> {
    const key = this.getAPIKey();
    if (!key) return false;
    try {
      const ai = this.getAI();
      await ai.models.generateContent({
        model: model,
        contents: "test",
        config: { maxOutputTokens: 1 }
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  static async generateImage(prompt: string, modelType: 'flash' | 'pro' | 'imagen' = 'flash'): Promise<string> {
    try {
      const ai = this.getAI();
      if (modelType === 'imagen') {
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: prompt,
          config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
        });
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
      }
      const modelName = modelType === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("Missing image payload.");
    } catch (err) {
      return this.handleApiError(err);
    }
  }

  static async generateVideo(
    prompt: string, 
    resolution: '720p' | '1080p', 
    aspectRatio: '16:9' | '9:16', 
    useHighQualityModel: boolean, 
    sourceImage?: string, 
    onProgress?: (msg: string) => void
  ): Promise<string> {
    try {
      const ai = this.getAI();
      const modelName = useHighQualityModel ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
      
      if (onProgress) onProgress(`Connecting to ${modelName}...`);
      
      const config: any = {
        model: modelName,
        prompt: prompt || 'Cinematic movement',
        config: { numberOfVideos: 1, resolution, aspectRatio }
      };

      if (sourceImage) {
        config.image = { 
          imageBytes: sourceImage.split(',')[1], 
          mimeType: sourceImage.split(';')[0].split(':')[1] 
        };
      }

      let operation = await ai.models.generateVideos(config);
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        if (onProgress) onProgress("Veo engine is rendering frame sequences...");
      }

      const key = this.getAPIKey();
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const response = await fetch(`${downloadLink}&key=${key}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      return this.handleApiError(err);
    }
  }

  static async connectLive(callbacks: { onOpen?: () => void; onMessage?: (message: LiveServerMessage) => void; onError?: (e: any) => void; onClose?: (e: any) => void; }) {
    const ai = this.getAI();
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: callbacks.onOpen || (() => {}),
        onmessage: callbacks.onMessage || (() => {}),
        onerror: (e) => { 
          this.handleApiError(e).catch(() => {});
          if (callbacks.onError) callbacks.onError(e); 
        },
        onclose: callbacks.onClose || (() => {}),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        systemInstruction: 'You are the Elite Studio producer, guiding real-time interaction.',
      },
    });
  }
}
