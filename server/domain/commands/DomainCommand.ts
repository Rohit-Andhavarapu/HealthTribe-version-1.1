import { TransportCapabilities } from "../../capabilities/TransportCapabilities";

export type CommandType =
  | "CHAT"
  | "DIAGNOSTIC_UPLOAD"
  | "APPOINTMENT_BOOKING"
  | "ABHA_SYNC"
  | "EMERGENCY_ALERT"
  | "DOCTOR_REVIEW"
  | "MEDICATION_REMINDER";

export interface AttachmentPayload {
  type: "document" | "image" | "audio";
  url?: string;
  mediaId?: string;
  buffer?: Buffer;
  mimeType?: string;
  filename?: string;
}

export interface DomainCommand {
  commandId: string;
  channelId: string; // e.g. 'whatsapp', 'web', 'telegram'
  senderId: string;  // e.g. phone number "+1234567890" or session string
  userId?: string;   // resolved HealthTribe user email or ID
  timestamp: string;
  type: CommandType;
  payload: {
    query?: string;
    mode?: "patient" | "doctor";
    attachments?: AttachmentPayload[];
    appointmentData?: {
      doctorId?: string;
      doctorName?: string;
      specialty?: string;
      slot?: string;
      notes?: string;
    };
    abhaData?: {
      abhaId?: string;
      otp?: string;
    };
    emergencyData?: {
      symptoms?: string;
      location?: string;
    };
    metadata?: Record<string, any>;
  };
  capabilities?: TransportCapabilities;
}

export interface ActionButton {
  id: string;
  title: string;
  payload?: string;
}

export interface CardItem {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  actions?: ActionButton[];
}

export interface DomainResponse {
  commandId: string;
  status: "SUCCESS" | "WARNING" | "ERROR" | "REQUIRES_INPUT";
  text: string;
  buttons?: ActionButton[];
  cards?: CardItem[];
  attachments?: AttachmentPayload[];
  metadata?: Record<string, any>;
}
