import Groq from "groq-sdk";
import { AIProvider, GenerateContentParams } from "./AIProvider";

export class GroqProvider implements AIProvider {
  private groq: Groq | null = null;
  private model: string = "openai/gpt-oss-120b";

  constructor() {
    this.getClient();
  }

  private getClient(): Groq | null {
    if (!this.groq && process.env.GROQ_API_KEY) {
      const GROQ_KEY = process.env.GROQ_API_KEY.trim();
      if (process.env.GROQ_MODEL) {
        this.model = process.env.GROQ_MODEL;
      }
      try {
        this.groq = new Groq({ apiKey: GROQ_KEY });
        console.log(`GroqProvider initialized successfully with model: ${this.model}`);
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

    const request: any = {
      model: this.model,
      messages: messages,
    };

    if (params.responseMimeType === "application/json") {
      request.response_format = { type: "json_object" };
    }

    const response = await this.groq.chat.completions.create(request);
    return response.choices[0]?.message?.content || "";
  }
}
