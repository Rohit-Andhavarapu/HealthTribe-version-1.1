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

    const request: any = {
      model: "gemini-3.7-flash",
      contents: contents,
    };

    if (Object.keys(config).length > 0) {
      request.config = config;
    }

    const response = await this.ai.models.generateContent(request);
    return response.text || "";
  }
}
