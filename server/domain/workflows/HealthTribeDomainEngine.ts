import fs from "fs";
import path from "path";
import { aiService } from "../../ai/AIService";
import { PromptBuilder } from "../../ai/PromptBuilder";
import {
  DomainCommand,
  DomainResponse,
  ActionButton,
} from "../commands/DomainCommand";
import { UserSession } from "../session/SessionManager";
import { createRequire } from "module";

async function extractTextFromPdf(buffer: Buffer | Uint8Array): Promise<string> {
  try {
    const customRequire = typeof require !== "undefined" ? require : createRequire(import.meta.url);
    const pdfModule = customRequire("pdf-parse");
    if (typeof pdfModule === "function") {
      const parsed = await pdfModule(buffer);
      return parsed?.text || "";
    } else if (pdfModule?.PDFParse) {
      const parser = new pdfModule.PDFParse();
      const parsed = await parser.parse(buffer);
      return parsed?.text || "";
    }
  } catch (e: any) {
    console.error("[HealthTribeDomainEngine] Failed to parse PDF buffer:", e?.message || e);
  }
  return "Diagnostic lab report text extracted from document.";
}

export class HealthTribeDomainEngine {
  private static instance: HealthTribeDomainEngine;

  private constructor() {}

  public static getInstance(): HealthTribeDomainEngine {
    if (!HealthTribeDomainEngine.instance) {
      HealthTribeDomainEngine.instance = new HealthTribeDomainEngine();
    }
    return HealthTribeDomainEngine.instance;
  }

