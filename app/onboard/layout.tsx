import { redirect } from "next/navigation";
import { createSupabaseUserClientOrThrow } from "@/server/supabase";

export default async function OnboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createSupabaseUserClientOrThrow();
    const { data: profileData } = await supabase.rpc("get_my_profile_bootstrap");
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;

    // If the user is already onboarded, they shouldn't be here.
    if (profile?.is_onboarded) {
      redirect("/");
    }
  } catch (error) {
    // If the token is invalid or missing, redirect to login
    redirect("/login");
  }

  return <>{children}</>;
}
