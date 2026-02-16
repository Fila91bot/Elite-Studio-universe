
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
  private static getAI() {
    // Uvek kreiramo novu instancu kako bismo koristili najnoviji API ključ
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  public static async handleApiError(err: any): Promise<never> {
    const errorMsg = err?.message || JSON.stringify(err);
    console.error("Gemini API Error Context:", err);

    // Ako model nije pronađen, verovatno je problem u projektu/ključu koji nema pristup premium modelima
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404")) {
      throw new AuthError("Pristup odbijen: Ovaj model zahteva plaćeni API ključ iz specifičnog projekta. Molimo odaberite ponovo.");
    }

    if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
      let waitSeconds = undefined;
      const match = errorMsg.match(/retry in ([\d\.]+)s/);
      if (match) waitSeconds = Math.ceil(parseFloat(match[1]));
      throw new QuotaError("Besplatna kvota potrošena. Povežite billing račun da biste nastavili koristiti ove modele.", waitSeconds);
    }

    if (errorMsg.includes("API key not valid")) {
      throw new AuthError("API ključ nije validan. Molimo odaberite validan ključ.");
    }

    throw err;
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
      const parts: any[] = [{ text: message }];
      
      if (imageB64) {
        const [mime, data] = imageB64.split(';base64,');
        parts.unshift({
          inlineData: {
            mimeType: mime.split(':')[1],
            data: data
          }
        });
      }

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: "You are the Elite Studio AI. You provide world-class creative and technical assistance. Be concise, brilliant, and professional.",
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
    try {
      const ai = this.getAI();
      await ai.models.generateContent({
        model: model,
        contents: "test connection",
        config: { maxOutputTokens: 5 }
      });
      return true;
    } catch (e) {
      console.warn(`Test za ${model} nije uspeo:`, e);
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
        config: { imageConfig: { aspectRatio: "1:1", imageSize: modelType === 'pro' ? "1K" : undefined } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("Nema podataka o slici od modela.");
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
      
      if (onProgress) onProgress(`Pokretanje ${modelName} motora...`);
      
      const generationParams: any = {
        model: modelName,
        prompt: prompt || 'Animate this with cinematic motion',
        config: { numberOfVideos: 1, resolution, aspectRatio }
      };

      if (sourceImage) {
        const [header, data] = sourceImage.split(';base64,');
        generationParams.image = { 
          imageBytes: data, 
          mimeType: header.split(':')[1] || 'image/png' 
        };
      }

      let operation = await ai.models.generateVideos(generationParams);
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        if (onProgress) onProgress("Sinteza temporalne konzistentnosti...");
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Generisanje videa završeno ali link nije vraćen.");

      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error(`Greška pri preuzimanju videa: ${response.statusText}`);
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      return this.handleApiError(err);
    }
  }

  static async connectLive(callbacks: { 
    onOpen?: () => void; 
    onMessage?: (message: LiveServerMessage) => void; 
    onError?: (e: any) => void; 
    onClose?: (e: any) => void; 
  }) {
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
        systemInstruction: 'You are an upbeat and creative studio producer. You can see the user through their camera. Be helpful and visionary.',
      },
    });
  }
}
