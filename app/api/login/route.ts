import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSession, adminConfigured } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD non défini côté serveur." },
      { status: 500 }
    );
  }
  const form = await req.formData();
  const password = String(form.get("password") || "");
  if (!checkPassword(password)) {
    return NextResponse.redirect(new URL("/login?e=1", req.url), 303);
  }
  await createSession();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
