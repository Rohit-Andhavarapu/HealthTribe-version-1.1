import { AIProvider, GenerateContentParams } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { GroqProvider } from "./GroqProvider";

export class AIService {
  private primaryProvider: AIProvider | null = null;
  private fallbackProvider: AIProvider | null = null;

  constructor() {
    this.initProviders();
  }

  private initProviders() {
    const selectedProvider = (process.env.AI_PROVIDER || "groq").toLowerCase();

    const groq = new GroqProvider();
    const gemini = new GeminiProvider();

    if (selectedProvider === "groq" && groq.isAvailable()) {
      this.primaryProvider = groq;
      if (gemini.isAvailable()) {
        this.fallbackProvider = gemini;
      }
    } else if (gemini.isAvailable()) {
      this.primaryProvider = gemini;
      if (groq.isAvailable()) {
        this.fallbackProvider = groq;
      }
    } else if (groq.isAvailable()) {
      this.primaryProvider = groq;
    }
  }

  public isAvailable(): boolean {
    if (!this.primaryProvider) {
      this.initProviders();
    }
    const isPrimaryAvail = this.primaryProvider !== null && (this.primaryProvider.isAvailable ? this.primaryProvider.isAvailable() : true);
    const isFallbackAvail = this.fallbackProvider !== null && (this.fallbackProvider.isAvailable ? this.fallbackProvider.isAvailable() : true);
    return isPrimaryAvail || isFallbackAvail;
  }

  public async generateContent(params: GenerateContentParams): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("AI service currently unavailable.");
    }

    if (this.primaryProvider) {
      try {
        return await this.retryWithBackoff(() => this.primaryProvider!.generateContent(params));
      } catch (err: any) {
        const isAuthError = err.status === 401 || err.statusCode === 401 || 
          (err.message && (err.message.includes("401") || err.message.includes("invalid_api_key") || err.message.includes("Invalid API Key")));

        if (isAuthError && this.fallbackProvider) {
          console.log(`[AIService] Primary provider authorization failed (401). Switching permanently to fallback provider.`);
          this.primaryProvider = this.fallbackProvider;
          this.fallbackProvider = null;
          return await this.retryWithBackoff(() => this.primaryProvider!.generateContent(params));
        }

        if (this.fallbackProvider) {
          console.warn(`[AIService] Primary provider transient error (${err.message || err}). Attempting fallback provider...`);
          try {
            return await this.retryWithBackoff(() => this.fallbackProvider!.generateContent(params));
          } catch (fallbackErr: any) {
            console.error(`[AIService] Fallback provider also failed (${fallbackErr.message || fallbackErr}).`);
            throw fallbackErr;
          }
        }
        throw err;
      }
    } else if (this.fallbackProvider) {
      return await this.retryWithBackoff(() => this.fallbackProvider!.generateContent(params));
    }

    throw new Error("AI service currently unavailable.");
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const isAuthError = err.status === 401 || err.statusCode === 401 || (err.message && (err.message.includes("401") || err.message.includes("invalid_api_key") || err.message.includes("Invalid API Key")));
      if (isAuthError) {
        throw err;
      }

      const isQuotaOrUnavailable = err.status === "RESOURCE_EXHAUSTED" || err.status === 429 || err.statusCode === 429 || err.status === 503 || err.statusCode === 503 || err.status === "UNAVAILABLE" || (err.message && (err.message.includes("429") || err.message.includes("503") || err.message.includes("quota") || err.message.includes("RESOURCE_EXHAUSTED") || err.message.includes("high demand") || err.message.includes("UNAVAILABLE")));
      if (isQuotaOrUnavailable) {
        // Quota or model demand spike - do not stall with retry loops
        throw err;
      }

      const isNetwork = err.message && (err.message.includes("fetch failed") || err.message.includes("ECONNRESET") || err.message.includes("socket hang up"));
      
      if (retries > 0 && isNetwork) {
        console.log(`[AIService] Network transient error: ${err.message}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw err;
    }
  }
}

export const aiService = new AIService();
