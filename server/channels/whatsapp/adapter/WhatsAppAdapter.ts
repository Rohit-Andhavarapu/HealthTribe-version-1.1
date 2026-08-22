import { ChannelAdapter } from "../../../manager/ChannelManager";
import { TransportCapabilities } from "../../../capabilities/TransportCapabilities";
import {
  DomainCommand,
  DomainResponse,
  CommandType,
  AttachmentPayload,
} from "../../../domain/commands/DomainCommand";
import { whatsAppClient } from "../client/WhatsAppClient";
import { WhatsAppMessageFormatter } from "../formatter/WhatsAppMessageFormatter";
import { whatsAppMediaHandler } from "../media/WhatsAppMediaHandler";

export class WhatsAppAdapter implements ChannelAdapter {
  public readonly id = "whatsapp";
  public readonly capabilities: TransportCapabilities;

  constructor() {
    this.capabilities = new TransportCapabilities({
      text: true,
      images: true,
      documents: true,
      audio: true,
      interactiveButtons: true,
      cards: false,
      maxTextLength: 4096,
      supportsMarkdown: true,
      supportsHtml: false,
      supportsLocation: true,
    });
  }

  /**
   * Translates incoming Meta WhatsApp webhook event payload into a normalized HealthTribe DomainCommand
   */
  public async normalizeWebhookEvent(body: any): Promise<{ command: DomainCommand; senderId: string } | null> {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message) return null;

    const senderId = message.from; // Phone number string e.g. "15550198822"
    const messageType = message.type;
    let commandType: CommandType = "CHAT";
    let query = "";
    let attachments: AttachmentPayload[] = [];
    let appointmentData: any = undefined;
    let abhaData: any = undefined;

    if (messageType === "text") {
      query = message.text?.body || "";
    } else if (messageType === "interactive") {
      query = message.interactive?.button_reply?.id || message.interactive?.button_reply?.title || "";
    } else if (messageType === "document") {
      commandType = "DIAGNOSTIC_UPLOAD";
      const mediaId = message.document?.id;
      const filename = message.document?.filename || "lab_report.pdf";
      const mimeType = message.document?.mime_type || "application/pdf";

      let buffer: Buffer | undefined = undefined;
      if (mediaId) {
        const downloaded = await whatsAppMediaHandler.downloadMedia(mediaId);
        if (downloaded) {
          buffer = downloaded.buffer;
        }
      }

      attachments.push({
        type: "document",
        mediaId,
        filename,
        mimeType,
        buffer,
      });
      query = message.document?.caption || `Attached document: ${filename}`;
    } else if (messageType === "image") {
      commandType = "DIAGNOSTIC_UPLOAD";
      const mediaId = message.image?.id;
      const mimeType = message.image?.mime_type || "image/jpeg";

      let buffer: Buffer | undefined = undefined;
      if (mediaId) {
        const downloaded = await whatsAppMediaHandler.downloadMedia(mediaId);
        if (downloaded) {
          buffer = downloaded.buffer;
        }
      }

      attachments.push({
        type: "image",
        mediaId,
        mimeType,
        buffer,
      });
      query = message.image?.caption || "Attached lab image";
    }

    const command: DomainCommand = {
      commandId: message.id || `cmd-${Date.now()}`,
      channelId: this.id,
      senderId,
      timestamp: new Date().toISOString(),
      type: commandType,
      payload: {
        query,
        attachments,
        appointmentData,
        abhaData,
      },
      capabilities: this.capabilities,
    };

    return { command, senderId };
  }

  /**
   * Outbound delivery: sends response back to user's WhatsApp account
   */
  public async sendResponse(targetId: string, response: DomainResponse): Promise<boolean> {
    const formatted = WhatsAppMessageFormatter.prepareWhatsAppPayload(response);

    if (formatted.buttons && formatted.buttons.length > 0) {
      return whatsAppClient.sendInteractiveButtons(targetId, formatted.text, formatted.buttons);
    } else {
      return whatsAppClient.sendTextMessage(targetId, formatted.text);
    }
  }

  public async isHealthy(): Promise<boolean> {
    return true;
  }
}

export const whatsAppAdapter = new WhatsAppAdapter();
