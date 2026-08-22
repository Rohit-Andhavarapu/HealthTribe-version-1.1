import { DomainCommand } from "../commands/DomainCommand";
import { domainIntentRouter } from "../router/DomainIntentRouter";
import { channelManager } from "../../manager/ChannelManager";

export interface QueueJob {
  id: string;
  command: DomainCommand;
  targetId: string;
  createdAt: number;
}

export class AsyncEventQueue {
  private static instance: AsyncEventQueue;
  private queue: QueueJob[] = [];
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): AsyncEventQueue {
    if (!AsyncEventQueue.instance) {
      AsyncEventQueue.instance = new AsyncEventQueue();
    }
    return AsyncEventQueue.instance;
  }

  public push(command: DomainCommand, targetId: string): void {
    const job: QueueJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      command,
      targetId,
      createdAt: Date.now(),
    };

    this.queue.push(job);
    console.log(`[AsyncEventQueue] Pushed job ${job.id} to queue. Queue length: ${this.queue.length}`);

    // Process asynchronously without blocking the caller
    setImmediate(() => this.processNext());
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const job = this.queue.shift();

    if (job) {
      try {
        console.log(`[AsyncEventQueue] Processing job ${job.id} for command ${job.command.type}`);
        
        // 1. Route domain command
        const response = await domainIntentRouter.route(job.command);

        // 2. Dispatch response back via ChannelManager
        await channelManager.sendDomainResponse(
          job.command.channelId,
          job.targetId,
          response
        );
      } catch (err: any) {
        console.error(`[AsyncEventQueue] Error processing job ${job.id}:`, err?.message || err);
      }
    }

    this.isProcessing = false;

    if (this.queue.length > 0) {
      setImmediate(() => this.processNext());
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const asyncEventQueue = AsyncEventQueue.getInstance();
