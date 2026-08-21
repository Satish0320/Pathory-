import { NextResponse } from "next/server";

// Temporary diagnostic route to find this deployment's outbound IP, so it
// can be added to the Supercell API token's allowlist — see
// .claude/rules/api.md point 3. Delete once the IP is confirmed working;
// this isn't a permanent part of the app.
export async function GET() {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = await res.json();
  return NextResponse.json(data);
}
