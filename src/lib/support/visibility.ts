import { isDemoText, shouldShowDemoData, type ContentMode } from "@/lib/content-mode";

type TicketLike = {
  ticketNumber?: string | null;
  email?: string | null;
  discordUsername?: string | null;
  subject?: string | null;
  message?: string | null;
  internalNotes?: string | null;
};

export function isDemoSupportTicket(ticket: TicketLike) {
  return (
    ticket.ticketNumber === "MXF-1001" ||
    isDemoText(ticket.email, ticket.discordUsername, ticket.subject, ticket.message, ticket.internalNotes)
  );
}

export function visibleSupportTickets<T extends TicketLike>(tickets: T[], contentMode: ContentMode) {
  return shouldShowDemoData(contentMode) ? tickets : tickets.filter((ticket) => !isDemoSupportTicket(ticket));
}
