"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "../../../context/ToastContext";
import { useConfirm } from "../../../context/ConfirmContext";
import ProductEditModal from "../../../components/ProductEditModal";
import ProtectedImage from "../../../components/ProtectedImage";
import { CONFIG } from "../../../data/config";
import {
  getFavorites,
  getFollowedSellers,
  toggleFavorite,
  toggleFollow,
} from "../../../lib/interactions";
import StatusBadge from "./StatusBadge";
import RatingSection from "./RatingSection";
import Pagination from "./Pagination";
import ProductForm from "./ProductForm";

const ITEMS_PER_PAGE = 12;

const TABS = [
  { key: "panel", label: "Panel" },
  { key: "resenas", label: "Reseñas" },
  { key: "favoritos", label: "Favoritos" },
];

export default function SellerDashboard({ user, profile }) {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("panel");
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myWrittenReviews, setMyWrittenReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [reviewTab, setReviewTab] = useState("received");
  const [favTab, setFavTab] = useState("favorites");
  const [favorites, setFavorites] = useState([]);
  const [followedSellers, setFollowedSellers] = useState([]);
  const [favFollowLoading, setFavFollowLoading] = useState(false);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .order("id", { ascending: false })
      .limit(100);
    setProducts(data || []);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [prodRes, revRes, writtenRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("seller_id", user.id)
          .order("id", { ascending: false })
          .limit(100),
        supabase
          .from("reviews")
          .select(
            "*, reviewer:profiles!reviewer_id(first_name, last_name, avatar_url)",
          )
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select(
            "*, seller:profiles!seller_id(company_name, first_name, last_name, slug)",
          )
          .eq("reviewer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (!mounted) return;
      setProducts(prodRes.data || []);
      if (revRes.error) {
        const { data: fallback } = await supabase
          .from("reviews")
          .select("*")
          .eq("seller_id", user.id);
        setReviews(fallback || []);
      } else {
        setReviews(revRes.data || []);
      }
      setMyWrittenReviews(writtenRes.data || []);

      getFavorites(user.id).then((favData) => {
        if (mounted) setFavorites(favData);
      });
      getFollowedSellers(user.id).then((followData) => {
        if (mounted) setFollowedSellers(followData);
      });

      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  const handleSaved = () => {
    loadProducts();
    setShowForm(false);
  };

  const handleDeleteProduct = async (productId) => {
    const ok = await confirm({
      title: "¿Borrar producto?",
      message: "Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) {
      addToast("Error al eliminar: " + error.message, "error");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    addToast("Producto eliminado.", "success");
  };

  const handleDeleteReview = async (reviewId) => {
    const ok = await confirm({
      title: "¿Eliminar reseña?",
      message: "Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);
    if (error) {
      addToast("Error al eliminar: " + error.message, "error");
      return;
    }
    setMyWrittenReviews((prev) => prev.filter((r) => r.id !== reviewId));
    addToast("Reseña eliminada.", "success");
  };

  // ── Memos ──
  const searchLower = search.toLowerCase();
  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchLower)),
    [products, searchLower],
  );

  const grouped = useMemo(() => {
    const map = {};
    for (const p of filtered) {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    }
    const result = {};
    for (const cat of Object.keys(map).sort()) result[cat] = map[cat];
    return result;
  }, [filtered]);

  const flatGrouped = useMemo(() => Object.values(grouped).flat(), [grouped]);

  const totalPages = Math.max(
    1,
    Math.ceil(flatGrouped.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return flatGrouped.slice(start, start + ITEMS_PER_PAGE);
  }, [flatGrouped, safePage]);

  const pageGrouped = useMemo(() => {
    const map = {};
    for (const p of pageItems) {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    }
    return map;
  }, [pageItems]);

  const pendingCount = useMemo(
    () => products.filter((p) => p.status === "pending").length,
    [products],
  );
  const approvedCount = useMemo(
    () => products.filter((p) => p.status === "approved").length,
    [products],
  );

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ───── Tabs ───── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════ Panel ════════════ */}
      {tab === "panel" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-gray-900">Mis Productos</h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/vendedor/${profile?.slug || user.id}`}
                className="text-sm font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
              >
                Ver catálogo
              </Link>
              <button
                onClick={() => setShowForm((prev) => !prev)}
                className="text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors"
              >
                + Producto
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
              <p className="text-2xl font-black text-gray-900">
                {products.length}
              </p>
              <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
              <p className="text-2xl font-black text-amber-600">
                {pendingCount}
              </p>
              <p className="text-xs font-bold text-amber-600 uppercase">
                Pendientes
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
              <p className="text-2xl font-black text-emerald-600">
                {approvedCount}
              </p>
              <p className="text-xs font-bold text-emerald-600 uppercase">
                Aprobados
              </p>
            </div>
          </div>

          <RatingSection reviews={reviews} />

          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar productos..."
              aria-label="Buscar productos por nombre"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
            />
          </div>

          {Object.keys(pageGrouped).length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              {search
                ? "No se encontraron productos con ese nombre."
                : "Aún no tenés productos. ¡Subí tu primero!"}
            </p>
          ) : (
            <div className="space-y-8">
              {Object.entries(pageGrouped).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-black text-gray-800">
                      {category}
                    </h3>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                      >
                        <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                          {p.image ? (
                            <ProtectedImage
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full"
                              imgClassName="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <svg
                                className="w-10 h-10"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <StatusBadge
                              status={p.status}
                              reason={p.rejected_reason}
                            />
                          </div>
                        </div>
                        <div className="p-3 space-y-1.5">
                          <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                            {p.name}
                          </p>
                          {p.brand && (
                            <p className="text-xs text-gray-400 truncate">
                              {p.brand}
                            </p>
                          )}
                          <p className="text-emerald-600 font-black text-sm">
                            ${Number(p.price).toLocaleString("es-AR")}
                          </p>
                          {p.stock != null && (
                            <p
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                Number(p.stock) > 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {Number(p.stock) > 0
                                ? `${p.stock} en stock`
                                : "Sin stock"}
                            </p>
                          )}
                          {p.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {p.description}
                            </p>
                          )}
                          {p.status === "rejected" && p.rejected_reason && (
                            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg leading-tight">
                              Motivo: {p.rejected_reason}
                            </p>
                          )}
                          <div className="pt-1.5 flex items-center gap-3">
                            {p.status === "approved" && (
                              <Link
                                href={`/producto/${p.slug || p.id}`}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                              >
                                Ver en tienda
                              </Link>
                            )}
                            {p.status !== "pending" && (
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="text-xs font-bold text-gray-500 hover:text-emerald-700"
                              >
                                Editar
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 ml-auto"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          <ProductForm
            user={user}
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            onSaved={handleSaved}
          />
        </div>
      )}

      {/* ════════════ Reseñas ════════════ */}
      {tab === "resenas" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-black text-gray-900 mb-4">Reseñas</h3>

          <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3">
            <button
              onClick={() => setReviewTab("received")}
              className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors ${
                reviewTab === "received"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              Recibidas{" "}
              <span className="font-normal opacity-70">({reviews.length})</span>
            </button>
            <button
              onClick={() => setReviewTab("written")}
              className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors ${
                reviewTab === "written"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              Escritas{" "}
              <span className="font-normal opacity-70">
                ({myWrittenReviews.length})
              </span>
            </button>
          </div>

          {reviewTab === "received" && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  Todavía no recibiste reseñas.
                </p>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3"
                  >
                    <ProtectedImage
                      src={
                        rev.reviewer?.avatar_url || "https://placehold.co/40"
                      }
                      alt=""
                      className="w-9 h-9 shrink-0 mt-0.5"
                      imgClassName="rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900">
                          {rev.reviewer?.first_name || "Usuario"}{" "}
                          {rev.reviewer?.last_name || ""}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= rev.rating ? "text-amber-400" : "text-gray-200"}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 break-words">
                        {rev.comment}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {reviewTab === "written" && (
            <div className="space-y-3">
              {myWrittenReviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No escribiste reseñas todavía.
                </p>
              ) : (
                myWrittenReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900">
                          {rev.seller?.company_name ||
                            rev.seller?.first_name ||
                            "Vendedor"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= rev.rating ? "text-amber-400" : "text-gray-200"}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 break-words">
                        {rev.comment}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar reseña"
                      aria-label="Eliminar reseña"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════ Favoritos ════════════ */}
      {tab === "favoritos" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-black text-gray-900 mb-4">
            Favoritos y Seguidos
          </h3>

          <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3">
            <button
              onClick={() => setFavTab("favorites")}
              className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors ${
                favTab === "favorites"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              Favoritos{" "}
              <span className="font-normal opacity-70">
                ({favorites.length})
              </span>
            </button>
            <button
              onClick={() => setFavTab("followed")}
              className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors ${
                favTab === "followed"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              Seguidos{" "}
              <span className="font-normal opacity-70">
                ({followedSellers.length})
              </span>
            </button>
          </div>

          {favTab === "favorites" && (
            <div className="space-y-3">
              {favorites.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No tenés productos favoritos todavía.
                </p>
              ) : (
                favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3"
                  >
                    <Link
                      href={`/producto/${fav.product?.slug || fav.product_id}`}
                      className="shrink-0"
                    >
                      <ProtectedImage
                        src={
                          fav.product?.image ||
                          "https://placehold.co/60/eeeeee/999999?text=No+Img"
                        }
                        alt={fav.product?.name || ""}
                        className="w-14 h-14"
                        imgClassName="rounded-xl object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/producto/${fav.product?.slug || fav.product_id}`}
                        className="text-sm font-bold text-gray-900 hover:text-emerald-600 truncate block"
                      >
                        {fav.product?.name || "Producto"}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {fav.product?.category || ""}
                      </p>
                      <p className="text-sm font-black text-gray-800 mt-0.5">
                        {CONFIG.currency}
                        {Number(fav.product?.price || 0).toLocaleString(
                          "es-AR",
                        )}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (favFollowLoading) return;
                        setFavFollowLoading(true);
                        try {
                          await toggleFavorite(user.id, fav.product_id);
                          setFavorites((prev) =>
                            prev.filter((f) => f.id !== fav.id),
                          );
                        } catch {
                          /* ignore */
                        }
                        setFavFollowLoading(false);
                      }}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Quitar de favoritos"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {favTab === "followed" && (
            <div className="space-y-3">
              {followedSellers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No seguís a ningún vendedor todavía.
                </p>
              ) : (
                followedSellers.map((fol) => (
                  <div
                    key={fol.id}
                    className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3"
                  >
                    <Link
                      href={`/vendedor/${fol.followed?.slug || fol.followed_id}`}
                      className="shrink-0"
                    >
                      <ProtectedImage
                        src={
                          fol.followed?.avatar_url || "https://placehold.co/48"
                        }
                        alt={fol.followed?.company_name || ""}
                        className="w-12 h-12"
                        imgClassName="rounded-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/vendedor/${fol.followed?.slug || fol.followed_id}`}
                        className="text-sm font-bold text-gray-900 hover:text-emerald-600 truncate block"
                      >
                        {fol.followed?.company_name ||
                          [fol.followed?.first_name, fol.followed?.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                          "Vendedor"}
                      </Link>
                      {fol.followed?.niche && (
                        <p className="text-xs text-gray-400 truncate">
                          {fol.followed.niche}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (favFollowLoading) return;
                        setFavFollowLoading(true);
                        try {
                          await toggleFollow(user.id, fol.followed_id);
                          setFollowedSellers((prev) =>
                            prev.filter((f) => f.id !== fol.id),
                          );
                        } catch {
                          /* ignore */
                        }
                        setFavFollowLoading(false);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                      title="Dejar de seguir"
                    >
                      Dejar de seguir
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <ProductEditModal
        key={editingProduct?.id || "none"}
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaved={loadProducts}
      />
    </div>
  );
}
