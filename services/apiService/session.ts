import { getCurrentUserId } from "@/services/apiService/auth";

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You need to be logged in.");
  }
  return userId;
}

export async function getOptionalUserId(): Promise<string | null> {
  return await getCurrentUserId();
}
