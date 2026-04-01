import { admin } from "../../../lib/supabase";

const ALLOWED_ORIGIN = "https://sleepnow.figma.site";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result_id = searchParams.get("result_id");
    const product_id = searchParams.get("product_id");

    if (!result_id || !product_id) {
      return new Response("Missing params", {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const productQuery = await admin
      .from("products")
      .select("id, affiliate_url")
      .eq("id", product_id)
      .single();

    if (productQuery.error || !productQuery.data) {
      return new Response("Product not found", {
        status: 404,
        headers: corsHeaders(),
      });
    }

    await admin.from("affiliate_clicks").insert({
      result_id,
      product_id,
    });

    return Response.redirect(productQuery.data.affiliate_url, 302);
  } catch (error) {
    console.error("Product click error:", error);
    return new Response("Server error", {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
