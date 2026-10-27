import { createClient } from "./supabase/server";
export async function crmContext() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Sign in to continue.");
  const { data: profile, error: profileError } = await client.from("profiles").select("role,is_active").eq("id", user.id).single();
  if (profileError || !profile?.is_active) throw new Error("Active profile access is required. Apply the Day 1 migrations in your synthetic demo environment.");
  return { client, user, profile, canWrite: ["admin", "staff"].includes(profile.role) };
}
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
