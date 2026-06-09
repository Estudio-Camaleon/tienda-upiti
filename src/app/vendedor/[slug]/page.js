"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import ProductCard from "../../../components/ProductCard";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CONFIG } from "../../../data/config";
import { useStoreConfig } from "../../../context/StoreConfigContext";
import { useToast } from "../../../context/ToastContext";
import { reviewSchema } from "../../../lib/schemas";

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
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRe.test(param)) {
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
      } catch (err) {
        console.error("Error de conexion:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // update meta tags client-side when seller loads
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
        {seller.banner_url ? (
          <img
            src={seller.banner_url}
            alt="Banner"
            className="h-28 sm:h-32 w-full object-cover"
          />
        ) : (
          <div
            className="h-28 sm:h-32 w-full"
            style={{
              background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}08)`,
            }}
          />
        )}

        <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <img
              src={seller.avatar_url || "https://placehold.co/120"}
              alt={seller.company_name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-md"
            />

            <div className="flex-1 pt-2 sm:pt-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="break-words text-2xl sm:text-3xl font-black text-gray-900">
                  {seller.company_name ||
                    `${seller.first_name} ${seller.last_name}`}
                </h1>
                {seller.is_verified && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white w-fit"
                    style={{ backgroundColor: themeColor }}
                  >
                    Verificado
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
                {seller.delivery_option && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs">
                      {seller.delivery_option === "delivery"
                        ? "Envío a domicilio"
                        : "Punto de encuentro"}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
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

                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
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
                  <span className="text-xs text-gray-400">productos</span>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
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
                  <span className="text-xs text-gray-400">reseñas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-gray-900">
            Catalogo ({products.length})
          </h2>
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {seller.whatsapp_number && (
            <a
              href={`https://wa.me/${seller.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md min-h-[48px]"
              style={{ backgroundColor: themeColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              Informacion
            </h3>
            <div className="space-y-3 text-sm">
              {seller.first_name && seller.last_name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Nombre</span>
                  <span className="font-medium text-gray-900">
                    {seller.first_name} {seller.last_name}
                  </span>
                </div>
              )}
              {seller.company_name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Empresa</span>
                  <span className="font-medium text-gray-900">
                    {seller.company_name}
                  </span>
                </div>
              )}
              {seller.niche && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Nicho</span>
                  <span className="font-medium text-gray-900 text-right">
                    {seller.niche
                      .split(",")
                      .map((n) => n.trim())
                      .join(", ")}
                  </span>
                </div>
              )}
              {seller.delivery_option && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Entrega</span>
                  <span className="font-medium text-gray-900 text-right">
                    {seller.delivery_option === "delivery"
                      ? "Envío a domicilio"
                      : "Punto de encuentro"}
                  </span>
                </div>
              )}
            </div>
          </div>

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
              <div className="space-y-2">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm border transition-all min-h-[44px]"
                    style={{
                      color: themeColor,
                      borderColor: `${themeColor}30`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${themeColor}08`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
                    </svg>
                    {link.label || "Enlace"}
                  </a>
                ))}
              </div>
            ) : null;
          })()}

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
                      <img
                        src={
                          rev.reviewer?.avatar_url || "https://placehold.co/40"
                        }
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
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
