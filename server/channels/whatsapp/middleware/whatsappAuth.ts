import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export function verifyWhatsAppSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers["x-hub-signature-256"] as string;
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // If no app secret configured in local dev environment, skip verification
  if (!appSecret) {
    return next();
  }

  if (!signature) {
    console.warn("[whatsappAuth] Missing X-Hub-Signature-256 header");
    return res.status(401).json({ error: "Missing webhook signature header" });
  }

  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const hmac = crypto.createHmac("sha256", appSecret);
    const expectedSignature = "sha256=" + hmac.update(rawBody).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return next();
    } else {
      console.error("[whatsappAuth] Invalid signature match");
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch (err) {
    console.error("[whatsappAuth] Signature verification error:", err);
    return res.status(401).json({ error: "Signature verification failed" });
  }
}
