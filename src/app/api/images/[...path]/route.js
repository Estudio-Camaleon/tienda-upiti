import sharp from "sharp";

const ALLOWED_BUCKETS = new Set(["avatars", "products", "banners"]);

export async function GET(request, { params }) {
  try {
    const { path } = await params;
    const [bucket, ...fileParts] = path;
    const filePath = fileParts.join("/");

    if (!bucket || !filePath || !ALLOWED_BUCKETS.has(bucket)) {
      return new Response("Bad request", { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const width = searchParams.get("width")
      ? Number(searchParams.get("width"))
      : undefined;
    const height = searchParams.get("height")
      ? Number(searchParams.get("height"))
      : undefined;
    const quality = Number(searchParams.get("quality")) || 80;
    const resizeMode = searchParams.get("resize") || "cover";
    const format = searchParams.get("format") || "webp";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;

    const response = await fetch(originUrl);
    if (!response.ok) {
      return new Response("Not found", { status: 404 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const input = Buffer.from(arrayBuffer);

    let pipeline = sharp(input);

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: resizeMode === "cover" ? "cover" : "contain",
        withoutEnlargement: true,
      });
    }

    const outputFormat =
      format === "webp" ? "webp" : format === "avif" ? "avif" : "jpeg";
    const contentType = `image/${outputFormat}`;

    const output = await pipeline
      .toFormat(outputFormat, { quality })
      .toBuffer();

    return new Response(output, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": output.length.toString(),
      },
    });
  } catch {
    return new Response("Error processing image", { status: 500 });
  }
}
