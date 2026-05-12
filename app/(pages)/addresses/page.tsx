"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RequireAuth } from "@/components/profile/RequireAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { useAddressBook } from "@/hooks/useAddressBook";

export default function AddressesPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const { entries, defaultId, remove, setDefault } = useAddressBook();

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:pt-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary">{t("navigation.addresses")}</h1>
            <p className="mt-1 text-sm text-text-secondary">{t("addresses.empty_hint")}</p>
          </div>
          <Link href="/addresses/pick">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addresses.add_address")}
            </Button>
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-3xl border border-border bg-bg-card p-6 text-center">
            <div className="text-base font-bold text-text-primary">{t("addresses.empty_title")}</div>
            <div className="mt-1 text-sm text-text-secondary">{t("addresses.empty_hint")}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const isDefault = entry.id === defaultId;
              return (
                <div
                  key={entry.id}
                  className={[
                    "rounded-3xl border bg-bg-card p-5 shadow-sm",
                    isDefault ? "border-primary-400/40" : "border-border",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-bold text-text-primary">
                          {entry.label || "Untitled"}
                        </div>
                        {isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-400/12 px-2.5 py-1 text-xs font-semibold text-primary-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("addresses.default")}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-text-tertiary">
                        {entry.latitude !== null && entry.longitude !== null
                          ? `${entry.latitude.toFixed(5)}, ${entry.longitude.toFixed(5)}`
                          : "No coordinates"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        disabled={isDefault}
                        onClick={() => {
                          setDefault(entry.id);
                          showToast({ variant: "success", message: t("addresses.set_default") });
                        }}
                      >
                        {t("addresses.set_default")}
                      </Button>
                      <Link href={{ pathname: "/addresses/pick", query: { addressId: entry.id } }}>
                        <Button variant="outline">
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("common.view")}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => {
                          remove(entry.id);
                          showToast({ variant: "success", message: t("addresses.deleted") });
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("profile.delete.delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Button variant="ghost" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </RequireAuth>
  );
}
