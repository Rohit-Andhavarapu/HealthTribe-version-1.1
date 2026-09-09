import Groq from "groq-sdk";
import { AIProvider, GenerateContentParams } from "./AIProvider";

const VERIFIED_GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
  "groq/compound",
  "llama-3.1-8b-instant"
];

const DEPRECATED_GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768"
]);

export class GroqProvider implements AIProvider {
  private groq: Groq | null = null;
  private candidateModels: string[] = [];
  private activeModel: string = "openai/gpt-oss-120b";

  constructor() {
    this.initModelCandidates();
    this.getClient();
  }

  private initModelCandidates() {
    const preferred = process.env.GROQ_MODEL?.trim();
    if (preferred && !DEPRECATED_GROQ_MODELS.has(preferred)) {
      this.candidateModels = [preferred, ...VERIFIED_GROQ_MODELS.filter(m => m !== preferred)];
      this.activeModel = preferred;
    } else {
      this.candidateModels = [...VERIFIED_GROQ_MODELS];
      this.activeModel = VERIFIED_GROQ_MODELS[0];
      if (preferred && DEPRECATED_GROQ_MODELS.has(preferred)) {
        console.warn(`[GroqProvider] Notice: '${preferred}' is deprecated or unavailable on Groq. Using verified working model '${this.activeModel}'.`);
      }
    }
  }

  private getClient(): Groq | null {
    if (!this.groq && process.env.GROQ_API_KEY) {
      const GROQ_KEY = process.env.GROQ_API_KEY.trim();
      try {
        this.groq = new Groq({ apiKey: GROQ_KEY });
        console.log(`GroqProvider initialized successfully with active model: ${this.activeModel}`);
      } catch (err) {
        console.error("Failed to initialize Groq Client in Provider:", err);
      }
    }
    return this.groq;
  }

  public isAvailable(): boolean {
    const key = process.env.GROQ_API_KEY;
    if (!key || key.includes("your_groq_api_key") || key.trim().length < 20) {
      return false;
    }
    return this.getClient() !== null;
  }

  public async generateContent(params: GenerateContentParams): Promise<string> {
    const client = this.getClient();
    if (!client) {
      throw new Error("AI provider is not initialized (missing API key)");
    }

    const messages: any[] = [];

    if (params.systemInstruction) {
      messages.push({ role: "system", content: params.systemInstruction });
    }

    if (params.messages) {
      for (const m of params.messages) {
        const content = m.parts.map(p => p.text).join("\n");
        messages.push({
          role: m.role === "model" ? "assistant" : (m.role === "user" ? "user" : m.role),
          content: content
        });
      }
    } else if (params.prompt) {
      let content = "";
      if (Array.isArray(params.prompt)) {
        content = params.prompt.map((p: any) => p.text).join("\n");
      } else {
        content = params.prompt;
      }
      messages.push({ role: "user", content });
    }

    const modelsToTry = [
      this.activeModel,
      ...this.candidateModels.filter(m => m !== this.activeModel)
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const request: any = {
          model: modelName,
          messages: messages,
        };

        if (params.responseMimeType === "application/json") {
          request.response_format = { type: "json_object" };
        }

        const response = await this.groq!.chat.completions.create(request);
        this.activeModel = modelName;
        return response.choices[0]?.message?.content || "";
      } catch (err: any) {
        lastError = err;
        const isModelUnavailable = err.status === 404 || err.code === "model_not_found" ||
          (err.message && (err.message.includes("model_not_found") || err.message.includes("does not exist") || err.message.includes("404")));
        const isTemporary = err.status === 503 || err.status === 429 || err.code === 503 || err.code === 429 ||
          (err.message && (err.message.includes("rate limit") || err.message.includes("capacity")));

        if (isModelUnavailable || isTemporary) {
          console.warn(`[GroqProvider] Model '${modelName}' unavailable (${err.message || err.code || err.status}). Trying candidate fallback...`);
          continue;
        }

        throw err;
      }
    }

    throw lastError || new Error("All Groq candidate models failed.");
  }
}
