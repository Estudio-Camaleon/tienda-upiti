"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import ProductCard from "../../../components/ProductCard";
import ProtectedImage from "../../../components/ProtectedImage";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CONFIG } from "../../../data/config";
import { useStoreConfig } from "../../../context/StoreConfigContext";
import { useToast } from "../../../context/ToastContext";
import { reviewSchema } from "../../../lib/schemas";
import {
  toggleFollow,
  isFollowing,
  getFollowerCount,
} from "../../../lib/interactions";

function getSocialIconPath(label, url) {
  const name = ((label || "") + " " + (url || "")).toLowerCase();

  if (
    name.includes("facebook") ||
    name.includes("fb.com") ||
    name.includes("face")
  ) {
    return (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    );
  }

  if (name.includes("instagram") || name.includes("insta")) {
    return (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    );
  }

  if (name.includes("twitter") || name.includes("x.com")) {
    return (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    );
  }

  if (name.includes("tiktok")) {
    return (
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    );
  }

  if (name.includes("youtube") || name.includes("yt")) {
    return (
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    );
  }

  if (name.includes("linkedin")) {
    return (
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    );
  }

  if (name.includes("pinterest")) {
    return (
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.403.042-3.438.218-.932 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    );
  }

  if (name.includes("whatsapp")) {
    return (
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    );
  }

  /* Default — link / globe */
  return (
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  );
}

