"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { RequireAuth } from "@/components/profile/RequireAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { useAddressBook } from "@/hooks/useAddressBook";
import { useAuth } from "@/context/AuthContext";

function AddressesContent() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { entries, defaultId, remove, setDefault } = useAddressBook();

  const { profile } = useAuth();
  const maxAddresses = profile?.max_addresses ?? 3;
  const returnTo = searchParams.get("returnTo");

  const onCancel = () => {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.back();
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-90px)] max-w-4xl px-4 pb-24 pt-4 sm:px-6 sm:pt-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-text-primary">
              {t("navigation.addresses")}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {t("addresses.empty_hint")}
            </p>
          </div>

          {entries.length > 0 && entries.length < maxAddresses && (
            <Button
              asChild
              className="w-full sm:w-auto bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500"
            >
              <Link href={{
                pathname: "/addresses/pick",
                query: returnTo ? { returnTo } : {},
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addresses.add_address")}
              </Link>
            </Button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-3xl border border-border bg-bg-page p-6 text-center shadow-sm sm:p-8">
            <div className="text-base font-bold text-text-primary">
              {t("addresses.empty_title")}
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              {t("addresses.empty_hint")}
            </div>

            <div className="mt-5">
              <Button
                asChild
                className="w-full bg-linear-to-br from-primary-500 via-primary-500 to-tertiary-500"
              >
                <Link href={{
                  pathname: "/addresses/pick",
                  query: returnTo ? { returnTo } : {},
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addresses.add_address")}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const isDefault = entry.id === defaultId;

              return (
                <div
                  key={entry.id}
                  className={[
                    "rounded-3xl border bg-linear-to-br from-bg-page via-primary-900/20 to-tertiary-900/40 p-4 shadow-sm transition sm:p-5",
                    isDefault ? "border-primary-400/60" : "border-border",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-bold text-text-primary">
                          {entry.label || "Untitled"}
                        </div>

                        {isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/35 dark:text-primary-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("addresses.default")}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-xs text-text-tertiary">
                        {entry.latitude !== null && entry.longitude !== null
                          ? `${entry.latitude.toFixed(5)}, ${entry.longitude.toFixed(5)}`
                          : "No coordinates"}
                      </div>
                    </div>

                    <div className="flex sm:justify-end gap-2">
                      <Button
                        variant="outline"
                        className="bg-linear-to-br"
                        disabled={isDefault}
                        onClick={() => {
                          setDefault(entry.id);
                          showToast({
                            variant: "success",
                            message: t("addresses.set_default"),
                          });
                        }}
                      >
                        {t("addresses.set_default")}
                      </Button>

                      <Button asChild variant="outline" className="">
                        <Link
                          href={{
                            pathname: "/addresses/pick",
                            query: { 
                              addressId: entry.id,
                              ...(returnTo ? { returnTo } : {}),
                            },
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          {/* {t("common.view")} */}
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        className=" text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-linear-to-br"
                        onClick={() => {
                          remove(entry.id);
                          showToast({
                            variant: "success",
                            message: t("addresses.deleted"),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {/* {t("profile.delete.delete")} */}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </RequireAuth>
  );
}

export default function AddressesPage() {
  return (
    <Suspense>
      <AddressesContent />
    </Suspense>
  );
}
