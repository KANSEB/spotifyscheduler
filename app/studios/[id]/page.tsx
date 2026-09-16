import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { isAuthed } from "@/lib/auth";
import { getStudio } from "@/lib/studios";
import { saveConfigAction, updateMetaAction, rotateKeyAction, deleteStudioAction } from "@/app/actions";
import Editor from "./Editor";

export const dynamic = "force-dynamic";

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const { id } = await params;
  const studio = await getStudio(id);
  if (!studio) notFound();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host") || "";
  const baseUrl = `${proto}://${host}`;

  return (
    <Editor
      studio={studio}
      baseUrl={baseUrl}
      saveConfigAction={saveConfigAction}
      updateMetaAction={updateMetaAction}
      rotateKeyAction={rotateKeyAction}
      deleteStudioAction={deleteStudioAction}
    />
  );
}
