"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "../../../context/ToastContext";
import { useConfirm } from "../../../context/ConfirmContext";
import ProductEditModal from "../../../components/ProductEditModal";
import ProtectedImage from "../../../components/ProtectedImage";
import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";

const ITEMS_PER_PAGE = 15;
const RECENT_DAYS = 7;

const BASE_TABS = [
  { key: "panel", label: "Panel" },
  { key: "pendientes", label: "Pendientes" },
  { key: "usuarios", label: "Usuarios" },
  { key: "productos", label: "Productos" },
  { key: "estadisticas", label: "Estadísticas" },
  { key: "reportes", label: "Reportes" },
];

function isRecent(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = Date.now() - RECENT_DAYS * 86400000;
  return d.getTime() > cutoff;
}

export default function AdminDashboard({ extraTabs = [] }) {
  const TABS = [...BASE_TABS, ...extraTabs];
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("panel");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [moderatingId, setModeratingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");

  const fetchAll = useCallback(async () => {
    const [usersRes, productsRes, reviewsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("products")
        .select("*, profiles(company_name, email)")
        .order("id", { ascending: false })
        .limit(200),
      supabase
        .from("reviews")
        .select(
          "*, seller:profiles!seller_id(company_name, first_name, last_name)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
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
    setModeratingId(productId);
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
      setModeratingId(null);
      return reload();
    }
    setModeratingId(null);
  };

  const handleReject = async (productId) => {
    const reason = rejectReason.trim();
    if (!reason) return addToast("Escribí un motivo de rechazo.", "warning");
    if (moderatingId === productId) return;
    setModeratingId(productId);
    const ok = await confirm({
      title: "¿Rechazar producto?",
      message: `Motivo: "${reason}"`,
      confirmText: "Rechazar",
      variant: "danger",
    });
    if (!ok) {
      setModeratingId(null);
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: "rejected", rejected_reason: reason }
          : p,
      ),
    );
    const { error } = await supabase
      .from("products")
      .update({ status: "rejected", rejected_reason: reason })
      .eq("id", productId);
    if (error) {
      addToast("Error al rechazar: " + error.message, "error");
      setModeratingId(null);
      return reload();
    }
    setModeratingId(null);
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

  // ── Memos ──
  const visibleUsers = useMemo(
    () => users.filter((u) => u.role !== "superadmin"),
    [users],
  );
  const pendingProducts = useMemo(
    () => products.filter((p) => p.status === "pending"),
    [products],
  );

  const newUsers = useMemo(
    () => visibleUsers.filter((u) => isRecent(u.created_at)),
    [visibleUsers],
  );
  const newProducts = useMemo(
    () => products.filter((p) => isRecent(p.created_at)),
    [products],
  );
  const newReviews = useMemo(
    () => reviews.filter((r) => isRecent(r.created_at)),
    [reviews],
  );

  const productSearchLower = productSearch.toLowerCase();
  const searchedProducts = useMemo(
    () =>
      products.filter((p) => p.name.toLowerCase().includes(productSearchLower)),
    [products, productSearchLower],
  );
  const filteredProducts =
    statusFilter === "all"
      ? searchedProducts
      : searchedProducts.filter((p) => p.status === statusFilter);

  const totalProductPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  );
  const safeProductPage = Math.min(productPage, totalProductPages);
  const pageProducts = useMemo(
    () =>
      filteredProducts.slice(
        (safeProductPage - 1) * ITEMS_PER_PAGE,
        safeProductPage * ITEMS_PER_PAGE,
      ),
    [filteredProducts, safeProductPage],
  );

  const userSearchLower = userSearch.toLowerCase();
  const searchedUsers = useMemo(
    () =>
      visibleUsers.filter(
        (u) =>
          (u.first_name || "").toLowerCase().includes(userSearchLower) ||
          (u.email || "").toLowerCase().includes(userSearchLower),
      ),
    [visibleUsers, userSearchLower],
  );
  const verifiedUsers = useMemo(
    () => searchedUsers.filter((u) => u.is_verified),
    [searchedUsers],
  );
  const unverifiedUsers = useMemo(
    () => searchedUsers.filter((u) => !u.is_verified),
    [searchedUsers],
  );

  const categoryStats = useMemo(() => {
    const map = {};
    for (const p of products) {
      map[p.category] = (map[p.category] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const statusStats = useMemo(
    () => ({
      approved: products.filter((p) => p.status === "approved").length,
      pending: pendingProducts.length,
      rejected: products.filter((p) => p.status === "rejected").length,
      total: products.length,
    }),
    [products, pendingProducts],
  );

  const ratingDist = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      if (dist[r.rating] !== undefined) dist[r.rating]++;
    }
    return dist;
  }, [reviews]);

  const avgRating = useMemo(
    () =>
      reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0,
    [reviews],
  );

  const recentActivity = useMemo(() => {
    const events = [];
    for (const p of newProducts) {
      events.push({
        id: `p-${p.id}`,
        type: "producto",
        label: "Nuevo producto",
        name: p.name,
        seller: p.profiles?.company_name || p.profiles?.email || "—",
        date: p.created_at,
      });
    }
    for (const r of newReviews) {
      events.push({
        id: `r-${r.id}`,
        type: "review",
        label: "Nueva reseña",
        name: `"${r.comment?.slice(0, 60)}…"`,
        seller:
          r.seller?.company_name ||
          r.seller?.first_name ||
          r.seller?.last_name ||
          "—",
        date: r.created_at,
      });
    }
    for (const u of newUsers) {
      events.push({
        id: `u-${u.id}`,
        type: "usuario",
        label: "Nuevo usuario",
        name: u.first_name || u.email,
        seller: "",
        date: u.created_at,
      });
    }
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    return events;
  }, [newProducts, newReviews, newUsers]);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
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
            {t.key === "pendientes" && pendingProducts.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingProducts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════ Panel ════════════ */}
      {tab === "panel" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                Usuarios nuevos
              </p>
              <p className="text-3xl font-black text-gray-900">
                {newUsers.length}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                últimos {RECENT_DAYS} días
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                Productos nuevos
              </p>
              <p className="text-3xl font-black text-gray-900">
                {newProducts.length}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                últimos {RECENT_DAYS} días
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                Reseñas nuevas
              </p>
              <p className="text-3xl font-black text-gray-900">
                {newReviews.length}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                últimos {RECENT_DAYS} días
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase mb-1">
                Pendientes
              </p>
              <p className="text-3xl font-black text-amber-600">
                {pendingProducts.length}
              </p>
              <p className="text-[11px] text-amber-500 mt-0.5">por moderar</p>
            </div>
          </div>

          {/* Bandeja de actividad reciente */}
          {recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Actividad reciente
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {recentActivity.slice(0, 15).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50"
                  >
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        ev.type === "producto"
                          ? "bg-emerald-500"
                          : ev.type === "review"
                            ? "bg-amber-400"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="font-bold text-gray-900">
                        {ev.label}
                      </span>
                      {": "}
                      <span className="text-gray-600">{ev.name}</span>
                      {ev.seller && (
                        <span className="text-gray-400"> — {ev.seller}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {new Date(ev.date).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pendientes shortcut */}
          {pendingProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-800">
                  {pendingProducts.length} producto
                  {pendingProducts.length !== 1 ? "s" : ""} pendiente
                  {pendingProducts.length !== 1 ? "s" : ""} de moderación
                </p>
                <button
                  onClick={() => setTab("pendientes")}
                  className="text-sm font-bold text-amber-700 hover:text-amber-800 underline"
                >
                  Ir a moderar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ Pendientes ════════════ */}
      {tab === "pendientes" && (
        <section>
          <h2 className="text-lg font-black text-gray-900 mb-4">
            Moderación pendiente
            {pendingProducts.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingProducts.length}
              </span>
            )}
          </h2>
          {pendingProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">
              No hay productos pendientes de moderación.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {p.image && (
                        <ProtectedImage
                          src={p.image}
                          alt=""
                          className="w-14 h-14 shrink-0"
                          imgClassName="rounded-xl object-cover border border-gray-100"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {p.name}
                        </p>
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
                        disabled={moderatingId === p.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 sm:py-2 px-5 sm:px-4 rounded-xl disabled:opacity-50"
                      >
                        {moderatingId === p.id ? "Aprobando..." : "Aprobar"}
                      </button>
                      <button
                        onClick={() => openReject(p.id)}
                        disabled={moderatingId === p.id}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 sm:py-2 px-5 sm:px-4 rounded-xl disabled:opacity-50"
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !moderatingId)
                            handleReject(p.id);
                        }}
                        maxLength={500}
                        disabled={moderatingId === p.id}
                        className="flex-1 px-4 py-3 sm:py-2 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-500 min-h-[44px] sm:min-h-0 disabled:opacity-50"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={moderatingId === p.id}
                        className="bg-red-600 text-white font-bold text-xs py-3 sm:py-2 px-5 sm:px-4 rounded-xl disabled:opacity-50"
                      >
                        {moderatingId === p.id ? "Rechazando..." : "Confirmar"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ════════════ Usuarios ════════════ */}
      {tab === "usuarios" && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-black text-gray-900">Usuarios</h2>
            <div className="relative w-full sm:w-64">
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
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuarios..."
                aria-label="Buscar usuarios"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:border-emerald-500"
              />
            </div>
          </div>

          {searchedUsers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">
              No se encontraron usuarios.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Verificados */}
              {verifiedUsers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Verificados ({verifiedUsers.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {verifiedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <ProtectedImage
                            src={u.avatar_url || "https://placehold.co/40"}
                            alt=""
                            className="w-10 h-10"
                            imgClassName="rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {u.first_name || u.email}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`font-bold uppercase ${u.role === "admin" ? "text-purple-600" : "text-emerald-600"}`}
                          >
                            {u.role === "admin" ? "Administrador" : "Vendedor"}
                          </span>
                          <span className="text-emerald-600 font-bold">
                            ✓ Verificado
                          </span>
                        </div>
                        {u.role !== "admin" && (
                          <button
                            onClick={() =>
                              handleToggleVerify(u.id, u.is_verified)
                            }
                            className="mt-2 text-xs font-bold text-gray-400 hover:text-red-500"
                          >
                            Quitar verificación
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No verificados */}
              {unverifiedUsers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    Sin verificar ({unverifiedUsers.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {unverifiedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <ProtectedImage
                            src={u.avatar_url || "https://placehold.co/40"}
                            alt=""
                            className="w-10 h-10"
                            imgClassName="rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {u.first_name || u.email}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold uppercase text-emerald-600">
                            Vendedor
                          </span>
                          <span className="text-gray-400">No verificado</span>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleVerify(u.id, u.is_verified)
                          }
                          className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          Verificar usuario
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ════════════ Productos ════════════ */}
      {tab === "productos" && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-black text-gray-900">Productos</h2>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-56">
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
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  placeholder="Buscar productos..."
                  aria-label="Buscar productos"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-1.5">
                {["all", "approved", "rejected"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setProductPage(1);
                    }}
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
                        : "Rechazados"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">
              No hay productos con ese filtro.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="text-left font-bold text-gray-500 uppercase text-[11px] tracking-wider px-4 py-3">
                        Imagen
                      </th>
                      <th className="text-left font-bold text-gray-500 uppercase text-[11px] tracking-wider px-4 py-3">
                        Nombre
                      </th>
                      <th className="text-left font-bold text-gray-500 uppercase text-[11px] tracking-wider px-4 py-3">
                        Vendedor
                      </th>
                      <th className="text-left font-bold text-gray-500 uppercase text-[11px] tracking-wider px-4 py-3">
                        Precio
                      </th>
                      <th className="text-left font-bold text-gray-500 uppercase text-[11px] tracking-wider px-4 py-3">
                        Stock
                      </th>
                      <th className="text-left font-bold text-gray-500 uppercase text-[11px] tracking-wider px-4 py-3">
                        Estado
                      </th>
                      <th className="text-right font-bold text-gray-500 uppercase text-[11px] tracking-wider px-4 py-3">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pageProducts.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {p.image ? (
                            <ProtectedImage
                              src={p.image}
                              alt=""
                              className="w-10 h-10"
                              imgClassName="rounded-lg object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-gray-300"
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
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 max-w-[200px] truncate">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {p.profiles?.company_name || p.profiles?.email || "—"}
                        </td>
                        <td className="px-4 py-3 font-black text-gray-800">
                          ${Number(p.price).toLocaleString("es-AR")}
                        </td>
                        <td className="px-4 py-3">
                          {p.stock != null ? (
                            <span
                              className={`font-bold text-xs ${Number(p.stock) <= 5 ? "text-red-600" : "text-emerald-600"}`}
                            >
                              {p.stock} uds.
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={p.status}
                            reason={p.rejected_reason}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === "approved" && (
                              <Link
                                href={`/producto/${p.slug || p.id}`}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                title="Ver en tienda"
                              >
                                Ver
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
                                  title: "¿Eliminar producto?",
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
                                  addToast(
                                    "Error al eliminar: " + error.message,
                                    "error",
                                  );
                              }}
                              className="text-xs font-bold text-red-500 hover:text-red-700"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden grid gap-3">
                {pageProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {p.image ? (
                        <ProtectedImage
                          src={p.image}
                          alt=""
                          className="w-14 h-14 shrink-0"
                          imgClassName="rounded-xl object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <svg
                            className="w-6 h-6 text-gray-300"
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
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {p.profiles?.company_name || "—"}
                        </p>
                        <p className="text-emerald-600 font-black text-sm">
                          ${Number(p.price).toLocaleString("es-AR")}
                        </p>
                      </div>
                      <StatusBadge
                        status={p.status}
                        reason={p.rejected_reason}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex gap-2">
                        {p.status === "approved" && (
                          <Link
                            href={`/producto/${p.slug || p.id}`}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            Ver
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
                              title: "¿Eliminar producto?",
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
                              addToast(
                                "Error al eliminar: " + error.message,
                                "error",
                              );
                          }}
                          className="text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                      {p.stock != null && (
                        <span
                          className={`text-xs font-bold ${Number(p.stock) <= 5 ? "text-red-600" : "text-emerald-600"}`}
                        >
                          {p.stock} uds.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalProductPages > 1 && (
                <Pagination
                  currentPage={safeProductPage}
                  totalPages={totalProductPages}
                  onPageChange={setProductPage}
                />
              )}
            </>
          )}
        </section>
      )}

      {/* ════════════ Estadísticas ════════════ */}
      {tab === "estadisticas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Total",
                value: statusStats.total,
                color: "bg-gray-900",
              },
              {
                label: "Aprobados",
                value: statusStats.approved,
                color: "bg-emerald-600",
              },
              {
                label: "Pendientes",
                value: statusStats.pending,
                color: "bg-amber-500",
              },
              {
                label: "Rechazados",
                value: statusStats.rejected,
                color: "bg-red-500",
              },
              {
                label: "Usuarios",
                value: visibleUsers.length,
                color: "bg-blue-600",
              },
              {
                label: "Reseñas",
                value: reviews.length,
                sub: avgRating ? `★ ${avgRating.toFixed(1)}` : "",
                color: "bg-purple-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
              >
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  {s.label}
                </p>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                {s.sub && (
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* Status doughnut */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Estado de productos
              </h3>
              {statusStats.total === 0 ? (
                <p className="text-gray-400 text-sm">Sin productos.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      label: "Aprobados",
                      value: statusStats.approved,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Pendientes",
                      value: statusStats.pending,
                      color: "bg-amber-400",
                    },
                    {
                      label: "Rechazados",
                      value: statusStats.rejected,
                      color: "bg-red-400",
                    },
                  ].map((s) => {
                    const pct = (s.value / statusStats.total) * 100;
                    return (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-bold text-gray-700">
                            {s.label}
                          </span>
                          <span className="text-gray-500">
                            {s.value} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className={`${s.color} h-3 rounded-full transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Productos por categoría
              </h3>
              {categoryStats.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin productos.</p>
              ) : (
                <div className="space-y-3 max-h-[240px] overflow-y-auto">
                  {categoryStats.map(([cat, count]) => {
                    const pct = (count / statusStats.total) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-bold text-gray-700 truncate">
                            {cat}
                          </span>
                          <span className="text-gray-500 shrink-0 ml-2">
                            {count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Rating distribution */}
          {reviews.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Distribución de calificaciones
              </h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDist[star];
                  const pct = (count / reviews.length) * 100;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-6 font-bold text-gray-600 text-right">
                        {star}★
                      </span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              star >= 4
                                ? "bg-emerald-500"
                                : star >= 3
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-gray-500">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ Reportes ════════════ */}
      {tab === "reportes" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Sin imagen de producto",
                value: products.filter((p) => !p.image).length,
                max: products.length,
                color: "bg-amber-500",
                bg: "bg-amber-50 border-amber-100",
              },
              {
                label: "Stock bajo (≤ 5)",
                value: products.filter(
                  (p) => p.stock != null && Number(p.stock) <= 5,
                ).length,
                max: products.filter((p) => p.stock != null).length,
                color: "bg-red-500",
                bg: "bg-red-50 border-red-100",
              },
              {
                label: "Usuarios sin verificar",
                value: visibleUsers.filter((u) => !u.is_verified).length,
                max: visibleUsers.length,
                color: "bg-blue-500",
                bg: "bg-blue-50 border-blue-100",
              },
              {
                label: "Productos rechazados",
                value: statusStats.rejected,
                max: products.length,
                color: "bg-gray-500",
                bg: "bg-gray-50 border-gray-100",
              },
            ].map((r) => (
              <div
                key={r.label}
                className={`${r.bg} p-4 rounded-2xl border shadow-sm`}
              >
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  {r.label}
                </p>
                <p className="text-3xl font-black text-gray-900">{r.value}</p>
                {r.max > 0 && (
                  <div className="mt-2 w-full bg-white/60 rounded-full h-2">
                    <div
                      className={`${r.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(r.value / r.max) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Low stock detail */}
          {products.filter((p) => p.stock != null && Number(p.stock) <= 5)
            .length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Productos con stock bajo
              </h3>
              <div className="space-y-2">
                {products
                  .filter((p) => p.stock != null && Number(p.stock) <= 5)
                  .slice(0, 10)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="font-bold text-gray-900 truncate flex-1">
                        {p.name}
                      </span>
                      <div className="w-24">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${Number(p.stock) === 0 ? "bg-red-500" : "bg-amber-400"}`}
                            style={{
                              width: `${Math.min((Number(p.stock) / 5) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className={`font-bold text-xs w-16 text-right ${Number(p.stock) === 0 ? "text-red-600" : "text-amber-600"}`}
                      >
                        {p.stock} uds.
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── Extra tabs (superadmin) ───── */}
      {extraTabs.map(
        (t) =>
          tab === t.key && (
            <div key={t.key} className="space-y-6">
              {t.content}
            </div>
          ),
      )}

      <ProductEditModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaved={reload}
      />
    </motion.div>
  );
}
