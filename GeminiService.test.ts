
/**
 * Testovi za GeminiService (Vitest/Jest)
 * Napomena: Ovi testovi simuliraju API pozive kako bi provjerili logiku servisa.
 */
import { describe, it, expect, vi } from 'vitest';
import { GeminiService, QuotaError } from './services/geminiService';

describe('GeminiService Logic Tests', () => {
  
  it('should identify Quota Exhausted errors (429)', async () => {
    // Simuliramo grešku s kvotom kakvu vraća Google API
    const quotaError = new Error("RESOURCE_EXHAUSTED: You exceeded your current quota, retry in 21s");
    
    try {
      // @ts-ignore - pristupamo privatnoj metodi za potrebe testa
      await GeminiService.handleApiError(quotaError);
    } catch (err: any) {
      expect(err).toBeInstanceOf(QuotaError);
      expect(err.message).toContain("Free Tier Quota Exceeded");
      expect(err.retryAfterSeconds).toBe(21);
    }
  });

  it('should correctly format wait time from error strings', async () => {
    const errorWithWait = new Error("Please retry in 48.484170651s.");
    
    try {
      // @ts-ignore
      await GeminiService.handleApiError(errorWithWait);
    } catch (err: any) {
      expect(err.retryAfterSeconds).toBe(49); // Zaokruživanje na gore
    }
  });

  it('should fallback to default error if no specific match is found', async () => {
    const randomError = new Error("Network Disconnected");
    
    try {
      // @ts-ignore
      await GeminiService.handleApiError(randomError);
    } catch (err: any) {
      expect(err).not.toBeInstanceOf(QuotaError);
      expect(err.message).toBe("Network Disconnected");
    }
  });

});
