export interface ConversationalMessage {
  role: "user" | "model" | "assistant";
  text: string;
  timestamp: string;
}

export interface UserSession {
  sessionId: string;
  channelId: string;
  senderId: string; // e.g. phone number "+123456789"
  userEmail?: string;
  sanitizedEmail?: string;
  activeWorkflow?: "NONE" | "AWAITING_DIAGNOSTIC" | "APPOINTMENT_SELECTION" | "ABHA_OTP" | "TRIAGE";
  workflowContext?: Record<string, any>;
  conversationHistory: ConversationalMessage[];
  lastActive: string;
  metadata?: Record<string, any>;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, UserSession> = new Map();
  private phoneToEmailMap: Map<string, string> = new Map();

  private constructor() {
    // Seed default demo phone mapping for test environments
    this.phoneToEmailMap.set("15550198822", "rohitandhavarapu_gmail_com");
    this.phoneToEmailMap.set("15550198823", "sirisa2308_gmail_com");
    this.phoneToEmailMap.set("15550198824", "kilarisupriya25_gmail_com");
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public getSession(channelId: string, senderId: string): UserSession {
    const key = `${channelId.toLowerCase()}:${senderId.replace(/[^0-9a-zA-Z_]/g, "")}`;
    let session = this.sessions.get(key);

    if (!session) {
      const cleanPhone = senderId.replace(/[^0-9]/g, "");
      const resolvedSanitizedEmail = this.phoneToEmailMap.get(cleanPhone) || "rohitandhavarapu_gmail_com";

      session = {
        sessionId: key,
        channelId,
        senderId,
        userEmail: resolvedSanitizedEmail.replace(/_/g, "@"),
        sanitizedEmail: resolvedSanitizedEmail,
        activeWorkflow: "NONE",
        workflowContext: {},
        conversationHistory: [],
        lastActive: new Date().toISOString(),
      };
      this.sessions.set(key, session);
    } else {
      session.lastActive = new Date().toISOString();
    }

    return session;
  }

  public linkPhoneToAccount(phoneNumber: string, sanitizedEmail: string): void {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    this.phoneToEmailMap.set(cleanPhone, sanitizedEmail);
  }

  public updateSession(session: UserSession): void {
    session.lastActive = new Date().toISOString();
    this.sessions.set(session.sessionId, session);
  }

  public addMessage(session: UserSession, role: "user" | "model" | "assistant", text: string): void {
    session.conversationHistory.push({
      role,
      text,
      timestamp: new Date().toISOString(),
    });
    // Keep last 15 messages for conversational context
    if (session.conversationHistory.length > 15) {
      session.conversationHistory = session.conversationHistory.slice(-15);
    }
    this.updateSession(session);
  }

  public resetWorkflow(session: UserSession): void {
    session.activeWorkflow = "NONE";
    session.workflowContext = {};
    this.updateSession(session);
  }
}

export const sessionManager = SessionManager.getInstance();
