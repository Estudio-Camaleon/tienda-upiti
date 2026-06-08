"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../../lib/schemas";
import { motion } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

const categories = [
  "Ropa",
  "Accesorios",
  "Calzado",
  "Bolsos y Carteras",
  "Deco y Hogar",
  "Arte",
  "Juguetes",
  "Libros",
  "Música",
  "Electrónica",
  "Salud y Belleza",
  "Deportes",
  "Alimentos y Bebidas",
  "Mascotas",
  "Servicios",
  "Otros",
];

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

function SellerDashboard({ user }) {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(productSchema) });

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
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("id", { ascending: false });
      if (!mounted) return;
      setProducts(data || []);
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

    if (productImage) {
      const fileExt = productImage.name.split(".").pop();
      const fileName = `${user.id}/products/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, productImage);
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    await supabase.from("products").insert([
      {
        name: data.name,
        brand: data.brand || null,
        category: data.category,
        price: Number(data.price),
        description: data.description || null,
        image: imageUrl,
        seller_id: user.id,
        status: "pending",
      },
    ]);

    addToast(
      "Producto enviado para revisión. El administrador lo revisará pronto.",
      "success",
    );
    reset();
    setProductImage(null);
    setImagePreview(null);
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
    await supabase.from("products").delete().eq("id", productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    addToast("Producto eliminado.", "success");
  };

  const pendingCount = products.filter((p) => p.status === "pending").length;
  const approvedCount = products.filter((p) => p.status === "approved").length;
  const rejectedCount = products.filter((p) => p.status === "rejected").length;

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
      className="grid lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900">Mis Productos</h2>
          <Link
            href="/dashboard/perfil"
            className="text-sm font-bold text-emerald-600 hover:underline"
          >
            Editar perfil →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
            <p className="text-2xl font-black text-gray-900">
              {products.length}
            </p>
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

        {products.length === 0 ? (
          <p className="text-gray-400">
            Aún no tenés productos. ¡Subí tu primero!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-gray-900">{p.name}</p>
                  <StatusBadge status={p.status} reason={p.rejected_reason} />
                </div>
                <p className="text-sm text-gray-500">{p.category}</p>
                <p className="text-emerald-600 font-black mt-1">
                  ${Number(p.price).toLocaleString("es-AR")}
                </p>
                {p.status === "rejected" && p.rejected_reason && (
                  <p className="text-xs text-red-500 mt-1 bg-red-50 p-2 rounded-lg">
                    Motivo: {p.rejected_reason}
                  </p>
                )}
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="mt-2 text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
        <h3 className="text-lg font-black text-gray-900 mb-4">
          Agregar Producto
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Tu producto será revisado por un administrador antes de publicarse.
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
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="brand"
              {...register("brand")}
              placeholder="Ej: Nike, Adidas"
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
              {...register("category")}
              className={`w-full px-4 py-3 rounded-xl border outline-none text-sm bg-white transition-shadow focus:ring-2 ${
                errors.category
                  ? "border-red-400 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
            >
              <option value="">Seleccioná una categoría</option>
              {categories.map((c) => (
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
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Describí tu producto, sus materiales, medidas, colores disponibles..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm h-28 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Imagen del producto
            </label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setProductImage(file || null);
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  PNG o JPG. Máximo 5 MB.
                </p>
              </div>
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
    await supabase
      .from("profiles")
      .update({ is_verified: !current })
      .eq("id", userId);
    reload();
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
                    href={`/producto/${p.id}`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Ver en tienda
                  </Link>
                )}
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
    </motion.div>
  );
}

export default function Dashboard() {
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
    <main className="max-w-6xl mx-auto px-4 py-8 flex-1 animate-fade-in-up">
      <h1 className="text-3xl font-black text-gray-900 mb-8 border-b pb-4">
        Bienvenido,{" "}
        <span className="text-emerald-600">
          {profile?.first_name || profile?.company_name || "Administrador"}
        </span>
      </h1>

      {profile?.role === "admin" ? (
        <AdminDashboard />
      ) : (
        <SellerDashboard user={user} />
      )}
    </main>
  );
}
