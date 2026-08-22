export interface GenerateContentParams {
  prompt?: string;
  messages?: { role: string; parts: { text: string }[] }[];
  systemInstruction?: string;
  responseMimeType?: string;
}

export interface AIProvider {
  isAvailable?(): boolean;
  generateContent(params: GenerateContentParams): Promise<string>;
}
