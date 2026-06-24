"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../context/ToastContext";
import { useConfirm } from "../../../context/ConfirmContext";
import ProtectedImage from "../../../components/ProtectedImage";
import AdminDashboard from "./AdminDashboard";

export default function SuperAdminDashboard() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [admins, setAdmins] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setAdmins(data.filter((u) => u.role === "admin"));
      setSellers(data.filter((u) => u.role === "seller"));
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (!mounted) return;
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRoleChange = async (userId, newRole, userName) => {
    const label = newRole === "admin" ? "Administrador" : "Vendedor";
    const ok = await confirm({
      title: `¿Cambiar rol a ${label}?`,
      message: `"${userName}" pasará a ser ${label.toLowerCase()}.`,
      confirmText: "Confirmar",
      variant: "warning",
    });
    if (!ok) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      addToast("Error al cambiar rol: " + error.message, "error");
      return;
    }

    addToast(`"${userName}" ahora es ${label.toLowerCase()}.`, "success");
    load();
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  const extraTabs = [
    {
      key: "administradores",
      label: "Administradores",
      content: (
        <div className="space-y-6">
          {admins.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay administradores.</p>
          ) : (
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-4">
                Administradores actuales ({admins.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {admins.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <ProtectedImage
                        src={a.avatar_url || "https://placehold.co/40"}
                        alt=""
                        className="w-10 h-10"
                        imgClassName="rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {a.first_name || a.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {a.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="font-bold uppercase text-purple-600">
                        Administrador
                      </span>
                      {a.is_verified && (
                        <span className="text-emerald-600 font-bold">
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleRoleChange(
                          a.id,
                          "seller",
                          a.first_name || a.email,
                        )
                      }
                      className="text-xs font-bold text-red-500 hover:text-red-700"
                    >
                      Degradar a vendedor
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sellers.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-4">
                Ascender vendedor a administrador
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sellers.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <ProtectedImage
                        src={s.avatar_url || "https://placehold.co/40"}
                        alt=""
                        className="w-10 h-10"
                        imgClassName="rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {s.first_name || s.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {s.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleRoleChange(s.id, "admin", s.first_name || s.email)
                      }
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Ascender a administrador
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ),
    },
  ];

  return <AdminDashboard extraTabs={extraTabs} />;
}
