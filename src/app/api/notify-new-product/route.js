import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../../lib/email";

export async function POST(request) {
  try {
    const { productName, sellerName, productSlug, price } =
      await request.json();

    if (!productName || !sellerName || !productSlug) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    const { data: admins, error: adminError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError.message);
      return Response.json(
        { error: "Failed to fetch admins" },
        { status: 500 },
      );
    }

    if (!admins || admins.length === 0) {
      return Response.json({ message: "No admins found" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Upiti";
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
    const dashboardUrl = `${siteUrl}/dashboard`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ed355d; margin: 0;">${storeName}</h1>
          <p style="color: #666; font-size: 16px;">Nuevo producto pendiente de revisión</p>
        </div>
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 16px 0; color: #111; font-size: 20px;">${productName}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 100px;">Vendedor</td>
              <td style="padding: 8px 0; color: #111; font-weight: 500;">${sellerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Precio</td>
              <td style="padding: 8px 0; color: #111; font-weight: 500;">${currency}${price}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Estado</td>
              <td style="padding: 8px 0;">
                <span style="background-color: #fef3c7; color: #92400e; padding: 2px 10px; border-radius: 999px; font-size: 13px; font-weight: 500;">Pendiente</span>
              </td>
            </tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #ed355d; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Ir al panel de administración
            </a>
          </div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          Este correo fue enviado automáticamente por ${storeName}.
        </p>
      </div>
    `;

    const adminEmails = admins.map((a) => a.email).filter(Boolean);

    if (adminEmails.length === 0) {
      return Response.json({ message: "No admin emails found" });
    }

    await sendEmail({
      to: adminEmails.join(","),
      subject: `Nuevo producto pendiente: ${productName}`,
      html,
    });

    return Response.json({ success: true, sentTo: adminEmails.length });
  } catch (err) {
    console.error("notify-new-product error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
