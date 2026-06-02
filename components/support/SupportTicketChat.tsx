"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";

import { Button } from "@/components/ui/button";
import {
  supportService,
  type SupportTicket,
  type SupportTicketMessage,
} from "@/services/apiService/support";
import { useToast } from "@/context/ToastContext";

type SupportTicketChatProps = {
  ticketId: string;
};

export function SupportTicketChat({
  ticketId,
}: SupportTicketChatProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const queryClient = useQueryClient();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [messageText, setMessageText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const ticketQueryKey = useMemo(
    () => ["support-ticket", ticketId] as const,
    [ticketId]
  );

  const messagesQueryKey = useMemo(
    () => ["support-ticket-messages", ticketId] as const,
    [ticketId]
  );

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ticketQueryKey,
    queryFn: () => supportService.getTicket(ticketId),
    enabled: Boolean(ticketId),
  });

  const { data: messages = [], isLoading: messagesLoading } =
    useQuery({
      queryKey: messagesQueryKey,
      queryFn: () =>
        supportService.getTicketMessages(ticketId),
      enabled: Boolean(ticketId),
    });

  useEffect(() => {
    if (!ticketId) return;
    const interval = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: messagesQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    }, 5000);
    return () => clearInterval(interval);
  }, [messagesQueryKey, queryClient, ticketId]);

  const scrollToBottom = (smooth = true) => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "instant",
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    scrollToBottom(true);
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

      queryClient.invalidateQueries({
        queryKey: messagesQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: ["support-tickets"],
      });
    },

    onError: (error: unknown) => {
      const message =
        typeof (error as { message?: unknown })?.message ===
        "string"
          ? (error as Error).message
          : "";

      showToast({
        variant: "error",
        title: t(
          "support_ticket.send_failed_title",
          "Failed to send"
        ),
        message:
          message ||
          t("support_ticket.try_again", "Please try again."),
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => supportService.closeTicket(ticketId),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ticketQueryKey,
      });

      const previous =
        queryClient.getQueryData<SupportTicket | null>(
          ticketQueryKey
        );

      queryClient.setQueryData(
        ticketQueryKey,
        (old: SupportTicket | null | undefined) => {
          if (!old) return old;

          return {
            ...old,
            status: "closed",
            closed_at: new Date().toISOString(),
          };
        }
      );

      return { previous };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ticketQueryKey,
      });

      showToast({
        variant: "success",
        message: t(
          "support_ticket.closed_toast",
          "Ticket closed."
        ),
      });
    },

    onError: (error: unknown, _vars, context) => {
      const prev = (
        context as { previous?: SupportTicket | null }
      )?.previous;

      if (prev !== undefined) {
        queryClient.setQueryData(ticketQueryKey, prev);
      }

      const message =
        typeof (error as { message?: unknown })?.message ===
        "string"
          ? (error as Error).message
          : "";

      showToast({
        variant: "error",
        title: t(
          "support_ticket.close_failed_title",
          "Failed to close ticket"
        ),
        message:
          message ||
          t("support_ticket.try_again", "Please try again."),
      });
    },
  });

  const canChat = ticket?.status === "open";

  const renderMessage = (
    message: SupportTicketMessage
  ) => {
    const isMe = message.sender_role === "user";

    return (
      <div
        key={message.id}
        className={`mb-3 flex ${
          isMe ? "justify-end" : "justify-start"
        }`}
      >
        <div className="max-w-[78%]">
          <div
            className={[
              "rounded-2xl px-3 py-2.5",
              isMe
                ? "bg-primary-600 text-white md:border md:border-transparent"
                : "bg-bg-input text-text-primary md:border md:border-border",
            ].join(" ")}
          >
            {message.body ? (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                {message.body}
              </p>
            ) : null}

            {message.image_url ? (
              <a
                href={message.image_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={message.image_url}
                  alt={t("support.attachment")}
                  className="mt-2 max-h-55 rounded-xl object-cover"
                />
              </a>
            ) : null}
          </div>

          <div
            className={`mt-1 px-1 text-[11px] text-text-tertiary ${
              isMe ? "text-right" : "text-left"
            }`}
          >
            {new Date(
              message.created_at
            ).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (ticketLoading || messagesLoading || !ticket) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary md:min-h-[50vh]">
        {t("support_ticket.loading", "Loading ticket…")}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-bg-page md:h-[70vh] md:rounded-3xl md:border md:border-border">
      {/* HEADER */}
      <div className="shrink-0 border-b border-border bg-bg-page px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/profile/support-chats"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-secondary-100 md:hidden dark:hover:bg-secondary-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-text-primary md:text-lg">
                #{ticket.ticket_no} · {ticket.subject}
              </h2>

              <p className="mt-0.5 text-xs text-text-tertiary">
                {ticket.status === "open"
                  ? t("support.status_open")
                  : t("support.status_closed")}
              </p>
            </div>
          </div>

          {ticket.status === "open" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden md:flex"
              disabled={closeMutation.isPending}
              onClick={() => closeMutation.mutate()}
            >
              {t(
                "support_ticket.close_ticket",
                "Close ticket"
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        {messages.map(renderMessage)}
      </div>

      {/* COMPOSER */}
      <div className="sticky bottom-0 shrink-0 border-t border-border bg-bg-page/95 px-3 pt-2 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        {imageFile ? (
          <div className="mb-2 flex items-center gap-2 px-2 text-xs text-text-secondary">
            <span className="truncate">
              {imageFile.name}
            </span>

            <button
              type="button"
              className="font-semibold text-primary-500"
              onClick={() => setImageFile(null)}
            >
              {t("common.remove", "Remove")}
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2 rounded-3xl bg-bg-input px-2 py-2">
          <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <ImagePlus className="h-5 w-5" />

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

          <TextareaAutosize
            value={messageText}
            minRows={1}
            maxRows={6}
            disabled={!canChat}
            onChange={(e) =>
              setMessageText(e.target.value)
            }
            placeholder={
              canChat
                ? t("chat.room.type_placeholder")
                : t("chat.room.unavailable")
            }
            className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
          />

          <button
            type="button"
            onClick={() => sendMutation.mutate()}
            disabled={
              sendMutation.isPending ||
              !canChat ||
              (!messageText.trim() &&
                !(imageFile && imageFile.size > 0))
            }
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-all active:scale-95 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
