export function buildSummary(score: number, sleepType: string, blockers: string[]) {
  const scoreLabel =
    score >= 85 ? "Strong sleep habits overall" :
    score >= 70 ? "Good, with some room to improve" :
    score >= 55 ? "Fair, but there’s clear room to improve" :
    "Your sleep habits may be getting in the way of better rest";

  const summary =
    sleepType === "Inconsistent Schedule Sleeper"
      ? "Your sleep appears to be affected more by inconsistency than by sleep length alone. A more stable bedtime and wake time may help your body settle into a better rhythm."
      : sleepType === "Fragmented Sleeper"
      ? "Your main challenge appears to be staying asleep consistently through the night. Reducing disruptions and tightening your routine may help."
      : sleepType === "Wired-at-Night Sleeper"
      ? "Your answers suggest you may be carrying too much stimulation into bedtime, which can make it harder to wind down."
      : sleepType === "Environment-Disrupted Sleeper"
      ? "Your sleep environment may be playing a bigger role than you think. Small changes to noise, light, or temperature may help."
      : "Your sleep may be affected by several smaller factors at once rather than one single issue.";

  const top_blocker =
    blockers.includes("schedule_inconsistency")
      ? "Your biggest blocker appears to be schedule inconsistency."
      : blockers.includes("fragmented_sleep")
      ? "Your biggest blocker appears to be waking up during the night."
      : blockers.includes("stress")
      ? "Your biggest blocker appears to be stress or mental stimulation before bed."
      : blockers.includes("noise") || blockers.includes("light") || blockers.includes("temperature")
      ? "Your biggest blocker appears to be your sleep environment."
      : "Your biggest blocker appears to be a mix of sleep habits that reduce recovery.";

  const action_plan = [
    "Keep bedtime and wake time within the same 30–45 minute window most days.",
    "Reduce screens, caffeine, or mentally intense work in the hour before bed.",
    "Fix one bedroom issue first: noise, light, or temperature."
  ];

  return { scoreLabel, summary, top_blocker, action_plan };
}