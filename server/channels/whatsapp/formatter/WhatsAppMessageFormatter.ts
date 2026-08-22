import { DomainResponse } from "../../../domain/commands/DomainCommand";

export class WhatsAppMessageFormatter {
  /**
   * Cleans markdown for WhatsApp rendering
   */
  public static formatText(rawText: string): string {
    if (!rawText) return "";

    let text = rawText;

    // Convert Markdown H1/H2/H3 (# Title, ## Title, ### Title) to WhatsApp *Title*
    text = text.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

    // Clean markdown tables into scannable key-value bullet lists
    if (text.includes("|")) {
      const lines = text.split("\n");
      const cleanLines = lines.map((line) => {
        if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
          // Check if it's separator line like |--|--|
          if (line.includes("---")) return "";
          const cells = line
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean);
          if (cells.length >= 2) {
            return `• *${cells[0]}*: ${cells.slice(1).join(" - ")}`;
          }
        }
        return line;
      });
      text = cleanLines.filter((l) => l !== "").join("\n");
    }

    // Ensure line breaks are preserved
    text = text.trim();

    return text;
  }

  /**
   * Prepares payload for Meta API
   */
  public static prepareWhatsAppPayload(response: DomainResponse) {
    const formattedText = this.formatText(response.text);

    return {
      text: formattedText,
      buttons: response.buttons || [],
      attachments: response.attachments || [],
    };
  }
}
