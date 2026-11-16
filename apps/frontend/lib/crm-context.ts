import { createClient } from "./supabase/server";
import { cache } from "react";

// React render/request scope only: never persist an authenticated context across users.
export const crmContext = cache(async () => {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Sign in to continue.");
  const { data: profile, error: profileError } = await client.from("profiles").select("role,is_active").eq("id", user.id).single();
  if (profileError || !profile?.is_active) {
    // Codes only: database messages can contain record values or identifiers.
    console.error(JSON.stringify({ event: "workspace_access_failed", code: profileError?.code ?? "inactive_profile" }));
    throw new Error("Your account isn't ready to access this workspace. Contact your administrator.");
  }
  return { client, user, profile, canWrite: ["admin", "staff"].includes(profile.role) };
});
export async function ownerOptions(client: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await client.from("staff_directory").select("id,display_name").order("display_name");
  if (error) throw new Error("Unable to load the restricted staff directory.");
  return (data ?? []).map(row => ({ id: String(row.id), name: String(row.display_name) }));
}
export async function ownerLabel(client: Awaited<ReturnType<typeof createClient>>, id: string | null) {
  if (!id) return "Unassigned";
  const { data, error } = await client.from("staff_directory").select("display_name").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load relationship ownership.");
  return data?.display_name ?? "Assigned staff member (directory restricted or inactive)";
}
