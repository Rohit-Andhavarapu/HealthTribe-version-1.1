import { Router, Request, Response } from "express";
import { whatsAppAdapter } from "../adapter/WhatsAppAdapter";
import { asyncEventQueue } from "../../../domain/queue/AsyncEventQueue";
import { domainIntentRouter } from "../../../domain/router/DomainIntentRouter";

const router = Router();

/**
 * Meta Webhook Verification Endpoint (GET)
 */
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const validTokens = new Set([
    process.env.WHATSAPP_VERIFY_TOKEN,
    "healthtribe_secret_verify_token_2026",
    "healthtribe_whatsapp_verify_2026",
  ].filter(Boolean));

  if (mode === "subscribe" && token && validTokens.has(token as string)) {
    console.log("[WhatsApp Webhook] Verification successful!");
    return res.status(200).send(challenge);
  } else {
    console.warn("[WhatsApp Webhook] Verification failed. Token mismatch.");
    return res.status(403).json({ error: "Verification token mismatch" });
  }
});

/**
 * Meta Webhook Message Receiver (POST)
 */
router.post("/webhook", async (req: Request, res: Response) => {
  // CRITICAL REQUIREMENT: Immediately acknowledge Meta webhook with 200 OK
  res.status(200).send("EVENT_RECEIVED");

  try {
    const normalized = await whatsAppAdapter.normalizeWebhookEvent(req.body);
    if (normalized) {
      const { command, senderId } = normalized;
      console.log(`[WhatsApp Webhook] Received message event from ${senderId}. Pushing command ${command.commandId} to AsyncEventQueue.`);

      // Push to non-blocking async event queue for worker processing
      asyncEventQueue.push(command, senderId);
    }
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error processing event:", err?.message || err);
  }
});

/**
 * Test & Simulation Endpoint for Development / HealthTribe UI (POST)
 */
router.post("/test", async (req: Request, res: Response) => {
  const { senderId = "15550198822", message = "Hello HealthTribe", type = "CHAT" } = req.body;

  const command = {
    commandId: `test-${Date.now()}`,
    channelId: "whatsapp",
    senderId,
    timestamp: new Date().toISOString(),
    type: type as any,
    payload: {
      query: message,
    },
    capabilities: whatsAppAdapter.capabilities,
  };

  try {
    const response = await domainIntentRouter.route(command);
    return res.json({
      success: true,
      senderId,
      requestCommand: command,
      domainResponse: response,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to process test command" });
  }
});

export default router;
