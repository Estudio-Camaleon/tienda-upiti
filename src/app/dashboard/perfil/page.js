"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../../context/ToastContext";

const countries = [
  { code: "54", name: "Argentina" },
  { code: "591", name: "Bolivia" },
  { code: "55", name: "Brasil" },
  { code: "56", name: "Chile" },
  { code: "57", name: "Colombia" },
  { code: "506", name: "Costa Rica" },
  { code: "53", name: "Cuba" },
  { code: "1809", name: "República Dominicana" },
  { code: "593", name: "Ecuador" },
  { code: "503", name: "El Salvador" },
  { code: "502", name: "Guatemala" },
  { code: "509", name: "Haití" },
  { code: "504", name: "Honduras" },
  { code: "52", name: "México" },
  { code: "505", name: "Nicaragua" },
  { code: "507", name: "Panamá" },
  { code: "595", name: "Paraguay" },
  { code: "51", name: "Perú" },
  { code: "1", name: "Estados Unidos / Canadá" },
  { code: "598", name: "Uruguay" },
  { code: "58", name: "Venezuela" },
  { code: "34", name: "España" },
  { code: "39", name: "Italia" },
  { code: "33", name: "Francia" },
  { code: "49", name: "Alemania" },
  { code: "44", name: "Reino Unido" },
  { code: "351", name: "Portugal" },
];

export default function EditProfile() {
  const { addToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState("");

  const { register, handleSubmit, reset } = useForm();

  const {
    register: registerDelete,
    handleSubmit: handleSubmitDelete,
    reset: resetDelete,
  } = useForm();

  const [selectedReason, setSelectedReason] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      setUser(session.user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) {
        const num = data.whatsapp_number || "";
        reset({
          ...data,
          whatsapp_region: num.slice(0, 2) || "",
          whatsapp_area: num.slice(2, 5) || "",
          whatsapp_number_local: num.slice(5) || "",
        });
        setCurrentAvatar(data.avatar_url);
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, reset]);

  const onSubmitProfile = async (formData) => {
    setSaving(true);
    let newAvatarUrl = currentAvatar;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        newAvatarUrl = data.publicUrl;
      }
    }

    const whatsapp_number = `${formData.whatsapp_region}${formData.whatsapp_area}${formData.whatsapp_number_local}`;

    delete formData.whatsapp_region;
    delete formData.whatsapp_area;
    delete formData.whatsapp_number_local;

    const { error } = await supabase
      .from("profiles")
      .update({
        ...formData,
        whatsapp_number,
        avatar_url: newAvatarUrl,
      })
      .eq("id", user?.id);

    if (error) addToast("Error al guardar: " + error.message, "error");
    else {
      addToast("Perfil actualizado con éxito.", "success");
      setCurrentAvatar(newAvatarUrl);
    }
    setSaving(false);
  };

  const handleDeleteAccount = async (data) => {
    if (!data.delete_reason)
      return addToast("Por favor, selecciona un motivo.", "warning");
    setDeleting(true);

    let finalReason = data.delete_reason;
    if (finalReason === "Otro motivo" && data.other_description) {
      finalReason = `Otro motivo: ${data.other_description}`;
    }

    await supabase.from("deletion_reasons").insert([{ reason: finalReason }]);
    const { error } = await supabase.rpc("delete_my_account");

    if (error) {
      addToast("Hubo un error al borrar la cuenta: " + error.message, "error");
      setDeleting(false);
    } else {
      await supabase.auth.signOut();
      addToast(
        "Tu cuenta ha sido eliminada. ¡Esperamos verte pronto!",
        "success",
      );
      router.push("/");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
      </div>
    );

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-black text-gray-900">Mi Perfil</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors"
        >
          ← Volver al Panel
        </button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmitProfile)}
        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2 flex items-center gap-6 mb-4">
          <img
            src={currentAvatar || "https://placehold.co/150"}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border border-gray-200"
          />
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Cambiar Foto de Perfil
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files[0])}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>
        </div>

        {}
        <input
          type="text"
          {...register("company_name", { required: true })}
          placeholder="Nombre del Local/Empresa"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 md:col-span-2"
        />
        <input
          type="text"
          {...register("first_name", { required: true })}
          placeholder="Nombre"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          {...register("last_name", { required: true })}
          placeholder="Apellido"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            WhatsApp
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <select
              {...register("whatsapp_region", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm bg-white col-span-1"
            >
              <option value="">+54</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  +{c.code}
                </option>
              ))}
            </select>
            <input
              type="text"
              {...register("whatsapp_area", { required: true })}
              placeholder="381"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
            />
            <input
              type="text"
              {...register("whatsapp_number_local", { required: true })}
              placeholder="9999999"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm col-span-2 sm:col-span-1"
            />
          </div>
        </div>
        <input
          type="text"
          {...register("niche", { required: true })}
          placeholder="Nicho (ej. Ropa)"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          {...register("province", { required: true })}
          placeholder="Provincia"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          {...register("city", { required: true })}
          placeholder="Ciudad"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          {...register("address")}
          placeholder="Dirección"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 md:col-span-2"
        />
        <input
          type="text"
          {...register("social_links")}
          placeholder="Links de Redes (Instagram, Web)"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 md:col-span-2"
        />

        <div className="md:col-span-2 mt-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-sm disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </motion.button>
        </div>
      </form>

      {}
      <div className="mt-12 bg-red-50 p-6 rounded-3xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-red-800 font-bold text-lg">Zona de Peligro</h4>
          <p className="text-red-600 text-sm">
            Eliminar tu cuenta borrará permanentemente tu perfil y todos tus
            productos.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetDelete();
            setShowDeleteModal(true);
          }}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm whitespace-nowrap"
        >
          Eliminar mi cuenta
        </motion.button>
      </div>

      {}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">
                ¿Te vas tan pronto? 😢
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                Esta acción no se puede deshacer. ¿Podrías contarnos por qué
                decides eliminar tu cuenta?
              </p>

              <form onSubmit={handleSubmitDelete(handleDeleteAccount)}>
                <div className="space-y-3 mb-4">
                  {[
                    "No logré realizar ventas",
                    "La plataforma es difícil de usar",
                    "Cerré mi emprendimiento",
                    "Prefiero usar otra plataforma",
                    "Otro motivo",
                  ].map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        value={reason}
                        {...registerDelete("delete_reason", {
                          required: true,
                          onChange: (e) => setSelectedReason(e.target.value),
                        })}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {reason}
                      </span>
                    </label>
                  ))}
                </div>

                {}
                <AnimatePresence>
                  {selectedReason === "Otro motivo" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <textarea
                        {...registerDelete("other_description", {
                          required: true,
                        })}
                        placeholder="Cuéntanos brevemente tu motivo..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm h-24 resize-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 mt-2"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl disabled:opacity-50"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                  >
                    {deleting ? "Borrando..." : "Confirmar"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