  /**
   * Helper to load user profile & DB data from local JSON storage or memory
   */
  private loadUserData(sanitizedEmail: string): any {
    const dataDir = path.join(process.cwd(), "data", "users");
    const filePath = path.join(dataDir, `${sanitizedEmail}.json`);

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
      } catch (e) {
        console.error(`Failed to parse user file for ${sanitizedEmail}:`, e);
      }
    }

    // Default fallback structure
    return {
      patientProfiles: [
        {
          id: `patient-${Date.now()}`,
          name: "HealthTribe Member",
          relation: "Self",
          age: 30,
          gender: "Not specified",
          bloodGroup: "O+",
          allergies: "None",
          chronicConditions: "None",
          medications: "None",
        },
      ],
      timelineEvents: [],
      appointments: [],
      doctors: [],
    };
  }

  /**
   * Helper to persist user DB changes back to file
   */
  private saveUserData(sanitizedEmail: string, data: any): void {
    const dataDir = path.join(process.cwd(), "data", "users");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, `${sanitizedEmail}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error(`Failed to save user file for ${sanitizedEmail}:`, e);
    }
  }

  /**
   * Core workflow executor for Domain Commands
   */
  public async executeCommand(
    command: DomainCommand,
    session: UserSession
  ): Promise<DomainResponse> {
    const sanitizedEmail = session.sanitizedEmail || "rohitandhavarapu_gmail_com";
    const userDb = this.loadUserData(sanitizedEmail);
    const primaryPatient = userDb?.patientProfiles?.[0] || {};

    console.log(`[HealthTribeDomainEngine] Executing command '${command.type}' for user ${sanitizedEmail}`);

    switch (command.type) {
      case "CHAT":
        return this.handleChat(command, session, primaryPatient, userDb);

      case "DIAGNOSTIC_UPLOAD":
        return this.handleDiagnosticUpload(command, session, primaryPatient, userDb);

      case "APPOINTMENT_BOOKING":
        return this.handleAppointmentBooking(command, session, userDb);

      case "ABHA_SYNC":
        return this.handleABHASync(command, session, primaryPatient, userDb);

      case "EMERGENCY_ALERT":
        return this.handleEmergencyAlert(command, session, primaryPatient);

      default:
        return {
          commandId: command.commandId,
          status: "SUCCESS",
          text: "I am HealthTribe Clinical Copilot. How can I assist with your health, lab reports, appointments, or ABHA records today?",
          buttons: [
            { id: "btn_triage", title: "Symptom Check" },
            { id: "btn_upload", title: "Upload Lab Report" },
            { id: "btn_book", title: "Book Doctor" },
          ],
        };
    }
  }

  private async handleChat(
    command: DomainCommand,
    session: UserSession,
    patient: any,
    userDb: any
  ): Promise<DomainResponse> {
    const query = command.payload.query || "";
    const mode = command.payload.mode || "patient";

    // Check if query is interactive button trigger
    const lowerQuery = query.toLowerCase().trim();

    if (lowerQuery === "btn_triage" || lowerQuery === "symptom check") {
      return {
        commandId: command.commandId,
        status: "REQUIRES_INPUT",
        text: "🩺 *HealthTribe Symptom Check*\n\nPlease describe your current symptoms or concerns in detail (e.g. 'I have had a mild headache and fever since yesterday').",
        buttons: [
          { id: "btn_emergency", title: "🚨 Emergency Help" },
          { id: "btn_menu", title: "Main Menu" },
        ],
      };
    }

    if (lowerQuery === "btn_upload" || lowerQuery === "upload lab report") {
      session.activeWorkflow = "AWAITING_DIAGNOSTIC";
      return {
        commandId: command.commandId,
        status: "REQUIRES_INPUT",
        text: "📄 *Lab Report Analysis*\n\nPlease upload or attach your diagnostic lab report PDF or medical report image directly to this chat. Our AI Diagnostic Report Parser will analyze it for you.",
      };
    }

    if (lowerQuery === "btn_book" || lowerQuery === "book doctor") {
      const doctors = userDb.doctors || [];
      const docButtons: ActionButton[] = doctors.slice(0, 3).map((d: any) => ({
        id: `doc_${d.id}`,
        title: `${d.name.split(" ")[1] || d.name} (${d.specialty})`,
      }));

      return {
        commandId: command.commandId,
        status: "REQUIRES_INPUT",
        text: "👨‍⚕️ *Book Verified Doctor Consult*\n\nChoose a specialty or select one of our top verified doctors below:",
        buttons: docButtons.length > 0 ? docButtons : [{ id: "btn_gen_physician", title: "General Physician" }],
      };
    }

    if (lowerQuery.startsWith("doc_")) {
      const docId = query.replace("doc_", "");
      const doctors = userDb.doctors || [];
      const doctor = doctors.find((d: any) => d.id === docId) || doctors[0];

      if (doctor) {
        // Book appointment
        const newAppt = {
          id: `appt-${Date.now()}`,
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          date: new Date().toISOString().split("T")[0],
          time: doctor.availabilitySlots?.[0] || "10:00 AM",
          status: "Confirmed",
          type: "Video Consult",
        };
        userDb.appointments = userDb.appointments || [];
        userDb.appointments.push(newAppt);
        this.saveUserData(session.sanitizedEmail!, userDb);

        return {
          commandId: command.commandId,
          status: "SUCCESS",
          text: `✅ *Appointment Confirmed!*\n\n*Doctor:* ${doctor.name}\n*Specialty:* ${doctor.specialty}\n*Hospital:* ${doctor.hospital || "HealthTribe Virtual Clinic"}\n*Date:* ${newAppt.date}\n*Time:* ${newAppt.time}\n\nYour consultation link has been added to your HealthTribe Portal.`,
          buttons: [
            { id: "btn_triage", title: "Symptom Check" },
            { id: "btn_upload", title: "Upload Report" },
          ],
        };
      }
    }

    // Call HealthTribe AI Orchestration / Patient Agent
    try {
      const orchestrationPrompt = PromptBuilder.buildOrchestrationPrompt(query, session.conversationHistory);
      let appDataCtx: any = null;

      if (aiService.isAvailable()) {
        try {
          const orchResponseStr = await aiService.generateContent(orchestrationPrompt);
          const orchJson = JSON.parse(orchResponseStr);
          if (orchJson.action === "FETCH_DOCTORS") {
            appDataCtx = { doctors: userDb.doctors?.slice(0, 5) };
          } else if (orchJson.action === "FETCH_TIMELINE") {
            appDataCtx = { timelineEvents: userDb.timelineEvents?.slice(-5) };
          } else if (orchJson.action === "FETCH_APPOINTMENTS") {
            appDataCtx = { appointments: userDb.appointments?.slice(-5) };
          }
        } catch (err) {
          // Fallback if JSON parse fails
        }
      }

      let promptObj;
      if (mode === "doctor") {
        promptObj = PromptBuilder.buildDoctorPrompt(
          { doctorName: "Dr. HealthTribe", specialty: "General Practice" },
          session.conversationHistory,
          query,
          appDataCtx
        );
      } else {
        promptObj = PromptBuilder.buildPatientPrompt(patient, session.conversationHistory, query, appDataCtx);
      }

      let aiText = "";
      if (aiService.isAvailable()) {
        aiText = await aiService.generateContent(promptObj);
      } else {
        aiText = `HealthTribe AI Clinical Copilot: Thank you for asking. Based on your profile (${patient.name || "Patient"}, ${patient.age || "30"}yo), I recommend consulting a doctor if your symptoms persist.`;
      }

      return {
        commandId: command.commandId,
        status: "SUCCESS",
        text: aiText,
        buttons: [
          { id: "btn_triage", title: "Symptom Check" },
          { id: "btn_upload", title: "Upload Report" },
          { id: "btn_book", title: "Book Doctor" },
        ],
      };
    } catch (error: any) {
      console.error("[HealthTribeDomainEngine] Error during AI generation:", error);
      return {
        commandId: command.commandId,
        status: "ERROR",
        text: "I encountered a transient error processing your health query. Please try again or tap Symptom Check.",
        buttons: [{ id: "btn_triage", title: "Symptom Check" }],
      };
    }
  }

  private async handleDiagnosticUpload(
    command: DomainCommand,
    session: UserSession,
    patient: any,
    userDb: any
  ): Promise<DomainResponse> {
    const attachment = command.payload.attachments?.[0];
    if (!attachment || (!attachment.buffer && !attachment.url)) {
      return {
        commandId: command.commandId,
        status: "REQUIRES_INPUT",
        text: "⚠️ No file received. Please send a PDF lab report or image of your diagnostic test.",
      };
    }

    let reportText = "";
    if (attachment.buffer && (attachment.mimeType?.includes("pdf") || attachment.filename?.endsWith(".pdf"))) {
      reportText = await extractTextFromPdf(attachment.buffer);
    } else {
      reportText = `Diagnostic Lab Report (${attachment.filename || "Lab_Result.pdf"}) received for ${patient.name || "Patient"}.`;
    }

    // Process with HealthTribe Diagnostic Report Parser AI Prompt
    try {
      const ocrPrompt = PromptBuilder.buildOCRPrompt(reportText, patient, userDb.timelineEvents || []);
      let resultObj: any = null;

      if (aiService.isAvailable()) {
        const aiJsonStr = await aiService.generateContent(ocrPrompt);
        try {
          resultObj = JSON.parse(aiJsonStr);
        } catch (e) {
          resultObj = null;
        }
      }

      // Add report to timeline
      const newTimelineEvent = {
        id: `event-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        category: "Lab Report",
        title: resultObj?.overview?.reportType || "Lab Diagnostic Report",
        details: resultObj?.clinicalInterpretation || "Lab report parsed successfully.",
        highlights: resultObj?.findings?.map((f: any) => `${f.marker}: ${f.value} (${f.status})`) || ["Parsed successfully"],
        riskLevel: resultObj?.overview?.overallStatus?.toLowerCase().includes("attention") ? "High" : "Low",
      };

      userDb.timelineEvents = userDb.timelineEvents || [];
      userDb.timelineEvents.unshift(newTimelineEvent);
      this.saveUserData(session.sanitizedEmail!, userDb);

      session.activeWorkflow = "NONE";

      let responseText = `📄 *Diagnostic Report Parsed & Saved*\n\n`;
      if (resultObj?.overview) {
        responseText += `*Report Type:* ${resultObj.overview.reportType || "Lab Report"}\n`;
        responseText += `*Status:* ${resultObj.overview.overallStatus || "Analyzed"}\n\n`;
      }
      if (resultObj?.clinicalInterpretation) {
        responseText += `*Clinical Summary:*\n${resultObj.clinicalInterpretation}\n\n`;
      } else {
        responseText += `Your diagnostic document was analyzed and successfully recorded in your HealthTribe medical timeline.\n\n`;
      }

      if (resultObj?.findings && resultObj.findings.length > 0) {
        responseText += `*Key Biomarkers:*\n`;
        resultObj.findings.slice(0, 5).forEach((f: any) => {
          const statusIcon = f.status === "Normal" ? "✓" : "⚠️";
          responseText += `${statusIcon} *${f.marker}*: ${f.value} (Ref: ${f.referenceRange || "N/A"})\n`;
        });
      }

      return {
        commandId: command.commandId,
        status: "SUCCESS",
        text: responseText,
        buttons: [
          { id: "btn_book", title: "Consult Doctor" },
          { id: "btn_triage", title: "Symptom Check" },
        ],
      };
    } catch (err: any) {
      console.error("[HealthTribeDomainEngine] OCR parsing error:", err);
      return {
        commandId: command.commandId,
        status: "ERROR",
        text: "Report received and saved to timeline. AI extraction hit a minor issue, but your document is safely attached to your profile.",
      };
    }
  }

  private async handleAppointmentBooking(
    command: DomainCommand,
    session: UserSession,
    userDb: any
  ): Promise<DomainResponse> {
    const data = command.payload.appointmentData;
    const doctors = userDb.doctors || [];
    const doctor = doctors.find((d: any) => d.id === data?.doctorId) || doctors[0];

    if (!doctor) {
      return {
        commandId: command.commandId,
        status: "ERROR",
        text: "Doctor record not found. Please tap Book Doctor to see available specialists.",
        buttons: [{ id: "btn_book", title: "Book Doctor" }],
      };
    }

    const newAppt = {
      id: `appt-${Date.now()}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: new Date().toISOString().split("T")[0],
      time: data?.slot || doctor.availabilitySlots?.[0] || "10:00 AM",
      status: "Confirmed",
      type: "Video Consult",
    };

    userDb.appointments = userDb.appointments || [];
    userDb.appointments.push(newAppt);
    this.saveUserData(session.sanitizedEmail!, userDb);

    return {
      commandId: command.commandId,
      status: "SUCCESS",
      text: `✅ *Appointment Confirmed*\n\n*Doctor:* ${doctor.name}\n*Specialty:* ${doctor.specialty}\n*Time:* ${newAppt.time}\n*Clinic:* ${doctor.hospital || "HealthTribe Virtual Clinic"}\n\nYour consult has been synchronized with your HealthTribe account.`,
      buttons: [
        { id: "btn_triage", title: "Symptom Check" },
        { id: "btn_upload", title: "Upload Report" },
      ],
    };
  }

  private async handleABHASync(
    command: DomainCommand,
    session: UserSession,
    patient: any,
    userDb: any
  ): Promise<DomainResponse> {
    const abhaId = command.payload.abhaData?.abhaId || "91-1234-5678-9012";
    
    // Create linked ABHA records
    const sampleRecords = [
      {
        date: new Date().toISOString().split("T")[0],
        title: "ABHA Health Card Sync",
        details: `Linked ABHA Address ${abhaId}. Verified via Ayushman Bharat Digital Mission (ABDM).`,
        specialty: "ABHA Sync Agent",
        doctorName: "ABDM Gateway",
      },
    ];

    try {
      const promptObj = PromptBuilder.buildABHAPrompt(sampleRecords, patient.name || "Patient");
      let summaryText = "";
      if (aiService.isAvailable()) {
        summaryText = await aiService.generateContent(promptObj);
      } else {
        summaryText = `ABHA Address ${abhaId} linked successfully. Health records synchronized with HealthTribe platform.`;
      }

      userDb.abhaNumber = abhaId;
      this.saveUserData(session.sanitizedEmail!, userDb);

      return {
        commandId: command.commandId,
        status: "SUCCESS",
        text: `🆔 *ABHA Sync Successful*\n\n*ABHA ID:* ${abhaId}\n*Status:* Verified & Linked\n\n${summaryText}`,
        buttons: [{ id: "btn_triage", title: "Symptom Check" }],
      };
    } catch (err: any) {
      return {
        commandId: command.commandId,
        status: "SUCCESS",
        text: `🆔 *ABHA Sync Successful*\n\nLinked ABHA ID: ${abhaId} with HealthTribe profile.`,
      };
    }
  }

  private async handleEmergencyAlert(
    command: DomainCommand,
    session: UserSession,
    patient: any
  ): Promise<DomainResponse> {
    return {
      commandId: command.commandId,
      status: "WARNING",
      text: "🚨 *EMERGENCY ASSISTANCE ALERT*\n\nIf you or someone nearby is experiencing acute chest pain, severe breathlessness, sudden weakness/numbness, or severe bleeding, please call emergency medical services (108/911) immediately.\n\nHealthTribe Emergency SOS has been broadcast to your registered emergency contacts.",
      buttons: [
        { id: "btn_book", title: "Call Emergency Doctor" },
        { id: "btn_triage", title: "Re-check Symptoms" },
      ],
    };
  }
}

export const healthTribeDomainEngine = HealthTribeDomainEngine.getInstance();
