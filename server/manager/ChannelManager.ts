import { TransportCapabilities } from "../capabilities/TransportCapabilities";
import { DomainResponse } from "../domain/commands/DomainCommand";

export interface ChannelAdapter {
  readonly id: string;
  readonly capabilities: TransportCapabilities;
  sendResponse(targetId: string, response: DomainResponse): Promise<boolean>;
  isHealthy?(): Promise<boolean>;
}

export class ChannelManager {
  private static instance: ChannelManager;
  private adapters: Map<string, ChannelAdapter> = new Map();

  private constructor() {}

  public static getInstance(): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }

  public registerAdapter(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.id.toLowerCase(), adapter);
    console.log(`[ChannelManager] Registered channel adapter: ${adapter.id}`);
  }

  public getAdapter(channelId: string): ChannelAdapter | undefined {
    return this.adapters.get(channelId.toLowerCase());
  }

  public getCapabilities(channelId: string): TransportCapabilities | undefined {
    return this.adapters.get(channelId.toLowerCase())?.capabilities;
  }

  public async sendDomainResponse(
    channelId: string,
    targetId: string,
    response: DomainResponse,
    maxRetries = 2
  ): Promise<boolean> {
    const adapter = this.getAdapter(channelId);
    if (!adapter) {
      console.error(`[ChannelManager] No adapter registered for channel '${channelId}'`);
      return false;
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const success = await adapter.sendResponse(targetId, response);
        if (success) {
          console.log(`[ChannelManager] Response sent successfully to ${targetId} via ${channelId}`);
          return true;
        }
      } catch (err: any) {
        console.error(`[ChannelManager] Error sending response via ${channelId} (attempt ${attempt + 1}):`, err?.message || err);
      }
      attempt++;
      if (attempt <= maxRetries) {
        await new Promise((res) => setTimeout(res, 1000 * attempt));
      }
    }

    console.error(`[ChannelManager] Failed to send domain response after ${maxRetries + 1} attempts to ${targetId} via ${channelId}`);
    return false;
  }

  public getRegisteredChannels(): string[] {
    return Array.from(this.adapters.keys());
  }
}

export const channelManager = ChannelManager.getInstance();
