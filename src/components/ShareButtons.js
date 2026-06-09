"use client";
import { useToast } from "../context/ToastContext";

export default function ShareButtons({ url, title }) {
  const { addToast } = useToast();

  const canShare = typeof navigator.share === "function";

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if (e.name !== "AbortError") {
          await fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      addToast("Enlace copiado al portapapeles.", "success");
    } catch {
      addToast("No se pudo copiar el enlace.", "error");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-gray-600 hover:text-emerald-600 hover:bg-white transition-all"
      aria-label="Compartir producto"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
    </button>
  );
}
