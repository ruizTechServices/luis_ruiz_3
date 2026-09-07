import { isGioAdmin } from "@/lib/auth/admin";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function forward(action: "status" | "test" | "retry") {
  if (!(await getAuthenticatedUser())) return Response.json({ error: "Sign in to manage email alerts." }, { status: 401 });
  if (!(await isGioAdmin())) return Response.json({ error: "Only the site owner can manage email alerts." }, { status: 403 });
  const supabase = await createClient();
  // getSession only transports the token after server verification; the Edge
  // worker independently verifies the JWT and current owner authorization again.
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return Response.json({ error: "Your sign-in expired. Sign in and try again." }, { status: 401 });
  try {
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/site-inquiry-alerts`, {
      method: "POST", headers: { apikey: getSupabasePublishableKey(), Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action }), cache: "no-store", signal: AbortSignal.timeout(55_000),
    });
    const result: unknown = await response.json();
    return Response.json(result, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Email alerts are temporarily unavailable. Your saved inquiries are unaffected." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET() { return forward("status"); }

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Open your inquiry inbox and try again." }, { status: 403 });
  const action = new URL(request.url).searchParams.get("action");
  if (action !== "test" && action !== "retry") return Response.json({ error: "Choose a valid alert action." }, { status: 400 });
  return forward(action);
}
