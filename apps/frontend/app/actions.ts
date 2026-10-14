"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

function requiredText(form: FormData, name: string) {
  const value = String(form.get(name) ?? "").trim();
  if (!value) throw new Error(`${name.replaceAll("_", " ")} is required.`);
  return value;
}

function optionalText(form: FormData, name: string) {
  const value = String(form.get(name) ?? "").trim();
  return value || null;
}

function normalizeWebsite(value: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function validateEmail(value: string | null) {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Enter a valid email address.");
  return value;
}

async function requireUser() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("You must be signed in to perform this action.");
  return client;
}

export async function createOrganization(form: FormData) {
  const client = await requireUser();
  const { data, error } = await client.from("organizations").insert({
    name: requiredText(form, "name"), organization_type: optionalText(form, "organization_type"),
    industry: optionalText(form, "industry"), website: normalizeWebsite(optionalText(form, "website")),
    relationship_status: optionalText(form, "relationship_status") || "Prospect",
    priority_level: optionalText(form, "priority_level") || "Medium", notes: optionalText(form, "notes"),
  }).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/organizations"); revalidatePath("/dashboard");
  redirect(`/organizations/${data.id}`);
}

export async function updateOrganization(form: FormData) {
  const client = await requireUser(); const id = requiredText(form, "id");
  const { error } = await client.from("organizations").update({
    name: requiredText(form, "name"), organization_type: optionalText(form, "organization_type"), industry: optionalText(form, "industry"), website: normalizeWebsite(optionalText(form, "website")), relationship_status: optionalText(form, "relationship_status") || "Prospect", priority_level: optionalText(form, "priority_level") || "Medium", notes: optionalText(form, "notes"),
  }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath(`/organizations/${id}`); revalidatePath("/organizations"); revalidatePath("/dashboard"); redirect(`/organizations/${id}`);
}

export async function createContact(form: FormData) {
  const client = await requireUser(); const email = validateEmail(optionalText(form, "email"));
  const { data, error } = await client.from("contacts").insert({ first_name: requiredText(form, "first_name"), last_name: requiredText(form, "last_name"), title: optionalText(form, "title"), email, phone: optionalText(form, "phone"), organization_id: optionalText(form, "organization_id") }).select("id").single();
  if (error) throw new Error(error.message); revalidatePath("/contacts"); revalidatePath("/dashboard"); redirect(`/contacts/${data.id}`);
}

export async function updateContact(form: FormData) {
  const client = await requireUser(); const id = requiredText(form, "id"); const email = validateEmail(optionalText(form, "email"));
  const { error } = await client.from("contacts").update({ first_name: requiredText(form, "first_name"), last_name: requiredText(form, "last_name"), title: optionalText(form, "title"), email, phone: optionalText(form, "phone"), organization_id: optionalText(form, "organization_id") }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath(`/contacts/${id}`); revalidatePath("/contacts"); revalidatePath("/dashboard"); redirect(`/contacts/${id}`);
}

export async function signOut() {
  const client = await createClient(); const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message); redirect("/login");
}
