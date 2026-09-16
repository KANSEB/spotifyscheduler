"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import {
  createStudio,
  saveConfig,
  updateStudioMeta,
  rotateAgentKey,
  deleteStudio,
} from "@/lib/studios";
import { validateConfig, ConfigError } from "@/lib/schedule";
import { StudioConfig } from "@/lib/types";

async function guard() {
  if (!(await isAuthed())) throw new Error("Non autorisé");
}

export async function createStudioAction(formData: FormData) {
  await guard();
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  if (!name) return;
  const studio = await createStudio(name, address);
  revalidatePath("/");
  redirect(`/studios/${studio.id}`);
}

export async function updateMetaAction(id: string, name: string, address: string) {
  await guard();
  await updateStudioMeta(id, name.trim(), address.trim());
  revalidatePath("/");
  revalidatePath(`/studios/${id}`);
}

export async function saveConfigAction(
  id: string,
  config: StudioConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  await guard();
  try {
    const clean = validateConfig(config);
    await saveConfig(id, clean);
    revalidatePath(`/studios/${id}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof ConfigError) return { ok: false, error: e.message };
    return { ok: false, error: "Enregistrement impossible : " + (e as Error).message };
  }
}

export async function rotateKeyAction(id: string): Promise<string> {
  await guard();
  const key = await rotateAgentKey(id);
  revalidatePath(`/studios/${id}`);
  return key;
}

export async function deleteStudioAction(id: string) {
  await guard();
  await deleteStudio(id);
  revalidatePath("/");
  redirect("/");
}
