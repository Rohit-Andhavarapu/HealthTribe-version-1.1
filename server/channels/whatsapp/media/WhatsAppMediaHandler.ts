export class WhatsAppMediaHandler {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  }

  /**
   * Fetches media binary buffer from Meta API using media ID
   */
  public async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (!this.accessToken || !mediaId) {
      console.warn(`[WhatsAppMediaHandler] Missing access token or mediaId (${mediaId})`);
      return null;
    }

    try {
      // 1. Get media URL
      const metaUrl = `https://graph.facebook.com/v21.0/${mediaId}`;
      const metaRes = await fetch(metaUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!metaRes.ok) {
        console.error(`[WhatsAppMediaHandler] Failed to get media URL for ${mediaId}`);
        return null;
      }

      const metaData = await metaRes.json();
      const downloadUrl = metaData.url;
      const mimeType = metaData.mime_type || "application/octet-stream";

      if (!downloadUrl) return null;

      // 2. Download actual binary
      const mediaRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!mediaRes.ok) {
        console.error(`[WhatsAppMediaHandler] Failed to download media binary from ${downloadUrl}`);
        return null;
      }

      const arrayBuffer = await mediaRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[WhatsAppMediaHandler] Successfully downloaded media ${mediaId} (${buffer.length} bytes, ${mimeType})`);
      return { buffer, mimeType };
    } catch (err: any) {
      console.error(`[WhatsAppMediaHandler] Error downloading media ${mediaId}:`, err?.message || err);
      return null;
    }
  }
}

export const whatsAppMediaHandler = new WhatsAppMediaHandler();
