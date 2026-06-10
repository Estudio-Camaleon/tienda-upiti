import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return Response.json(
        { confirmed: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      console.error("check-confirmation error:", error.message);
      return Response.json(
        { confirmed: false, error: "Failed to check confirmation" },
        { status: 500 },
      );
    }

    const confirmed = !!data?.user?.email_confirmed_at;

    return Response.json({ confirmed });
  } catch (err) {
    console.error("check-confirmation unexpected error:", err);
    return Response.json(
      { confirmed: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
