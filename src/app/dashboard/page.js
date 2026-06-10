"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../../lib/schemas";
import { slugify, generateUniqueSlug } from "../../lib/slug";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import ProductEditModal from "../../components/ProductEditModal";
import { CATEGORIES, getCategoryFields } from "../../data/categories";

const statusStyles = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

function StatusBadge({ status, reason }) {
  return (
    <span
      title={reason || ""}
      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyles[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status === "approved"
        ? "Aprobado"
        : status === "pending"
          ? "Pendiente"
          : "Rechazado"}
    </span>
  );
}

const MAX_RATING = 5.5;
const ITEMS_PER_PAGE = 12;

function StarBar({ value, max = MAX_RATING }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div
        className="bg-amber-400 h-2.5 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function RatingSection({ reviews }) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (counts[r.rating] !== undefined) counts[r.rating]++;
  });
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const pct = total > 0 ? (avg / MAX_RATING) * 100 : 0;

  if (total === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        Calificaciones
      </h3>
      <div className="flex items-end gap-6 mb-5">
        <div className="text-center">
          <p className="text-4xl font-black text-gray-900">{avg.toFixed(1)}</p>
          <p className="text-xs text-gray-400">/ {MAX_RATING.toFixed(1)}</p>
        </div>
        <div className="flex-1">
          <StarBar value={avg} />
          <p className="text-xs text-gray-500 mt-1">
            {pct.toFixed(1)}% positivo &bull; {total} reseña
            {total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const starPct = total > 0 ? (counts[star] / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-bold text-gray-600 text-right">
                {star}
              </span>
              <svg
                className="w-3.5 h-3.5 text-amber-400 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full"
                    style={{ width: `${starPct}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-gray-400">
                {starPct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SellerDashboard({ user }) {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState([null, null, null, null]);
  const [uploading, setUploading] = useState(false);
  const [specs, setSpecs] = useState({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(productSchema) });

  const selectedCategory = useWatch({ control, name: "category" });
  const categoryFields = selectedCategory
    ? getCategoryFields(selectedCategory)
    : [];

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .order("id", { ascending: false });
    setProducts(data || []);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [prodRes, revRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("seller_id", user.id)
          .order("id", { ascending: false }),
        supabase.from("reviews").select("rating").eq("seller_id", user.id),
      ]);
      if (!mounted) return;
      setProducts(prodRes.data || []);
      setReviews(revRes.data || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  const onSubmit = async (data) => {
    if (!user) return;
    setUploading(true);
    let imageUrl = null;

    const uploadedUrls = [];
    for (const file of imageFiles) {
      if (!file) continue;
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/products/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);
      if (uploadError) {
        addToast("Error al subir imagen: " + uploadError.message, "error");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);
      uploadedUrls.push(urlData.publicUrl);
    }

    const productSlug = slugify(data.name) || "producto";
    const slug = await generateUniqueSlug(supabase, "products", productSlug);

    const { error: insertError } = await supabase.from("products").insert([
      {
        name: data.name,
        brand: data.brand || null,
        category: data.category,
        price: Number(data.price),
        description: data.description || null,
        image: uploadedUrls[0] || null,
        images: uploadedUrls,
        seller_id: user.id,
        status: "pending",
        slug,
        specifications: specs,
      },
    ]);

    if (insertError) {
      addToast("Error al crear el producto: " + insertError.message, "error");
      setUploading(false);
      return;
    }

    addToast(
      "Producto enviado para revisión. El administrador lo revisará pronto.",
      "success",
    );
    reset();
    setImageFiles([null, null, null, null]);
    setImagePreviews([null, null, null, null]);
    setUploading(false);
    loadProducts();
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

  // Extract onChange from register to wrap with specs reset
  const { onChange: catOnChange, ...catRest } = register("category");

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
    const sorted = Object.keys(map).sort();
    const result = {};
    for (const cat of sorted) result[cat] = map[cat];
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

  const pendingCount = products.filter((p) => p.status === "pending").length;
  const approvedCount = products.filter((p) => p.status === "approved").length;

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-gray-900">Mis Productos</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors"
          >
            {showForm ? "Cerrar" : "+ Producto"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
          <p className="text-2xl font-black text-gray-900">{products.length}</p>
          <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
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
                <h3 className="text-lg font-black text-gray-800">{category}</h3>
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
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
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
                          <>
                            <Link
                              href={`/producto/${p.slug || p.id}`}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                            >
                              Ver en tienda
                            </Link>
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="text-xs font-bold text-gray-500 hover:text-emerald-700"
                            >
                              Editar
                            </button>
                          </>
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
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            ← Anterior
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - safePage) <= 2,
              )
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-gray-300 text-sm">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                      p === safePage
                        ? "bg-emerald-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              id="agregar-producto"
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 scroll-mt-24"
            >
              <h3 className="text-lg font-black text-gray-900 mb-4">
                Agregar Producto
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Tu producto será revisado por un administrador antes de
                publicarse.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Nombre del producto
                  </label>
                  <input
                    id="name"
                    {...register("name")}
                    placeholder="Ej: Cartera de cuero"
                    maxLength={100}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${
                      errors.name
                        ? "border-red-400 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="brand"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Marca{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="brand"
                    {...register("brand")}
                    placeholder="Ej: Nike, Adidas"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Categoría
                  </label>
                  <select
                    id="category"
                    onChange={(e) => {
                      catOnChange(e);
                      setSpecs({});
                    }}
                    {...catRest}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm bg-white transition-shadow focus:ring-2 ${
                      errors.category
                        ? "border-red-400 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  >
                    <option value="">Seleccioná una categoría</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Precio
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                      $
                    </span>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register("price")}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${
                        errors.price
                          ? "border-red-400 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Descripción{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describí tu producto, sus materiales, medidas, colores disponibles..."
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm h-28 resize-none"
                  />
                </div>

                {categoryFields.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">
                      Especificaciones de {selectedCategory}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categoryFields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            {field.label}
                          </label>
                          {field.type === "select" ? (
                            <select
                              value={specs[field.name] || ""}
                              onChange={(e) =>
                                setSpecs((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm bg-white"
                            >
                              <option value="">Seleccionar...</option>
                              {field.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={specs[field.name] || ""}
                              onChange={(e) =>
                                setSpecs((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                              placeholder={field.placeholder || ""}
                              maxLength={100}
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Imágenes del producto
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Subí hasta 3 fotos y opcionalmente un GIF. Primera foto =
                    principal.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        index: 0,
                        label: "Foto 1",
                        required: true,
                        hint: "Principal",
                      },
                      {
                        index: 1,
                        label: "Foto 2",
                        required: false,
                        hint: "Opcional",
                      },
                      {
                        index: 2,
                        label: "Foto 3",
                        required: false,
                        hint: "Opcional",
                      },
                      {
                        index: 3,
                        label: "GIF",
                        required: false,
                        hint: "Opcional",
                      },
                    ].map((slot) => (
                      <div
                        key={slot.index}
                        className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 min-h-[130px] transition-colors cursor-pointer hover:bg-gray-50 ${
                          imagePreviews[slot.index]
                            ? "border-emerald-300 bg-emerald-50/30"
                            : "border-gray-200"
                        }`}
                        onClick={() => {
                          document
                            .getElementById(`img-upload-${slot.index}`)
                            .click();
                        }}
                      >
                        {imagePreviews[slot.index] ? (
                          <img
                            src={imagePreviews[slot.index]}
                            alt=""
                            className="w-full h-full absolute inset-0 object-cover rounded-xl"
                          />
                        ) : (
                          <svg
                            className="w-8 h-8 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        <span
                          className={`text-xs font-bold z-10 ${
                            imagePreviews[slot.index]
                              ? "text-white bg-black/50 px-2 py-0.5 rounded-full"
                              : "text-gray-500"
                          }`}
                        >
                          {slot.label}
                          {slot.required && (
                            <span className="text-red-400 ml-0.5">*</span>
                          )}
                        </span>
                        {!imagePreviews[slot.index] && (
                          <span className="text-[10px] text-gray-400">
                            {slot.hint}
                          </span>
                        )}
                        <input
                          id={`img-upload-${slot.index}`}
                          type="file"
                          accept={
                            slot.index === 3 ? ".gif,image/gif" : "image/*"
                          }
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const newFiles = [...imageFiles];
                            const newPreviews = [...imagePreviews];
                            newFiles[slot.index] = file;
                            newPreviews[slot.index] = URL.createObjectURL(file);
                            setImageFiles(newFiles);
                            setImagePreviews(newPreviews);
                          }}
                        />
                        {imagePreviews[slot.index] && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-10 hover:bg-red-600 transition-colors shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newFiles = [...imageFiles];
                              const newPreviews = [...imagePreviews];
                              newFiles[slot.index] = null;
                              newPreviews[slot.index] = null;
                              setImageFiles(newFiles);
                              setImagePreviews(newPreviews);
                            }}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all text-sm"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Subiendo...
                    </span>
                  ) : (
                    "Enviar para revisión"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductEditModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaved={loadProducts}
      />
    </div>
  );
}

function AdminDashboard() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchAll = useCallback(async () => {
    const [usersRes, productsRes, reviewsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("*, profiles(company_name, email)")
        .order("id", { ascending: false }),
      supabase.from("reviews").select("*"),
    ]);
    return {
      users: usersRes.data || [],
      products: productsRes.data || [],
      reviews: reviewsRes.data || [],
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchAll();
      if (!mounted) return;
      setUsers(data.users);
      setProducts(data.products);
      setReviews(data.reviews);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchAll]);

  const reload = useCallback(async () => {
    const data = await fetchAll();
    setUsers(data.users);
    setProducts(data.products);
    setReviews(data.reviews);
  }, [fetchAll]);

  const handleApprove = async (productId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: "approved", rejected_reason: null }
          : p,
      ),
    );
    const { error } = await supabase
      .from("products")
      .update({ status: "approved", rejected_reason: null })
      .eq("id", productId);
    if (error) {
      addToast("Error al aprobar: " + error.message, "error");
      return reload();
    }
  };

  const handleReject = async (productId) => {
    if (!rejectReason.trim())
      return addToast("Escribí un motivo de rechazo.", "warning");
    const ok = await confirm({
      title: "¿Rechazar producto?",
      message: `Motivo: "${rejectReason.trim()}"`,
      confirmText: "Rechazar",
      variant: "danger",
    });
    if (!ok) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: "rejected", rejected_reason: rejectReason.trim() }
          : p,
      ),
    );
    const { error } = await supabase
      .from("products")
      .update({ status: "rejected", rejected_reason: rejectReason.trim() })
      .eq("id", productId);
    if (error) {
      addToast("Error al rechazar: " + error.message, "error");
      return reload();
    }
    setRejectingId(null);
    setRejectReason("");
  };

  const openReject = (productId) => {
    setRejectingId((prev) => (prev === productId ? null : productId));
    setRejectReason("");
  };

  const handleToggleVerify = async (userId, current) => {
    const next = !current;
    try {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: next } : u)),
      );

      // Add .select() here. Catch silent block.
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_verified: next })
        .eq("id", userId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Sin permisos o regla RLS bloquea.");

      addToast(
        next ? "Usuario verificado." : "Verificación quitada.",
        "success",
      );
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: current } : u)),
      );
      addToast("Error al actualizar verificación: " + err.message, "error");
    }
  };

  const pendingProducts = products.filter((p) => p.status === "pending");
  const filteredProducts =
    statusFilter === "all"
      ? products
      : products.filter((p) => p.status === statusFilter);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <p className="text-2xl font-black text-gray-900">{users.length}</p>
          <p className="text-xs font-bold text-gray-500 uppercase">Usuarios</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <p className="text-2xl font-black text-gray-900">{products.length}</p>
          <p className="text-xs font-bold text-gray-500 uppercase">Productos</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
          <p className="text-2xl font-black text-amber-600">
            {pendingProducts.length}
          </p>
          <p className="text-xs font-bold text-amber-600 uppercase">
            Pendientes
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <p className="text-2xl font-black text-gray-900">{reviews.length}</p>
          <p className="text-xs font-bold text-gray-500 uppercase">Reseñas</p>
        </div>
      </div>

      {pendingProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
            Moderación pendiente
            {pendingProducts.length > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingProducts.length}
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {pendingProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {p.image && (
                      <img
                        src={p.image}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">
                          {p.name}
                        </p>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                          Pendiente
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {p.category} — $
                        {Number(p.price).toLocaleString("es-AR")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.profiles?.company_name ||
                          p.profiles?.email ||
                          "Sin vendedor"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-xs py-3 sm:py-2 px-5 sm:px-4 rounded-xl min-h-[44px] sm:min-h-0"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => openReject(p.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-xs py-3 sm:py-2 px-5 sm:px-4 rounded-xl min-h-[44px] sm:min-h-0"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
                {rejectingId === p.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      placeholder="Motivo de rechazo..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleReject(p.id)}
                      className="flex-1 px-4 sm:px-3 py-3 sm:py-2 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-500 min-h-[44px] sm:min-h-0"
                      autoFocus
                    />
                    <button
                      onClick={() => handleReject(p.id)}
                      className="bg-red-600 text-white font-bold text-xs py-3 sm:py-2 px-5 sm:px-4 rounded-xl min-h-[44px] sm:min-h-0"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-gray-900">Usuarios</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={u.avatar_url || "https://placehold.co/40"}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">
                    {u.first_name || u.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`font-bold uppercase ${u.role === "admin" ? "text-purple-600" : "text-emerald-600"}`}
                >
                  {u.role === "admin" ? "Administrador" : "Vendedor"}
                </span>
                {u.is_verified && (
                  <span className="text-emerald-600 font-bold">
                    ✓ Verificado
                  </span>
                )}
              </div>
              {u.role !== "admin" && (
                <button
                  onClick={() => handleToggleVerify(u.id, u.is_verified)}
                  className={`mt-2 text-xs font-bold ${u.is_verified ? "text-gray-400 hover:text-red-500" : "text-emerald-600 hover:text-emerald-700"}`}
                >
                  {u.is_verified ? "Quitar verificación" : "Verificar usuario"}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-gray-900">Productos</h2>
          <div className="flex gap-2">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  statusFilter === s
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all"
                  ? "Todos"
                  : s === "approved"
                    ? "Aprobados"
                    : s === "pending"
                      ? "Pendientes"
                      : "Rechazados"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {p.image && (
                  <img
                    src={p.image}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {p.name}
                    </p>
                    <StatusBadge status={p.status} reason={p.rejected_reason} />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {p.profiles?.company_name || "Sin vendedor"}
                  </p>
                  <p className="text-emerald-600 font-black text-sm">
                    ${Number(p.price).toLocaleString("es-AR")}
                  </p>
                  {p.status === "rejected" && p.rejected_reason && (
                    <p className="text-xs text-red-500 mt-1 leading-tight">
                      {p.rejected_reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-50">
                {p.status === "approved" && (
                  <Link
                    href={`/producto/${p.slug || p.id}`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Ver en tienda
                  </Link>
                )}
                <button
                  onClick={() => setEditingProduct(p)}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "¿Eliminar producto definitivamente?",
                      message: "Esta acción no se puede deshacer.",
                      confirmText: "Eliminar",
                      variant: "danger",
                    });
                    if (!ok) return;
                    const { error } = await supabase
                      .from("products")
                      .delete()
                      .eq("id", p.id);
                    if (!error) {
                      reload();
                      addToast("Producto eliminado.", "success");
                    } else
                      addToast("Error al eliminar: " + error.message, "error");
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 ml-auto"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProductEditModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaved={reload}
      />
    </motion.div>
  );
}

export default function Dashboard() {
  const { addToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      if (!mounted) return;
      setUser(session.user);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (!mounted) return;
      setProfile(profileData);
      setLoading(false);
    }
    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 py-8 flex-1"
    >
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
          {profile?.role !== "admin" && (
            <img
              src={profile?.avatar_url || "https://placehold.co/48"}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-gray-100"
            />
          )}
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Bienvenido,{" "}
              <span className="text-emerald-600">
                {profile?.first_name ||
                  profile?.company_name ||
                  "Administrador"}
              </span>
            </h1>
            {profile?.company_name && (
              <p className="text-sm text-gray-500">{profile.company_name}</p>
            )}
          </div>
        </div>
        {profile?.role !== "admin" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/vendedor/${profile?.slug || user.id}`,
                );
                addToast("Enlace copiado al portapapeles.", "success");
              }}
              className="text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors shrink-0"
            >
              Copiar enlace
            </button>
            <Link
              href="/dashboard/perfil"
              className="text-sm font-bold text-emerald-600 hover:underline shrink-0"
            >
              Editar perfil →
            </Link>
          </div>
        )}
      </div>

      {profile?.role === "admin" ? (
        <AdminDashboard />
      ) : (
        <SellerDashboard user={user} />
      )}
    </motion.main>
  );
}
