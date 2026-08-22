export interface CapabilityOptions {
  text?: boolean;
  images?: boolean;
  documents?: boolean;
  audio?: boolean;
  interactiveButtons?: boolean;
  cards?: boolean;
  maxTextLength?: number;
  supportsMarkdown?: boolean;
  supportsHtml?: boolean;
  supportsLocation?: boolean;
}

export class TransportCapabilities {
  public readonly text: boolean;
  public readonly images: boolean;
  public readonly documents: boolean;
  public readonly audio: boolean;
  public readonly interactiveButtons: boolean;
  public readonly cards: boolean;
  public readonly maxTextLength: number;
  public readonly supportsMarkdown: boolean;
  public readonly supportsHtml: boolean;
  public readonly supportsLocation: boolean;

  constructor(options: CapabilityOptions = {}) {
    this.text = options.text ?? true;
    this.images = options.images ?? false;
    this.documents = options.documents ?? false;
    this.audio = options.audio ?? false;
    this.interactiveButtons = options.interactiveButtons ?? false;
    this.cards = options.cards ?? false;
    this.maxTextLength = options.maxTextLength ?? 4000;
    this.supportsMarkdown = options.supportsMarkdown ?? false;
    this.supportsHtml = options.supportsHtml ?? false;
    this.supportsLocation = options.supportsLocation ?? false;
  }

  public hasCapability(feature: keyof CapabilityOptions): boolean {
    return Boolean(this[feature]);
  }

  /**
   * Formats text according to transport capabilities (e.g. converting headings for chat).
   */
  public formatText(rawText: string): string {
    if (!rawText) return "";
    let text = rawText;

    // Truncate if exceeds max length
    if (text.length > this.maxTextLength) {
      text = text.substring(0, this.maxTextLength - 3) + "...";
    }

    return text;
  }
}
