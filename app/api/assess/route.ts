import { z } from "zod";
import { admin } from "../../../lib/supabase";
import { scoreAnswers } from "../../../lib/scoring";
import { chooseProducts } from "../../../lib/recommendations";
import { buildSummary } from "../../../lib/summary";

const schema = z.object({
  answers: z.object({
    sleep_hours: z.string(),
    fall_asleep_time: z.string(),
    night_wakeups: z.string(),
    bedtime_consistency: z.string(),
    wake_feeling: z.string(),
    sleep_factors: z.array(z.string()),
    best_match: z.string(),
  }),
});

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
    const answers = parsed.answers;

    const sessionInsert = await admin
      .from("quiz_sessions")
      .insert({ source: "sleep.now" })
      .select("id")
      .single();

    if (sessionInsert.error || !sessionInsert.data) {
      console.error("Session insert error:", sessionInsert.error);
      return json({ error: "Failed to create session" }, 500);
    }

    const session = sessionInsert.data;

    const answersInsert = await admin.from("quiz_answers").insert([
      { session_id: session.id, question_key: "sleep_hours", answer_value: answers.sleep_hours },
      { session_id: session.id, question_key: "fall_asleep_time", answer_value: answers.fall_asleep_time },
      { session_id: session.id, question_key: "night_wakeups", answer_value: answers.night_wakeups },
      { session_id: session.id, question_key: "bedtime_consistency", answer_value: answers.bedtime_consistency },
      { session_id: session.id, question_key: "wake_feeling", answer_value: answers.wake_feeling },
      { session_id: session.id, question_key: "sleep_factors", answer_value: answers.sleep_factors },
      { session_id: session.id, question_key: "best_match", answer_value: answers.best_match },
    ]);

    if (answersInsert.error) {
      console.error("Answers insert error:", answersInsert.error);
      return json({ error: "Failed to save answers" }, 500);
    }

    const { score, sleep_type, blockers, warning } = scoreAnswers(answers);
    const { scoreLabel, summary, top_blocker, action_plan } = buildSummary(
      score,
      sleep_type,
      blockers
    );

    const productQuery = await admin
      .from("products")
      .select("*")
      .eq("active", true);

    if (productQuery.error) {
      console.error("Product query error:", productQuery.error);
    }

    const products = chooseProducts(blockers, productQuery.data || []);

    const resultInsert = await admin
      .from("quiz_results")
      .insert({
        session_id: session.id,
        score,
        score_label: scoreLabel,
        sleep_type,
        blockers_json: blockers,
        action_plan_json: action_plan,
        summary,
        top_blocker,
        warning,
      })
      .select("id")
      .single();

    if (resultInsert.error || !resultInsert.data) {
      console.error("Result insert error:", resultInsert.error);
      return json({ error: "Failed to save result" }, 500);
    }

    return json({
      result_id: resultInsert.data.id,
      score,
      score_label: scoreLabel,
      sleep_type,
      summary,
      top_blocker,
      action_plan,
      warning,
      products,
    });
  } catch (error) {
    console.error("Assess API error:", error);
    return json({ error: "Server error" }, 500);
  }
}
