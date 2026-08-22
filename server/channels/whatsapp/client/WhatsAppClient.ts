export interface SendWhatsAppTextMessage {
  to: string;
  text: string;
}

export interface SendWhatsAppInteractiveMessage {
  to: string;
  text: string;
  buttons: Array<{ id: string; title: string }>;
}

export interface SendWhatsAppDocumentMessage {
  to: string;
  link?: string;
  caption?: string;
  filename?: string;
}

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "100609346382901";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  }

  public isConfigured(): boolean {
    return Boolean(this.accessToken);
  }

  public async sendTextMessage(to: string, text: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(`[WhatsAppClient SIMULATION] Sending text to ${to}:\n"${text}"`);
      return true;
    }

    const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    };

    return this.postToMeta(url, payload);
  }

  public async sendInteractiveButtons(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(`[WhatsAppClient SIMULATION] Sending buttons to ${to}:\nText: "${text}"\nButtons: ${JSON.stringify(buttons)}`);
      return true;
    }

    const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: {
              id: b.id,
              title: b.title.substring(0, 20), // Max 20 chars per Meta API
            },
          })),
        },
      },
    };

    return this.postToMeta(url, payload);
  }

  public async sendDocument(to: string, link: string, caption?: string, filename?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(`[WhatsAppClient SIMULATION] Sending document to ${to}: ${link}`);
      return true;
    }

    const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "document",
      document: {
        link,
        caption: caption || "",
        filename: filename || "HealthTribe_Document.pdf",
      },
    };

    return this.postToMeta(url, payload);
  }

  private async postToMeta(url: string, payload: any): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[WhatsAppClient] Meta API error (${res.status}):`, errorText);
        return false;
      }

      const data = await res.json();
      console.log(`[WhatsAppClient] Meta API success response:`, JSON.stringify(data));
      return true;
    } catch (err: any) {
      console.error(`[WhatsAppClient] Network exception posting to Meta:`, err?.message || err);
      return false;
    }
  }
}

export const whatsAppClient = new WhatsAppClient();
