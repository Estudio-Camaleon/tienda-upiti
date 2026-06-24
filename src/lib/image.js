const SUPABASE_STORAGE_REGEX = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)/;

export function isSupabaseUrl(url) {
  return SUPABASE_STORAGE_REGEX.test(url || "");
}

export function getOptimizedImageUrl(
  url,
  { width, height, quality = 80, resize = "cover" } = {},
) {
  if (!url) return url;
  if (!isSupabaseUrl(url)) return url;

  const params = new URLSearchParams();
  if (width) params.set("width", width);
  if (height) params.set("height", height);
  if (quality) params.set("quality", quality);
  if (resize) params.set("resize", resize);

  const queryString = params.toString();
  if (!queryString) return url;

  const match = url.match(SUPABASE_STORAGE_REGEX);
  if (!match) return url;
  const [, bucket, filePath] = match;

  return `/api/images/${bucket}/${filePath}?${queryString}`;
}

export function compressImage(file, { maxWidth = 1920, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    if (file.type === "image/gif") return resolve(file);
    if (!file.type.startsWith("image/")) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const ext = file.name.replace(/.[^.]+$/, "") + ".webp";
          const optimizedFile = new File([blob], ext, { type: "image/webp" });
          resolve(optimizedFile);
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