function StarRating({ rating, size = "sm" }) {
  const sizeClass = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < Math.round(rating);
        return (
          <svg
            key={index}
            className={`${sizeClass} ${filled ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      })}
    </span>
  );
}

function RatingInput({ value, onChange, themeColor }) {
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Calificacion"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const active = rating <= Number(value || 0);
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={Number(value) === rating}
            aria-label={`${rating} estrella${rating === 1 ? "" : "s"}`}
            onClick={() => onChange(rating)}
            className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2"
            style={{
              color: active ? "#f59e0b" : "#d1d5db",
              "--tw-ring-color": `${themeColor}40`,
            }}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="w-32 h-32 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-3 pt-4 w-full">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
        <div className="w-28 h-20 bg-gray-100 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-100 rounded-2xl" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-20 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function SellerProfile() {
  const { slug } = useParams();
  const router = useRouter();
  const { mainColor } = useStoreConfig();
  const themeColor = mainColor || CONFIG.mainColor;
  const { addToast } = useToast();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: "" },
  });
  const selectedRating = useWatch({ control, name: "rating" });

  async function findProfile(param) {
    let { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", param)
      .maybeSingle();
    if (data) return data;

    const esNumero = /^\d+$/.test(param);
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (esNumero || uuidRe.test(param)) {
      const { data: byId } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", param)
        .maybeSingle();
      if (byId) return byId;
    }
    return null;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        if (!slug || slug === "null" || slug === "undefined") {
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        const profileData = await findProfile(slug);
        if (!profileData) {
          setLoading(false);
          return;
        }
        setSeller(profileData);

        const [productsData, reviewsData] = await Promise.all([
          supabase
            .from("products")
            .select(
              "*, profiles(whatsapp_number, company_name, avatar_url, slug)",
            )
            .eq("seller_id", profileData.id)
            .eq("status", "approved"),
          supabase
            .from("reviews")
            .select(
              `*, reviewer:profiles!reviewer_id(first_name, last_name, avatar_url)`,
            )
            .eq("seller_id", profileData.id)
            .order("created_at", { ascending: false }),
        ]);

        setProducts(productsData.data || []);
        if (reviewsData.error) {
          const { data: fallbackReviews } = await supabase
            .from("reviews")
            .select("*")
            .eq("seller_id", profileData.id);
          setReviews(fallbackReviews || []);
        } else {
          setReviews(reviewsData.data || []);
        }

        // Load follower count + following status
        const count = await getFollowerCount(profileData.id);
        setFollowerCount(count);
        if (session?.user && session.user.id !== profileData.id) {
          const isF = await isFollowing(session.user.id, profileData.id);
          setFollowing(isF);
        }
      } catch (err) {
        console.error("Error de conexion:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  useEffect(() => {
    if (loading) return;
    const title = seller
      ? `${seller.company_name || `${seller.first_name} ${seller.last_name}`} - ${CONFIG.storeName}`
      : `${CONFIG.storeName} - Vendedores`;
    const description =
      seller?.bio ||
      seller?.niche ||
      `Conoce a ${seller?.company_name || seller?.first_name} en ${CONFIG.storeName}`;
    const image = seller?.avatar_url || "/media/logo/icono_upiti.webp";

    const upsertMeta = (attr, name, content) => {
      const selector =
        attr === "name" ? `meta[name="${name}"]` : `meta[property="${name}"]`;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "theme-color", themeColor || CONFIG.mainColor);
  }, [loading, seller, themeColor]);

  const onSubmitReview = async (data) => {
    if (!currentUser)
      return addToast("Debes iniciar sesión para dejar una reseña.", "warning");
    setSubmitting(true);

    const payload = {
      reviewer_id: currentUser.id,
      seller_id: seller.id,
      rating: Number(data.rating),
      comment: data.comment.trim(),
    };

    const { data: insertedReview, error } = await supabase
      .from("reviews")
      .insert([payload])
      .select(
        `*, reviewer:profiles!reviewer_id(first_name, last_name, avatar_url)`,
      )
      .single();

    if (error) {
      addToast("Error al enviar reseña: " + error.message, "error");
    } else {
      addToast("Reseña publicada con éxito.", "success");
      setReviews((prev) => [insertedReview || payload, ...prev]);
      reset({ rating: 5, comment: "" });
    }
    setSubmitting(false);
  };

  const handleRatingChange = (rating) => {
    setValue("rating", rating, { shouldDirty: true, shouldValidate: true });
  };

  async function handleToggleFollow() {
    if (!currentUser || followLoading) return;
    setFollowLoading(true);
    try {
      const result = await toggleFollow(currentUser.id, seller.id);
      setFollowing(result.following);
      setFollowerCount((c) => c + (result.following ? 1 : -1));
    } catch {
      // ignore
    }
    setFollowLoading(false);
  }

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.trim().toLowerCase();
    return products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [products, searchTerm]);

  if (loading) return <LoadingSkeleton />;

  if (!seller) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-32 flex-1 flex flex-col items-center justify-center px-4"
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-800">
          Vendedor no encontrado
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          El perfil que buscas no existe o fue eliminado.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all min-h-[44px]"
          style={{ backgroundColor: themeColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "";
          }}
        >
          Volver al inicio
        </button>
      </motion.div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
      : 0;

  const ratingDisplay = reviews.length > 0 ? averageRating.toFixed(1) : null;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 py-8 flex-1"
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-8 relative"
        style={{ boxShadow: `0 0 0 1px ${themeColor}08` }}
      >
        <div
          className="h-28 sm:h-32 w-full transition-colors duration-500"
          style={{
            backgroundColor: seller.theme_color || "#f3f4f6",
          }}
        />

        <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <ProtectedImage
              src={seller.avatar_url || "https://placehold.co/120"}
              alt={seller.company_name}
              className="w-28 h-28 sm:w-32 sm:h-32 shrink-0"
              imgClassName="rounded-2xl object-cover border-4 border-white shadow-md"
            />

            <div className="flex-1 pt-2 sm:pt-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="break-words text-2xl sm:text-3xl font-black text-gray-900">
                  {seller.company_name ||
                    [seller.first_name, seller.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    "Vendedor"}
                </h1>
                {seller.is_verified && (
                  <span className="group relative inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white bg-blue-600 w-fit cursor-help">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verificado por Upiti
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-[200px] text-center leading-relaxed whitespace-normal">
                        {seller.verified_reason ||
                          "Este vendedor ha sido verificado por Upiti."}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                {seller.niche && (
                  <div className="flex flex-wrap gap-1.5">
                    {seller.niche.split(",").map((n, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${themeColor}15`,
                          color: themeColor,
                        }}
                      >
                        {n.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {seller.delivery_option &&
                  (() => {
                    const opts = seller.delivery_option
                      .split(",")
                      .filter(Boolean);
                    if (opts.length === 0) return null;
                    const labels = opts.map((o) =>
                      o === "delivery"
                        ? "Envío a domicilio"
                        : "Punto de encuentro",
                    );
                    return (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs">{labels.join(" y ")}</span>
                      </>
                    );
                  })()}
              </div>

              {seller.characteristics && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {seller.characteristics.split(",").map((feature, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-gray-600 ring-1 ring-gray-200"
                    >
                      {feature.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                <div className="flex items-center gap-1 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-lg">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: themeColor }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span
                    className="text-sm font-bold"
                    style={{ color: themeColor }}
                  >
                    {ratingDisplay || "-"}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({reviews.length})
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-lg">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="text-sm font-bold text-gray-700">
                    {products.length}
                  </span>
                  <span className="hidden sm:inline text-xs text-gray-400">
                    productos
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-lg">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-gray-700">
                    {reviews.length}
                  </span>
                  <span className="hidden sm:inline text-xs text-gray-400">
                    reseñas
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-lg">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-gray-700">
                    {followerCount}
                  </span>
                  <span className="hidden sm:inline text-xs text-gray-400">
                    {followerCount === 1 ? "seguidor" : "seguidores"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions — visible right below profile */}
      <div className="bg-white rounded-3xl border border-gray-100 p-3 sm:p-5 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          {currentUser && currentUser.id !== seller.id && (
            <button
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[38px] sm:min-h-[44px] shadow-sm ${
                following
                  ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  : "text-white"
              }`}
              style={following ? {} : { backgroundColor: themeColor }}
              title={following ? "Dejar de seguir" : "Seguir vendedor"}
            >
              <svg
                className={`w-4 h-4 ${following ? "text-emerald-500" : ""}`}
                fill={following ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                {following ? (
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                )}
              </svg>
              <span className="hidden sm:inline">
                {followLoading
                  ? "Cargando..."
                  : following
                    ? "Siguiendo"
                    : "Seguir"}
              </span>
            </button>
          )}

          {seller.whatsapp_number && (
            <a
              href={`https://wa.me/${seller.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-md min-h-[38px] sm:min-h-[44px]"
              style={{ backgroundColor: themeColor }}
              title="Contactar por WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden sm:inline">Contactar</span>
            </a>
          )}

          {(() => {
            let links = [];
            if (seller.social_links) {
              try {
                const parsed = JSON.parse(seller.social_links);
                if (Array.isArray(parsed)) links = parsed;
              } catch {
                links = seller.social_links.trim()
                  ? [{ label: "Red Social", url: seller.social_links }]
                  : [];
              }
            }
            return links.length > 0 ? (
              <span className="flex items-center gap-2 flex-wrap">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all min-h-[38px] sm:min-h-[44px]"
                    style={{
                      color: themeColor,
                      borderColor: `${themeColor}30`,
                    }}
                    title={link.label || "Enlace"}
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {getSocialIconPath(link.label, link.url)}
                    </svg>
                    <span className="hidden sm:inline">
                      {link.label || "Enlace"}
                    </span>
                  </a>
                ))}
              </span>
            ) : null;
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900 shrink-0">
              Catálogo
            </h2>
            <div className="relative flex-1 max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar en este catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none transition-all"
                style={{ borderColor: `${themeColor}30` }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeColor;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = `${themeColor}30`;
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium shrink-0">
              {searchTerm.trim()
                ? `${filteredProducts.length} de ${products.length}`
                : `${products.length} producto${products.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <svg
                className="w-12 h-12 mx-auto text-gray-200 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-400">
                Este vendedor aun no tiene productos publicados.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <svg
                className="w-12 h-12 mx-auto text-gray-200 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-gray-400">
                No hay productos que coincidan con tu búsqueda.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-3 text-sm font-bold underline-offset-2 underline"
                style={{ color: themeColor }}
              >
                Limpiar filtro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Reseñas del vendedor
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Compartí tu experiencia para ayudar a otros compradores.
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-gray-900">
                  {ratingDisplay || "-"}
                </p>
                <StarRating rating={averageRating} />
                <p className="text-[11px] text-gray-400 mt-1">
                  {reviews.length} reseña{reviews.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {currentUser && currentUser.id !== seller?.id && (
              <form
                onSubmit={handleSubmit(onSubmitReview)}
                className="mb-5 pb-5 border-b border-gray-100"
              >
                <h4 className="font-bold text-sm mb-3">Dejar una reseña</h4>
                <input type="hidden" {...register("rating")} />
                <div className="mb-3">
                  <RatingInput
                    value={selectedRating}
                    onChange={handleRatingChange}
                    themeColor={themeColor}
                  />
                  {errors.rating && (
                    <p className="text-red-500 text-xs mt-1 font-medium">
                      {errors.rating.message}
                    </p>
                  )}
                </div>
                <textarea
                  {...register("comment")}
                  placeholder="Escribí tu experiencia con este vendedor..."
                  maxLength={1000}
                  className={`w-full px-4 py-3 sm:py-2.5 rounded-xl border outline-none text-sm h-24 sm:h-20 resize-none transition-all ${errors.comment ? "border-red-300" : "border-gray-200"}`}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
                {errors.comment && (
                  <p className="text-red-500 text-xs mt-1 mb-3 font-medium">
                    {errors.comment.message}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full text-white font-bold py-3 sm:py-2.5 rounded-xl text-sm disabled:opacity-50 shadow-sm min-h-[44px] sm:min-h-0 transition-all"
                  style={{ backgroundColor: themeColor }}
                  onMouseEnter={(e) => {
                    if (!submitting)
                      e.currentTarget.style.filter = "brightness(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "";
                  }}
                >
                  {submitting ? "Enviando..." : "Publicar reseña"}
                </motion.button>
              </form>
            )}

            {!currentUser && (
              <div className="mb-5 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-sm font-bold text-gray-900">
                  Iniciá sesión para dejar una reseña
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="mt-3 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Ingresar
                </button>
              </div>
            )}

            {currentUser?.id === seller?.id && (
              <div className="mb-5 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-sm text-gray-500">
                  Este es tu perfil. Otros usuarios podrán dejarte reseñas acá.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  Todavía no hay reseñas. Sé el primero en compartir tu
                  experiencia.
                </p>
              ) : (
                reviews.map((rev) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={rev.id}
                    className="bg-gray-50 p-4 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <ProtectedImage
                        src={
                          rev.reviewer?.avatar_url || "https://placehold.co/40"
                        }
                        alt="Avatar"
                        className="w-8 h-8"
                        imgClassName="rounded-full object-cover"
                      />
                      <div>
                        <h5 className="font-bold text-sm text-gray-900 leading-tight">
                          {rev.reviewer?.first_name || "Usuario"}{" "}
                          {rev.reviewer?.last_name || ""}
                        </h5>
                        <StarRating rating={rev.rating} />
                      </div>
                    </div>
                    <p className="break-words text-sm text-gray-600">
                      {rev.comment}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
