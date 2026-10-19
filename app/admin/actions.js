"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setReportStatus, setReportNote, deleteReport as removeReport } from "@/lib/db";
import { STATUSES } from "@/lib/constants";
import {
  authConfigured,
  credentialsMatch,
  createSession,
  destroySession,
  getSession,
} from "@/lib/session";

export async function login(prevState, formData) {
  if (!authConfigured()) {
    return { error: "Admin login is not set up on the server yet. Add ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET." };
  }

  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (!credentialsMatch(username, password)) {
    // Small delay to slow down password guessing.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Wrong username or password." };
  }

  await createSession(username);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// Every action below re-checks the session itself, even though the page is protected.
async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
}

export async function updateReportStatus(id, status, formData) {
  await requireAdmin();
  if (!STATUSES.includes(status) || !Number.isInteger(id)) return;
  await setReportStatus(id, status);
  revalidatePath("/admin");
}

export async function saveReportNote(id, formData) {
  await requireAdmin();
  if (!Number.isInteger(id)) return;
  const note = String(formData.get("note") || "").trim().slice(0, 500);
  await setReportNote(id, note);
  revalidatePath("/admin");
}

export async function deleteReport(id, formData) {
  await requireAdmin();
  if (!Number.isInteger(id)) return;
  await removeReport(id);
  revalidatePath("/admin");
}
