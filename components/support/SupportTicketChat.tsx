"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Send } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/button";
import { supportService, type SupportTicket, type SupportTicketMessage } from "@/services/apiService/support";
import { useToast } from "@/context/ToastContext";

type SupportTicketChatProps = {
  ticketId: string;
};

export function SupportTicketChat({ ticketId }: SupportTicketChatProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [messageText, setMessageText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const ticketQueryKey = useMemo(() => ["support-ticket", ticketId] as const, [ticketId]);
  const messagesQueryKey = useMemo(() => ["support-ticket-messages", ticketId] as const, [ticketId]);

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ticketQueryKey,
    queryFn: () => supportService.getTicket(ticketId),
    enabled: Boolean(ticketId),
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: messagesQueryKey,
    queryFn: () => supportService.getTicketMessages(ticketId),
    enabled: Boolean(ticketId),
  });

  useEffect(() => {
    if (!ticketId) return;
    const channel = supabaseBrowser
      .channel(`support_ticket_${ticketId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesQueryKey });
          queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
      supabaseBrowser.removeChannel(channel);
    };
  }, [messagesQueryKey, queryClient, ticketId]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: () =>
      supportService.sendTicketMessage({
        ticketId,
        body: messageText,
        imageFile,
      }),
    onSuccess: () => {
      setMessageText("");
      setImageFile(null);
      queryClient.invalidateQueries({ queryKey: messagesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error: unknown) => {
      const message = typeof (error as { message?: unknown })?.message === "string" ? (error as Error).message : "";
      showToast({
        variant: "error",
        title: t("support_ticket.send_failed_title", "Failed to send"),
        message: message || t("support_ticket.try_again", "Please try again."),
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => supportService.closeTicket(ticketId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ticketQueryKey });
      const previous = queryClient.getQueryData<SupportTicket | null>(ticketQueryKey);
      queryClient.setQueryData(ticketQueryKey, (old: SupportTicket | null | undefined) => {
        if (!old) return old;
        return { ...old, status: "closed", closed_at: new Date().toISOString() };
      });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketQueryKey });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      showToast({
        variant: "success",
        message: t("support_ticket.closed_toast", "Ticket closed."),
      });
    },
    onError: (error: unknown, _vars, context) => {
      const prev = (context as { previous?: SupportTicket | null } | undefined)?.previous;
      if (prev !== undefined) {
        queryClient.setQueryData(ticketQueryKey, prev);
      }
      const message = typeof (error as { message?: unknown })?.message === "string" ? (error as Error).message : "";
      showToast({
        variant: "error",
        title: t("support_ticket.close_failed_title", "Failed to close ticket"),
        message: message || t("support_ticket.try_again", "Please try again."),
      });
    },
  });

  const canChat = ticket?.status === "open";

  const renderMessage = (message: SupportTicketMessage) => {
    const isMe = message.sender_role === "user";
    const bubbleBg = isMe ? "bg-primary-600 text-white border-transparent" : "bg-bg-input text-text-primary border-border";

    return (
      <div key={message.id} className={`mb-3 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div className={`max-w-[82%] rounded-xl border px-3 py-2.5 ${bubbleBg}`}>
          {message.body ? <p className="text-[15px] leading-snug whitespace-pre-wrap">{message.body}</p> : null}
          {message.image_url ? (
            <a href={message.image_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- attachment URL */}
              <img
                src={message.image_url}
                alt={t("support.attachment")}
                className={`mt-2 max-h-[150px] w-[190px] rounded-lg object-cover ${message.body ? "mt-2" : ""}`}
              />
            </a>
          ) : null}
        </div>
        <span className="mt-1 text-[11px] text-text-tertiary">{new Date(message.created_at).toLocaleString()}</span>
      </div>
    );
  };

  if (ticketLoading || messagesLoading || !ticket) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-secondary">
        {t("support_ticket.loading", "Loading ticket…")}
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(70vh,640px)] flex-col">
      <div className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-text-primary">
              #{ticket.ticket_no} · {ticket.subject}
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">
              {t("support_ticket.status_label", "Status")}:{" "}
              {ticket.status === "open" ? t("support.status_open") : t("support.status_closed")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ticket.status === "open" ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                disabled={closeMutation.isPending}
                onClick={() => closeMutation.mutate()}
              >
                {closeMutation.isPending
                  ? t("support_ticket.closing", "Closing…")
                  : t("support_ticket.close_ticket", "Close ticket")}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" asChild>
              <Link href="/profile/support-chats">{t("support_ticket.back_to_list", "All tickets")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto py-4">
        {messages.map(renderMessage)}
      </div>

      <div className="border-t border-border pt-3">
        {!canChat ? (
          <div className="mb-3 rounded-xl border border-border bg-bg-input px-3 py-2 text-sm font-semibold text-text-tertiary">
            {t("chat.room.unavailable")}
          </div>
        ) : null}

        {imageFile ? (
          <div className="mb-2 text-xs text-text-secondary">
            {t("support.image_attached")}: {imageFile.name}
            <button
              type="button"
              className="ml-2 font-semibold text-primary-600"
              onClick={() => setImageFile(null)}
            >
              {t("common.remove", "Remove")}
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-bg-card hover:bg-secondary-50 dark:hover:bg-secondary-900 disabled:opacity-50">
            <ImagePlus className="h-[18px] w-5 text-text-tertiary" />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={!canChat}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setImageFile(f);
                e.target.value = "";
              }}
            />
          </label>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onFocus={() =>
              window.setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
              }, 100)
            }
            placeholder={canChat ? t("chat.room.type_placeholder") : t("chat.room.unavailable")}
            disabled={!canChat}
            rows={1}
            className="max-h-32 min-h-11 flex-1 resize-y rounded-2xl border border-border bg-bg-input px-3 py-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary-400 focus:ring-4 focus:ring-primary-500/15 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => sendMutation.mutate()}
            disabled={
              sendMutation.isPending ||
              !canChat ||
              (!messageText.trim() && !(imageFile && imageFile.size > 0))
            }
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white disabled:opacity-50"
            aria-label={t("chat.room.send")}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
