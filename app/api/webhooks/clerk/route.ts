import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// Verifies and handles Clerk's user.created and user.deleted events, per
// .claude/skills/authentication/SKILL.md: the User row must exist reliably
// before anything tries to attach a Player to it (webhook-driven rather than
// inferred lazily), and must be cleaned up when the Clerk account is
// deleted -- the onDelete: Cascade chain in prisma/schema.prisma only fires
// once something actually deletes the User row, per
// .claude/rules/legal-compliance.md §3's right-to-deletion requirement.
export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return new Response("Webhook signing secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const webhook = new Webhook(signingSecret);

  let event: WebhookEvent;
  try {
    event = webhook.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, email_addresses, primary_email_address_id } = event.data;
    const primaryEmail = email_addresses.find(
      (e) => e.id === primary_email_address_id
    )?.email_address;

    await db.user.upsert({
      where: { id },
      create: { id, email: primaryEmail },
      update: {},
    });
  }

  if (event.type === "user.deleted") {
    const { id } = event.data;
    if (id) {
      // deleteMany, not delete: Clerk can resend this event, and a second
      // delivery for an already-removed User must be a no-op, not a 500.
      await db.user.deleteMany({ where: { id } });
    }
  }

  return new Response("ok", { status: 200 });
}
