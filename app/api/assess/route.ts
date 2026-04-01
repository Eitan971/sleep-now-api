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
      return Response.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const session = sessionInsert.data;

    await admin.from("quiz_answers").insert([
      { session_id: session.id, question_key: "sleep_hours", answer_value: answers.sleep_hours },
      { session_id: session.id, question_key: "fall_asleep_time", answer_value: answers.fall_asleep_time },
      { session_id: session.id, question_key: "night_wakeups", answer_value: answers.night_wakeups },
      { session_id: session.id, question_key: "bedtime_consistency", answer_value: answers.bedtime_consistency },
      { session_id: session.id, question_key: "wake_feeling", answer_value: answers.wake_feeling },
      { session_id: session.id, question_key: "sleep_factors", answer_value: answers.sleep_factors },
      { session_id: session.id, question_key: "best_match", answer_value: answers.best_match },
    ]);

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
      return Response.json(
        { error: "Failed to save result" },
        { status: 500 }
      );
    }

    const result = resultInsert.data;

    return Response.json({
      result_id: result.id,
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
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
