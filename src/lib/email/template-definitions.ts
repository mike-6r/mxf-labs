export const editableEmailTemplates = [
  {
    id: "welcome",
    label: "Welcome",
    subject: "Welcome to {{brandName}}",
    body: "Welcome to {{brandName}}, {{customerName}}. Your customer portal is ready when you need product access, licenses, downloads, and support.",
    tokens: ["brandName", "customerName"],
  },
  {
    id: "purchase_receipt",
    label: "Purchase receipt",
    subject: "{{brandName}} purchase receipt",
    body: "Thanks for purchasing {{productName}}. Your order {{orderId}} is now recorded in the customer portal.",
    tokens: ["brandName", "productName", "orderId"],
  },
  {
    id: "license_delivery",
    label: "License delivery",
    subject: "{{brandName}} license delivery",
    body: "Your license for {{productName}} is ready: {{licenseKey}}. Keep this key private and use the customer portal for downloads and support.",
    tokens: ["brandName", "productName", "licenseKey"],
  },
  {
    id: "support_update",
    label: "Support update",
    subject: "{{brandName}} support update",
    body: "Your support ticket {{ticketNumber}} has been updated. Reply in the portal or Discord support if more detail is needed.",
    tokens: ["brandName", "ticketNumber"],
  },
  {
    id: "product_release",
    label: "Product release",
    subject: "{{productName}} release from {{brandName}}",
    body: "{{productName}} has a new release available. Review the changelog and download it from your customer portal.",
    tokens: ["brandName", "productName"],
  },
  {
    id: "refund_notice",
    label: "Refund notice",
    subject: "{{brandName}} refund update",
    body: "Your refund request for {{productName}} has been updated. Product access and license state may change after approval.",
    tokens: ["brandName", "productName"],
  },
  {
    id: "discord_linked",
    label: "Discord linked",
    subject: "Discord linked to {{brandName}}",
    body: "Your Discord account has been linked to {{brandName}}. Product ownership and support access can now sync automatically.",
    tokens: ["brandName"],
  },
  {
    id: "invoice",
    label: "Invoice",
    subject: "{{brandName}} invoice",
    body: "Your invoice for {{productName}} is available in the customer portal. Order reference: {{orderId}}.",
    tokens: ["brandName", "productName", "orderId"],
  },
  {
    id: "download_ready",
    label: "Download ready",
    subject: "{{productName}} download ready",
    body: "{{productName}} is ready to download in your customer portal. Downloads may require an active license.",
    tokens: ["productName"],
  },
  {
    id: "account_created",
    label: "Account created",
    subject: "{{brandName}} account created",
    body: "Your {{brandName}} customer account is ready, {{customerName}}.",
    tokens: ["brandName", "customerName"],
  },
  {
    id: "password_reset",
    label: "Password reset",
    subject: "{{brandName}} account reset",
    body: "A password reset was requested for your {{brandName}} account.",
    tokens: ["brandName"],
  },
] as const;

export type EditableEmailTemplateId = (typeof editableEmailTemplates)[number]["id"];

export function emailTemplateKey(id: string, field: "subject" | "body") {
  return `email.template.${id}.${field}`;
}

export function emailTemplateDefinition(id: string) {
  return editableEmailTemplates.find((template) => template.id === id) || editableEmailTemplates[0];
}
