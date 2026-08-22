import { DomainCommand, DomainResponse } from "../commands/DomainCommand";
import { sessionManager } from "../session/SessionManager";
import { healthTribeDomainEngine } from "../workflows/HealthTribeDomainEngine";

export class DomainIntentRouter {
  private static instance: DomainIntentRouter;

  private constructor() {}

  public static getInstance(): DomainIntentRouter {
    if (!DomainIntentRouter.instance) {
      DomainIntentRouter.instance = new DomainIntentRouter();
    }
    return DomainIntentRouter.instance;
  }

  public async route(command: DomainCommand): Promise<DomainResponse> {
    console.log(`[DomainIntentRouter] Routing command '${command.type}' from channel '${command.channelId}' (sender: ${command.senderId})`);

    // 1. Fetch or create session
    const session = sessionManager.getSession(command.channelId, command.senderId);

    // 2. Add incoming message to session history if text query present
    if (command.payload.query) {
      sessionManager.addMessage(session, "user", command.payload.query);
    }

    // 3. Delegate execution to domain engine
    const response = await healthTribeDomainEngine.executeCommand(command, session);

    // 4. Record output in session history
    if (response.text) {
      sessionManager.addMessage(session, "model", response.text);
    }

    return response;
  }
}

export const domainIntentRouter = DomainIntentRouter.getInstance();
