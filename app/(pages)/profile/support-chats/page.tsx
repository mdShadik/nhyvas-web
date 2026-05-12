"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supportService, type SupportTicketStatus } from "@/services/apiService/support";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

export default function ProfileSupportChatsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus>("open");
  const [createOpen, setCreateOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setAttachmentPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setAttachmentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const queryKey = useMemo(() => ["support-tickets", statusFilter] as const, [statusFilter]);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => supportService.listMyTickets(statusFilter),
  });

  const resetForm = () => {
    setSubject("");
    setDescription("");
    setImageFile(null);
  };

  const createTicketMutation = useMutation({
    mutationFn: async () =>
      supportService.createTicket({
        subject,
        description,
        imageFile,
      }),
    onSuccess: (ticket) => {
      setCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      router.push(`/profile/support-ticket/${ticket.id}`);
    },
    onError: (error: unknown) => {
      const message = typeof (error as { message?: unknown })?.message === "string" ? (error as Error).message : "";
      showToast({
        variant: "error",
        title: t("support.failed_create_title"),
        message: message || t("support.failed_create_fallback"),
      });
    },
  });

  const subjectError = subject.trim().length > 0 && subject.trim().length < 3;
  const descriptionError = description.trim().length > 0 && description.trim().length < 10;
  const canSubmitCreate =
    subject.trim().length >= 3 &&
    (description.trim().length >= 10 || (imageFile && imageFile.size > 0)) &&
    !createTicketMutation.isPending;

  return (
    <div className="relative">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-text-primary">{t("support.title")}</h2>
        <p className="mt-1 text-sm text-text-secondary">{t("support.subtitle")}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["open", "closed"] as SupportTicketStatus[]).map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-xs font-bold transition",
                  active
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-border bg-bg-input text-text-secondary hover:border-primary-200"
                )}
              >
                {status === "open" ? t("support.status_open") : t("support.status_closed")}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary">{t("common.loading", "Loading…")}</div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-input p-4">
          <p className="font-bold text-text-primary">
            {t("support.no_tickets", {
              status: statusFilter === "open" ? t("support.status_open") : t("support.status_closed"),
            })}
          </p>
          <p className="mt-2 text-sm text-text-secondary">{t("support.no_tickets_hint")}</p>
        </div>
      ) : (
        <ul className="space-y-2.5 pb-24">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/profile/support-ticket/${ticket.id}`}
                className="block rounded-2xl border border-border bg-bg-input p-4 transition hover:border-primary-200 hover:bg-secondary-50 dark:hover:bg-secondary-900/20"
              >
                <div className="font-bold text-text-primary">
                  #{ticket.ticket_no} · {ticket.subject}
                </div>
                <div className="mt-2 text-xs text-text-tertiary">
                  {t("support.last_updated", {
                    date: new Date(ticket.last_message_at).toLocaleString(),
                  })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-8 right-6 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-500 sm:right-12"
        aria-label={t("support.create_ticket")}
      >
        <Plus className="h-7 w-7" />
      </button>

      {createOpen ? (
        <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("common.close", "Close")}
            onClick={() => {
              if (createTicketMutation.isPending) return;
              setCreateOpen(false);
              resetForm();
            }}
          />
          <div className="relative z-[66] mb-0 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border border-border bg-bg-card p-5 shadow-xl sm:m-6 sm:max-w-lg sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-text-primary">{t("support.create_ticket")}</h3>
              <button
                type="button"
                className="rounded-full p-2 text-text-secondary hover:bg-bg-input"
                onClick={() => {
                  if (createTicketMutation.isPending) return;
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-text-secondary">{t("support.create_ticket_hint")}</p>

            <label className="mb-1 block text-xs font-semibold text-text-secondary">{t("support.subject_placeholder")}</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("support.subject_placeholder")}
              className={cn("mb-1", subjectError && "border-destructive")}
            />
            {subjectError ? (
              <p className="mb-3 text-xs text-destructive">{t("support_ticket.validation_subject", "At least 3 characters.")}</p>
            ) : (
              <div className="mb-3" />
            )}

            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              {t("support.description_placeholder")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("support.description_placeholder")}
              rows={4}
              className={cn(
                "mb-1 w-full resize-y rounded-2xl border border-border bg-bg-input px-3 py-3 text-sm text-text-primary outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15",
                descriptionError && "border-destructive"
              )}
            />
            {descriptionError ? (
              <p className="mb-3 text-xs text-destructive">
                {t("support_ticket.validation_description", "At least 10 characters (unless you attach an image).")}
              </p>
            ) : (
              <div className="mb-3" />
            )}

            <label className="mb-2 block rounded-2xl border border-border bg-bg-input px-4 py-3 text-center cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
              <span className="font-bold text-text-primary">
                {imageFile ? t("support.image_attached") : t("support.attach_image")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {imageFile && attachmentPreview ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-bg-input p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img src={attachmentPreview} alt="" className="h-[72px] w-[92px] rounded-xl object-cover" />
                <div className="min-w-0 flex-1 text-sm font-bold text-text-primary">{t("support.attachment")}</div>
                <button type="button" onClick={() => setImageFile(null)} aria-label={t("common.remove", "Remove")}>
                  <X className="h-4 w-4 text-text-secondary" />
                </button>
              </div>
            ) : null}

            <Button
              className="mt-5 w-full"
              disabled={!canSubmitCreate}
              onClick={() => canSubmitCreate && createTicketMutation.mutate()}
            >
              {createTicketMutation.isPending ? t("support.creating") : t("support.create_ticket_cta")}
            </Button>
            <Button
              variant="outline"
              className="mt-2 w-full"
              type="button"
              disabled={createTicketMutation.isPending}
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              {t("support.cancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
