import { admin } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const result_id = searchParams.get("result_id");
  const product_id = searchParams.get("product_id");

  if (!result_id || !product_id) {
    return new Response("Missing params", { status: 400 });
  }

  const { data: product } = await admin
    .from("products")
    .select("id, affiliate_url")
    .eq("id", product_id)
    .single();

  await admin.from("affiliate_clicks").insert({
    result_id,
    product_id,
  });

  return Response.redirect(product.affiliate_url, 302);
}