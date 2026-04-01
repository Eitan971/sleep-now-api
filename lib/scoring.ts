export type Answers = {
  sleep_hours: string;
  fall_asleep_time: string;
  night_wakeups: string;
  bedtime_consistency: string;
  wake_feeling: string;
  sleep_factors: string[];
  best_match: string;
};

export function scoreAnswers(a: Answers) {
  let score = 100;
  const blockers: string[] = [];

  if (a.sleep_hours === "Less than 5") { score -= 25; blockers.push("short_sleep"); }
  else if (a.sleep_hours === "5–6") { score -= 15; blockers.push("short_sleep"); }
  else if (a.sleep_hours === "6–7") { score -= 5; }

  if (a.fall_asleep_time === "30–60 minutes") { score -= 10; blockers.push("sleep_latency"); }
  else if (a.fall_asleep_time === "More than 60 minutes") { score -= 20; blockers.push("sleep_latency"); }

  if (a.night_wakeups === "2–3 times") { score -= 12; blockers.push("fragmented_sleep"); }
  else if (a.night_wakeups === "4+ times") { score -= 20; blockers.push("fragmented_sleep"); }

  if (a.bedtime_consistency === "It varies a lot") { score -= 15; blockers.push("schedule_inconsistency"); }
  else if (a.bedtime_consistency === "I don’t have a real bedtime") { score -= 20; blockers.push("schedule_inconsistency"); }

  if (a.wake_feeling === "Tired") { score -= 10; blockers.push("low_recovery"); }
  else if (a.wake_feeling === "Exhausted") { score -= 18; blockers.push("low_recovery"); }

  for (const factor of a.sleep_factors) {
    if (factor === "Stress or racing thoughts") blockers.push("stress");
    if (factor === "Screen time late at night") blockers.push("screen_time");
    if (factor === "Noise") blockers.push("noise");
    if (factor === "Light") blockers.push("light");
    if (factor === "Temperature") blockers.push("temperature");
    if (factor === "Snoring or breathing issues") blockers.push("breathing_flag");
  }

  score = Math.max(0, Math.min(100, score));

  let sleep_type = "Mixed Sleeper";
  if (blockers.includes("schedule_inconsistency")) sleep_type = "Inconsistent Schedule Sleeper";
  else if (blockers.includes("fragmented_sleep")) sleep_type = "Fragmented Sleeper";
  else if (blockers.includes("stress") || blockers.includes("screen_time")) sleep_type = "Wired-at-Night Sleeper";
  else if (blockers.includes("noise") || blockers.includes("light") || blockers.includes("temperature")) sleep_type = "Environment-Disrupted Sleeper";
  else if (blockers.includes("low_recovery")) sleep_type = "Low-Recovery Sleeper";

  const warning =
    blockers.includes("breathing_flag")
      ? "If you often wake up gasping, snore heavily, or have persistent severe daytime sleepiness, consider speaking with a healthcare professional."
      : null;

  return { score, sleep_type, blockers, warning };
}