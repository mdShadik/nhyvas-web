import { redirect } from "next/navigation";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export default async function OnboardLayout({ children }: { children: React.ReactNode }) {
  const result = await createSupabaseUserClientOrThrow();
  if (!result.success) redirect("/login");

  const { data: profileData } = await result.client.rpc("get_my_profile_bootstrap");
  const profile = Array.isArray(profileData) ? profileData[0] : profileData;

  if (profile?.is_onboarded) {
    redirect("/");
  }

  return <>{children}</>;
}
