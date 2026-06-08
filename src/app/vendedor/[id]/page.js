"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import ProductCard from "../../../components/ProductCard";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { CONFIG } from "../../../data/config";
import { useToast } from "../../../context/ToastContext";

export default function SellerProfile() {
  const { id } = useParams();
  const router = useRouter();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { rating: 5, comment: "" },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        if (!id || id === "null" || id === "undefined") {
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (profileError) console.error("Error cargando perfil:", profileError);
        setSeller(profileData);

        const { data: productsData, error: prodError } = await supabase
          .from("products")
          .select("*, profiles(whatsapp_number, company_name)")
          .eq("seller_id", id)
          .eq("status", "approved");

        if (prodError) console.error("Error cargando productos:", prodError);
        setProducts(productsData || []);

        const { data: reviewsData, error: revError } = await supabase
          .from("reviews")
          .select(
            `*, reviewer:profiles!reviewer_id(first_name, last_name, avatar_url)`,
          )
          .eq("seller_id", id)
          .order("created_at", { ascending: false });

        if (revError) {
          console.error("Error cargando reseñas:", revError);

          const { data: fallbackReviews } = await supabase
            .from("reviews")
            .select("*")
            .eq("seller_id", id);
          setReviews(fallbackReviews || []);
        } else {
          setReviews(reviewsData || []);
        }
      } catch (err) {
        console.error("Error de conexión:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const onSubmitReview = async (data) => {
    if (!currentUser)
      return addToast("Debes iniciar sesión para dejar una reseña.", "warning");
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert([
      {
        reviewer_id: currentUser.id,
        seller_id: id,
        rating: Number(data.rating),
        comment: data.comment,
      },
    ]);

    if (error) {
      addToast("Error al enviar reseña: " + error.message, "error");
    } else {
      addToast("Reseña enviada con éxito.", "success");
      reset();
      window.location.reload();
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div className="text-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
      </div>
    );

  if (!seller)
    return (
      <div className="text-center py-32 flex flex-col items-center justify-center animate-fade-in-up">
        <h2 className="text-2xl font-black text-gray-800">
          Vendedor no encontrado 😕
        </h2>
        <p className="text-gray-500 mt-2">
          El perfil que buscas no existe, fue eliminado, o es un producto de
          prueba.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-emerald-100 text-emerald-700 px-6 py-3 sm:py-2 rounded-full font-bold hover:bg-emerald-200 transition-colors min-h-[44px] sm:min-h-0"
        >
          Volver al inicio
        </button>
      </div>
    );

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
        ).toFixed(1)
      : "Sin reseñas";

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      {}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-emerald-500/10"></div>

        <img
          src={seller.avatar_url || "https://placehold.co/150"}
          alt={seller.company_name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md z-10"
        />

        <div className="flex-1 text-center md:text-left z-10 pt-4 md:pt-10">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            {seller.company_name || `${seller.first_name} ${seller.last_name}`}
            {seller.is_verified && (
              <span
                className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full"
                title="Vendedor verificado"
              >
                ✓ Verificado
              </span>
            )}
          </h1>
          <p className="text-gray-500 font-medium">
            {seller.niche} • {seller.city}, {seller.province}
          </p>
          {seller.social_links && (
            <a
              href={seller.social_links}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-emerald-600 font-bold hover:underline mt-2 inline-block"
            >
              🔗 Redes Sociales
            </a>
          )}
        </div>

        <div className="z-10 text-center bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 mt-4 md:mt-10">
          <div className="text-3xl font-black text-emerald-600">
            ⭐ {averageRating}
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase">
            {reviews.length} Reseñas
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-black text-gray-900">
            Catálogo ({products.length})
          </h2>
          {products.length === 0 ? (
            <p className="text-gray-400">
              Este vendedor aún no tiene productos.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          )}
        </div>

        {}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900">Reseñas</h2>

          {}
          {currentUser && currentUser.id !== id && (
            <form
              onSubmit={handleSubmit(onSubmitReview)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
            >
              <h4 className="font-bold text-sm mb-3">Dejar una reseña</h4>
              <select
                {...register("rating")}
                className="w-full mb-3 px-4 py-3 sm:py-2 rounded-xl border border-gray-200 outline-none text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-h-[44px] sm:min-h-0"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                <option value={3}>⭐⭐⭐ (3/5)</option>
                <option value={2}>⭐⭐ (2/5)</option>
                <option value={1}>⭐ (1/5)</option>
              </select>
              <textarea
                {...register("comment", { required: true })}
                placeholder="Escribe tu experiencia..."
                className="w-full px-4 py-3 sm:py-2 rounded-xl border border-gray-200 outline-none text-sm h-24 sm:h-20 mb-3 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              ></textarea>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 sm:py-2 rounded-xl text-sm disabled:opacity-50 shadow-sm min-h-[44px] sm:min-h-0"
              >
                {submitting ? "Enviando..." : "Publicar reseña"}
              </motion.button>
            </form>
          )}

          {}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Nadie ha dejado una reseña todavía.
              </p>
            ) : (
              reviews.map((rev) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={rev.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={
                        rev.reviewer?.avatar_url || "https://placehold.co/50"
                      }
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 leading-tight">
                        {rev.reviewer?.first_name} {rev.reviewer?.last_name}
                      </h5>
                      <div className="text-xs text-amber-500">
                        {"⭐".repeat(rev.rating)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{rev.comment}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.main>
  );
}
