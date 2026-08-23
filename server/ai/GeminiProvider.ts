import { GoogleGenAI } from "@google/genai";
import { AIProvider, GenerateContentParams } from "./AIProvider";

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.getClient();
  }

  private getClient(): GoogleGenAI | null {
    if (!this.ai && process.env.GEMINI_API_KEY) {
      const GEMINI_KEY = process.env.GEMINI_API_KEY.trim();
      try {
        this.ai = new GoogleGenAI({
          apiKey: GEMINI_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        console.log("GeminiProvider initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize Gemini Client in Provider:", err);
      }
    }
    return this.ai;
  }

  public isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("your_gemini_api_key") || key.trim().length < 20) {
      return false;
    }
    return this.getClient() !== null;
  }

  public async generateContent(params: GenerateContentParams): Promise<string> {
    const client = this.getClient();
    if (!client) {
      throw new Error("AI provider is not initialized (missing API key)");
    }

    const config: any = {};
    if (params.systemInstruction) {
      config.systemInstruction = params.systemInstruction;
    }
    if (params.responseMimeType) {
      config.responseMimeType = params.responseMimeType;
    }

    let contents: any[] = [];
    if (params.messages) {
      contents = params.messages;
    } else if (params.prompt) {
      contents = params.prompt as any;
    }

    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.7-flash"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const request: any = {
          model: modelName,
          contents: contents,
        };

        if (Object.keys(config).length > 0) {
          request.config = config;
        }

        const response = await this.ai.models.generateContent(request);
        return response.text || "";
      } catch (err: any) {
        lastError = err;
        const isTemporary = err.status === 503 || err.code === 503 || err.status === "UNAVAILABLE" || err.status === 429 || err.status === "RESOURCE_EXHAUSTED";
        if (isTemporary) {
          console.warn(`[GeminiProvider] Model ${modelName} transient issue (${err.status || err.code || "busy"}). Trying candidate fallback...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error("All Gemini candidate models were unavailable.");
  }
}
