import { z } from "zod";
import { admin } from "../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const ALLOWED_ORIGIN = "https://sleepnow.figma.site";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders(),
  });
}

const schema = z.object({
  email: z.string().email(),
  result_id: z.string().uuid(),
});

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const leadInsert = await admin.from("email_leads").insert({
      email: parsed.email,
      result_id: parsed.result_id,
      consent: true,
    });

    if (leadInsert.error) {
      console.error("Lead insert error:", leadInsert.error);
      return json({ error: "Failed to save email" }, 500);
    }

    const resultQuery = await admin
      .from("quiz_results")
      .select("*")
      .eq("id", parsed.result_id)
      .single();

    if (resultQuery.error || !resultQuery.data) {
      console.error("Result fetch error:", resultQuery.error);
      return json({ error: "Result not found" }, 404);
    }

    await resend.emails.send({
      from: process.env.RESULTS_FROM_EMAIL!,
      to: parsed.email,
      subject: "Your sleep.now results",
      html: `
        <h1>Your Sleep Score: ${resultQuery.data.score}</h1>
        <p><strong>${resultQuery.data.sleep_type}</strong></p>
        <p>${resultQuery.data.summary}</p>
        <p>${resultQuery.data.top_blocker}</p>
      `,
    });

    return json({ ok: true });
  } catch (error) {
    console.error("Email capture error:", error);
    return json({ error: "Server error" }, 500);
  }
}
