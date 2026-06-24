"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import ProtectedImage from "../../components/ProtectedImage";
import AdminDashboard from "./components/AdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import SellerDashboard from "./components/SellerDashboard";

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
      <div className="mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          {profile?.role === "seller" && (
            <ProtectedImage
              src={profile?.avatar_url || "https://placehold.co/48"}
              alt=""
              className="w-12 h-12"
              imgClassName="rounded-full object-cover border border-gray-100"
            />
          )}
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Bienvenido,{" "}
              <span className="text-emerald-600">
                {profile?.role === "superadmin"
                  ? "Superadministrador"
                  : profile?.role === "admin"
                    ? "Administrador"
                    : profile?.first_name ||
                      profile?.company_name ||
                      "Vendedor"}
              </span>
            </h1>
            {profile?.company_name && (
              <p className="text-sm text-gray-500">{profile.company_name}</p>
            )}
          </div>
        </div>
        {profile?.role === "seller" && (
          <div className="mt-6 max-w-3xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-emerald-50 to-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                      Tu catálogo público
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      Este es el enlace que tenés que compartir para que tus
                      clientes vean tus productos.
                    </p>
                    <div className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 ring-1 ring-gray-100">
                      <p className="truncate">
                        /vendedor/{profile?.slug || user.id}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/vendedor/${profile?.slug || user.id}`,
                      );
                      addToast(
                        "Enlace del catálogo público copiado.",
                        "success",
                      );
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-500"
                  >
                    Copiar catálogo
                  </button>
                  <Link
                    href="/dashboard/perfil"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-50"
                  >
                    Editar
                  </Link>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-800 ring-1 ring-amber-100">
                Aviso: si cambiás el nombre del negocio o tu nombre, el enlace
                puede actualizarse. Compartí el nuevo enlace después de guardar
                esos cambios.
              </p>
            </div>
          </div>
        )}
      </div>

      {profile?.role === "superadmin" ? (
        <SuperAdminDashboard />
      ) : profile?.role === "admin" ? (
        <AdminDashboard />
      ) : (
        <SellerDashboard user={user} profile={profile} />
      )}
    </motion.main>
  );
}
