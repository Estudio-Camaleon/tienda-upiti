import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export async function POST(request) {
  try {
    const { rating, comment, seller_id, reviewer_name } = await request.json();

    if (!rating || !comment || !seller_id) {
      return Response.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Try to get the authenticated user's session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      },
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    if (userId && userId === seller_id) {
      return Response.json(
        { error: "No podés reseñarte a vos mismo" },
        { status: 400 },
      );
    }

    // Use service role to bypass RLS for anonymous users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    const { error } = await supabaseAdmin.from("reviews").insert({
      seller_id,
      reviewer_id: userId || null,
      reviewer_name: userId ? null : reviewer_name || "Anónimo",
      rating: Number(rating),
      comment: comment.trim(),
    });

    if (error) {
      console.error("review insert error:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("reviews API error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
