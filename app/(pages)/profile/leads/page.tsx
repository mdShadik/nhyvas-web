"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { authApi } from "@/services/apiService";
import { chatService } from "@/services/apiService/chat";
import { leadsService, type PropertyLead } from "@/services/apiService/leads";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";

function safeDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function ProfileLeadsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId")?.trim() || null;
  const leadsQuery = useQuery({
    queryKey: ["profile", "leads", listingId],
    queryFn: () => leadsService.getLeadsForUser(listingId),
  });

  const [q, setQ] = useState("");
  const normalized = q.trim().toLowerCase();

  const rows = useMemo(() => {
    const data = leadsQuery.data ?? [];
    const sorted = data.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    if (!normalized) return sorted;
    return sorted.filter((lead) => {
      const hay = [
        lead.listing_title,
        lead.inquirer_name,
        lead.inquirer_phone,
        lead.inquirer_email,
        lead.message,
        lead.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(normalized);
    });
  }, [leadsQuery.data, normalized]);

  if (leadsQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-bg-input" />;

  return (
    <div>
      <div className="mb-5">
        <div className="text-lg font-bold text-text-primary">{t("leads.title")}</div>
        <div className="mt-1 text-sm text-[var(--color-text-secondary)]">{t("leads.subtitle")}</div>
      </div>

      <div className="mb-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search")} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-border bg-page-bg-from p-6 text-center">
          <div className="text-base font-bold text-text-primary">{t("leads.empty_title")}</div>
          <div className="mt-1 text-sm text-text-secondary">{t("leads.empty_hint")}</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-bg-input text-left text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("leads.property_fallback")}</th>
                <th className="px-4 py-3 font-semibold">{t("leads.interested_user")}</th>
                <th className="px-4 py-3 font-semibold">{t("leads.chat")}</th>
                <th className="px-4 py-3 font-semibold">{t("common.active")}</th>
                <th className="px-4 py-3 font-semibold">{t("leads.date", { date: "" }).replace(/^Date:\s*/i, "")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead }: { lead: PropertyLead }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();

  const { data: currentUserId } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUserId,
  });

  const chatMutation = useMutation({
    mutationFn: () => chatService.createRoom(lead.property_id, lead.inquirer_id),
    onSuccess: (roomId) => router.push(`/chat/${roomId}`),
    onError: (error: unknown) => {
      const detail =
        typeof (error as { message?: unknown })?.message === "string" ? (error as Error).message : "";
      showToast({
        variant: "error",
        title: t("property.actions.chat_failed"),
        message: detail || t("property.actions.chat_failed_message"),
      });
    },
  });

  const created = safeDate(lead.created_at);
  const dateLabel = created ? created.toLocaleString() : lead.created_at;
  const who = lead.inquirer_name || lead.inquirer_phone || lead.inquirer_email || "Unknown";

  const chatDisabled =
    !currentUserId ||
    !lead.property_id ||
    !lead.inquirer_id ||
    lead.inquirer_id === currentUserId ||
    chatMutation.isPending;

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <div className="font-semibold text-text-primary">{lead.listing_title ?? "Listing"}</div>
        {lead.message ? <div className="mt-1 line-clamp-2 text-text-secondary">{lead.message}</div> : null}
      </td>
      <td className="px-4 py-3 text-text-secondary">{who}</td>
      <td className="px-4 py-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={chatDisabled}
          title={t("leads.open_chat_hint")}
          onClick={() => chatMutation.mutate()}
        >
          {t("leads.chat")}
        </Button>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-full bg-bg-input px-2.5 py-1 text-xs font-semibold text-text-secondary">
          {lead.status || "new"}
        </span>
      </td>
      <td className="px-4 py-3 text-text-secondary">{dateLabel}</td>
    </tr>
  );
}
