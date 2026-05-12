"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { SupportTicketChat } from "@/components/support/SupportTicketChat";

export default function ProfileSupportTicketPage() {
  const { t } = useTranslation();
  const params = useParams<{ ticketId: string }>();
  const ticketId = (params?.ticketId ?? "").trim();

  if (!ticketId) {
    return <p className="text-text-secondary">{t("support_ticket.invalid", "Invalid ticket.")}</p>;
  }

  return <SupportTicketChat ticketId={ticketId} />;
}
