export function slugify(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function randomSuffix() {
  return Math.random().toString(36).substring(2, 6);
}

export function generateBaseSlug(firstName, lastName, companyName) {
  if (companyName) {
    const s = slugify(companyName);
    if (s) return s;
  }
  if (firstName && lastName) {
    const s = slugify(`${firstName} ${lastName}`);
    if (s) return s;
  }
  if (firstName) {
    const s = slugify(firstName);
    if (s) return s;
  }
  return "tienda";
}

export async function generateUniqueSlug(supabase, table, baseSlug) {
  let slug = baseSlug || "tienda";
  let attempts = 0;
  while (attempts < 20) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    attempts++;
    if (attempts === 1) {
      slug = `${baseSlug}-${randomSuffix()}`;
    } else {
      slug = `${baseSlug}-${attempts}`;
    }
  }
  return `${baseSlug}-${randomSuffix()}`;
}
