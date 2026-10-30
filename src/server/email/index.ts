import "server-only";
import { after } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "../env";
import { logger } from "../logger";
import type { EmailMessage } from "./templates";

/** Contrato de envío: el dominio no sabe si detrás hay Resend, SMTP o la consola. */
export interface EmailSender {
  send(to: string, message: EmailMessage): Promise<void>;
}

class ResendSender implements EmailSender {
  private client = new Resend(env.RESEND_API_KEY);
  async send(to: string, m: EmailMessage) {
    const { error } = await this.client.emails.send({ from: env.EMAIL_FROM, to, subject: m.subject, html: m.html, text: m.text });
    if (error) throw new Error(`Resend: ${error.name}`);
  }
}

class SmtpSender implements EmailSender {
  private transport = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: false });
  async send(to: string, m: EmailMessage) {
    await this.transport.sendMail({ from: env.EMAIL_FROM, to, subject: m.subject, html: m.html, text: m.text });
  }
}

/** Desarrollo sin SMTP: muestra el email (con su enlace) en la terminal. */
class ConsoleSender implements EmailSender {
  async send(to: string, m: EmailMessage) {
    console.info(`\n──── EMAIL (no enviado) ────\nPara: ${to}\nAsunto: ${m.subject}\n\n${m.text}\n────────────────────────────\n`);
  }
}

/** Para los tests: guarda los emails en memoria. */
export class MemorySender implements EmailSender {
  sent: { to: string; message: EmailMessage }[] = [];
  async send(to: string, message: EmailMessage) {
    this.sent.push({ to, message });
  }
}

function createSender(): EmailSender {
  if (env.EMAIL_DRIVER === "console") return new ConsoleSender();
  if (env.EMAIL_DRIVER === "smtp") return new SmtpSender();
  if (env.RESEND_API_KEY) return new ResendSender();
  if (env.SMTP_HOST) return new SmtpSender();
  if (env.NODE_ENV === "production") throw new Error("Falta RESEND_API_KEY para enviar emails en producción");
  return new ConsoleSender();
}

let sender: EmailSender | undefined;
export function getEmailSender(): EmailSender {
  sender ??= createSender();
  return sender;
}
/** Solo para tests. */
export function setEmailSender(s: EmailSender) {
  sender = s;
}

/**
 * Envía el email DESPUÉS de responder al usuario (ARCHITECTURE.md §10.5): el registro
 * no espera a Resend. Si falla, queda en el log y el usuario tiene «Reenviar».
 * Fuera de una petición de Next (tests, scripts) se envía en el momento.
 */
export function sendEmailInBackground(to: string, message: EmailMessage, kind: string) {
  const task = async () => {
    try {
      await getEmailSender().send(to, message);
      logger.info("email_sent", { kind });
    } catch (error) {
      logger.error("email_failed", { kind, error });
    }
  };
  try {
    after(task);
    return Promise.resolve();
  } catch {
    return task();
  }
}
