"use server";

import { Resend } from "resend";

export type ContactFormInput = {
  name: string;
  email: string;
  message: string;
};

export type ContactActionResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(
  input: ContactFormInput
): Promise<ContactActionResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Todos los campos son obligatorios." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "El correo electrónico no es válido." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    return { ok: false, error: "El servicio de correo no está configurado." };
  }

  const resend = new Resend(apiKey);

  try {
    const notification = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
    });
    if (notification.error) {
      return { ok: false, error: notification.error.message };
    }

    const confirmation = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Recibimos tu mensaje — Arcade Vault",
      text: `Hola ${name},\n\nGracias por escribirnos. Recibimos tu mensaje y te responderemos en 24-48h.\n\nTu mensaje:\n${message}\n\n— El equipo de Arcade Vault`,
    });
    if (confirmation.error) {
      return { ok: false, error: confirmation.error.message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar el mensaje. Inténtalo de nuevo." };
  }
}
