"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { profileService } from "@/services/apiService/profile";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";

export default function DeleteAccountPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => profileService.deleteAccount(),
    onSuccess: () => {
      showToast({ variant: "success", message: t("profile.delete.delete_account") });
      router.push("/logout");
    },
    onError: (err: any) => {
      showToast({ variant: "error", message: err?.message ?? t("profile.delete.error") });
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-bold text-text-primary">{t("profile.delete.delete_account")}</div>
        <div className="mt-1 text-sm text-text-secondary">{t("profile.delete.confirm_message")}</div>
      </div>

      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="text-sm font-semibold text-red-600 dark:text-red-400">{t("profile.sections.danger")}</div>
        <div className="mt-1 text-sm text-text-secondary">{t("profile.delete.confirm_message")}</div>
        <div className="mt-4">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            {t("profile.delete.delete_account")}
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        title={t("profile.delete.confirm_title")}
        description={t("profile.delete.confirm_message")}
        confirmLabel={t("profile.delete.delete")}
        cancelLabel={t("common.cancel")}
        confirmVariant="destructive"
        busy={mutation.isPending}
        onClose={() => (mutation.isPending ? null : setOpen(false))}
        onConfirm={() => mutation.mutate()}
      />
    </div>
  );
}
