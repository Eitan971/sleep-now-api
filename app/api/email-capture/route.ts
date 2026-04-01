import { z } from "zod";
import { admin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const schema = z.object({
  email: z.string().email(),
  result_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.parse(body);

  await admin.from("email_leads").insert({
    email: parsed.email,
    result_id: parsed.result_id,
    consent: true,
  });

  const { data: result } = await admin
    .from("quiz_results")
    .select("*")
    .eq("id", parsed.result_id)
    .single();

  await resend.emails.send({
    from: process.env.RESULTS_FROM_EMAIL!,
    to: parsed.email,
    subject: "Your sleep.now results",
    html: `
      <h1>Your Sleep Score: ${result.score}</h1>
      <p><strong>${result.sleep_type}</strong></p>
      <p>${result.summary}</p>
      <p>${result.top_blocker}</p>
    `,
  });

  return Response.json({ ok: true });
}