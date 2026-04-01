import { admin } from "../../../lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result_id = searchParams.get("result_id");
    const product_id = searchParams.get("product_id");

    if (!result_id || !product_id) {
      return new Response("Missing params", { status: 400 });
    }

    const productQuery = await admin
      .from("products")
      .select("id, affiliate_url")
      .eq("id", product_id)
      .single();

    if (productQuery.error || !productQuery.data) {
      return new Response("Product not found", { status: 404 });
    }

    const product = productQuery.data;

    await admin.from("affiliate_clicks").insert({
      result_id,
      product_id,
    });

    return Response.redirect(product.affiliate_url, 302);
  } catch (error) {
    console.error("Product click error:", error);
    return new Response("Server error", { status: 500 });
  }
}
