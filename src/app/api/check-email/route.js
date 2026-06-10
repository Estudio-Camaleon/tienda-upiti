import { createClient } from "@supabase/supabase-js";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return Response.json(
        { exists: false, error: "Invalid email" },
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

    const perPage = 1000;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("check-email error:", error.message);
        return Response.json(
          { exists: false, error: "Failed to check email" },
          { status: 500 },
        );
      }

      const users = data?.users || [];
      const exists = users.some(
        (user) => normalizeEmail(user.email) === normalizedEmail,
      );

      if (exists) return Response.json({ exists: true });
      if (users.length < perPage) break;
    }

    return Response.json({ exists: false });
  } catch (err) {
    console.error("check-email unexpected error:", err);
    return Response.json(
      { exists: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
