import { prisma } from "@/lib/db/prisma";
import { getSetting, getSettings } from "@/lib/db/settings";
import { editableEmailTemplates, emailTemplateDefinition, emailTemplateKey, type EditableEmailTemplateId } from "@/lib/email/template-definitions";
import { escapeHtml } from "@/lib/security/html";

type EmailTemplate =
  | EditableEmailTemplateId
  | "welcome"
  | "purchase_receipt"
  | "license_delivery"
  | "password_reset"
  | "support_update"
  | "product_update"
  | "product_release"
  | "refund"
  | "refund_notice"
  | "invoice"
  | "download_ready"
  | "account_created"
  | "discord_linked";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template?: EmailTemplate | "custom";
};

async function fromEmail() {
  return process.env.FROM_EMAIL || (await getSetting("email.from_email")) || process.env.SUPPORT_EMAIL || "MxF Labs <support@mxf-labs.com>";
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html, text, template = "custom" }: SendEmailInput) {
  const delivery = await prisma.emailDelivery.create({
    data: {
      template,
      toEmail: to,
      subject,
      status: process.env.RESEND_API_KEY ? "Queued" : "Mocked",
      metadata: JSON.stringify({ textPreview: text.slice(0, 180) }),
    },
  });

  if (!process.env.RESEND_API_KEY) {
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { error: "RESEND_API_KEY is not configured. Delivery was recorded as mocked/pending." },
    });
    return { ok: false, skipped: true, reason: "RESEND_API_KEY is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: await fromEmail(),
      to,
      subject,
      html,
      text,
    }),
    cache: "no-store",
  });

  const body = await response.text();

  await prisma.emailDelivery.update({
    where: { id: delivery.id },
    data: {
      status: response.ok ? "Sent" : "Failed",
      error: response.ok ? null : body.slice(0, 500),
      sentAt: response.ok ? new Date() : null,
      metadata: JSON.stringify({ responseStatus: response.status }),
    },
  });

  return { ok: response.ok, status: response.status, body };
}

export function renderEmailTemplate(
  template: EmailTemplate,
  data: Record<string, string | number | null | undefined>,
) {
  const normalizedTemplate = normalizeTemplateId(template);
  const definition = emailTemplateDefinition(normalizedTemplate);
  const brand = "MxF Labs";
  const product = data.productName || "your product";
  const license = data.licenseKey || "";

  const selected = {
    subject: applyEmailTokens(definition.subject, { ...data, brandName: brand, productName: product, licenseKey: license }),
    text: applyEmailTokens(definition.body, { ...data, brandName: brand, productName: product, licenseKey: license }),
  };
  const safeSubject = escapeHtml(selected.subject);
  const safeText = escapeHtml(selected.text);
  return {
    subject: selected.subject,
    text: selected.text,
    html: `<div style="font-family:Arial,sans-serif;background:#05070a;color:#ffffff;padding:24px"><h1>${safeSubject}</h1><p>${safeText}</p></div>`,
  };
}

function normalizeTemplateId(template: EmailTemplate): EditableEmailTemplateId {
  if (template === "product_update") return "product_release";
  if (template === "refund") return "refund_notice";
  const exists = editableEmailTemplates.some((item) => item.id === template);
  return exists ? (template as EditableEmailTemplateId) : "welcome";
}

function applyEmailTokens(template: string, data: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = data[key];
    return value === null || value === undefined || value === "" ? `{{${key}}}` : String(value);
  });
}

export async function renderStoredEmailTemplate(
  template: EmailTemplate,
  data: Record<string, string | number | null | undefined>,
) {
  const normalizedTemplate = normalizeTemplateId(template);
  const definition = emailTemplateDefinition(normalizedTemplate);
  const settings = await getSettings([
    "brand.name",
    emailTemplateKey(normalizedTemplate, "subject"),
    emailTemplateKey(normalizedTemplate, "body"),
  ]);
  const tokenData = {
    ...data,
    brandName: settings["brand.name"] || "MxF Labs",
    productName: data.productName || "your product",
    licenseKey: data.licenseKey || "",
  };
  const subject = applyEmailTokens(settings[emailTemplateKey(normalizedTemplate, "subject")] || definition.subject, tokenData);
  const text = applyEmailTokens(settings[emailTemplateKey(normalizedTemplate, "body")] || definition.body, tokenData);
  const safeSubject = escapeHtml(subject);
  const safeText = escapeHtml(text).replace(/\n/g, "<br />");

  return {
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;background:#05070a;color:#ffffff;padding:24px"><h1>${safeSubject}</h1><p>${safeText}</p></div>`,
  };
}

export async function sendTemplateEmail({
  to,
  template,
  data,
}: {
  to: string;
  template: EmailTemplate;
  data: Record<string, string | number | null | undefined>;
}) {
  const rendered = await renderStoredEmailTemplate(template, data);
  return sendEmail({ to, template, ...rendered });
}
