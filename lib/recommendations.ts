type Product = {
  id: string;
  name: string;
  category: string;
  reason_template: string;
  affiliate_url: string;
  tags_json: string[];
  active: boolean;
};

export function chooseProducts(blockers: string[], products: Product[]) {
  const wanted = new Set<string>();

  if (blockers.includes("stress")) wanted.add("stress");
  if (blockers.includes("screen_time")) wanted.add("fall_asleep");
  if (blockers.includes("noise")) wanted.add("noise");
  if (blockers.includes("light")) wanted.add("light");
  if (blockers.includes("temperature")) wanted.add("temperature");
  if (blockers.includes("fragmented_sleep")) wanted.add("wakeups");

  return products
    .filter((p) => p.active)
    .filter((p) => p.tags_json.some((tag) => wanted.has(tag)))
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      name: p.name,
      reason: p.reason_template,
      url: p.affiliate_url,
    }));
}