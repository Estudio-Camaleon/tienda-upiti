"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "../../../lib/schemas";
import {
  onlyDigits,
  concatParts,
  splitWhatsAppNumber,
} from "../../../lib/phone";
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
  { code: "86", name: "China" },
  { code: "81", name: "Japón" },
  { code: "82", name: "Corea del Sur" },
  { code: "91", name: "India" },
  { code: "61", name: "Australia" },
  { code: "64", name: "Nueva Zelanda" },
  { code: "27", name: "Sudáfrica" },
  { code: "20", name: "Egipto" },
  { code: "212", name: "Marruecos" },
  { code: "234", name: "Nigeria" },
  { code: "254", name: "Kenia" },
  { code: "233", name: "Ghana" },
  { code: "221", name: "Senegal" },
  { code: "216", name: "Túnez" },
  { code: "213", name: "Argelia" },
  { code: "972", name: "Israel" },
  { code: "90", name: "Turquía" },
  { code: "7", name: "Rusia" },
  { code: "380", name: "Ucrania" },
  { code: "48", name: "Polonia" },
  { code: "40", name: "Rumania" },
  { code: "36", name: "Hungría" },
  { code: "30", name: "Grecia" },
  { code: "31", name: "Países Bajos" },
  { code: "32", name: "Bélgica" },
  { code: "45", name: "Dinamarca" },
  { code: "46", name: "Suecia" },
  { code: "47", name: "Noruega" },
  { code: "358", name: "Finlandia" },
  { code: "354", name: "Islandia" },
  { code: "41", name: "Suiza" },
  { code: "43", name: "Austria" },
  { code: "420", name: "República Checa" },
  { code: "421", name: "Eslovaquia" },
  { code: "386", name: "Eslovenia" },
  { code: "385", name: "Croacia" },
  { code: "381", name: "Serbia" },
  { code: "359", name: "Bulgaria" },
  { code: "60", name: "Malasia" },
  { code: "66", name: "Tailandia" },
  { code: "84", name: "Vietnam" },
  { code: "63", name: "Filipinas" },
  { code: "62", name: "Indonesia" },
  { code: "65", name: "Singapur" },
  { code: "92", name: "Pakistán" },
  { code: "880", name: "Bangladesh" },
  { code: "94", name: "Sri Lanka" },
  { code: "977", name: "Nepal" },
  { code: "966", name: "Arabia Saudita" },
  { code: "971", name: "Emiratos Árabes" },
  { code: "974", name: "Qatar" },
  { code: "968", name: "Omán" },
  { code: "965", name: "Kuwait" },
  { code: "973", name: "Baréin" },
  { code: "962", name: "Jordania" },
  { code: "961", name: "Líbano" },
];

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-10 w-48 bg-gray-200 rounded-lg mb-8" />
      <div className="bg-white p-8 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex items-center gap-6 mb-4">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded-xl" />
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={i >= 5 ? "md:col-span-2" : ""}>
            <div className="h-4 w-24 bg-gray-200 rounded mb-1.5" />
            <div className="h-12 w-full bg-gray-100 rounded-xl" />
          </div>
        ))}
        <div className="md:col-span-2 mt-4">
          <div className="h-14 w-full bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function EditProfile() {
  const { addToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState("");
  const [niches, setNiches] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [currentBanner, setCurrentBanner] = useState("");
  const [newNicheInput, setNewNicheInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(profileSchema) });

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
        // Normalize stored number to digits-only before attempting to split
        const raw = data.whatsapp_number || "";
        const num = String(raw).replace(/\D/g, "");
        // Try to split into region (1-4), area (2-4), local (6-8)
        const match = num.match(/^(\d{1,4})(\d{2,4})(\d{6,8})$/);
        // If the profile already contains separated parts use them, otherwise
        // fall back to splitting the concatenated whatsapp_number
        const parts =
          data.whatsapp_region ||
          data.whatsapp_area ||
          data.whatsapp_number_local
            ? {
                whatsapp_region: data.whatsapp_region || "",
                whatsapp_area: data.whatsapp_area || "",
                whatsapp_number_local: data.whatsapp_number_local || "",
              }
            : {
                whatsapp_region: match?.[1] || num.slice(0, 2) || "",
                whatsapp_area: match?.[2] || num.slice(2, 5) || "",
                whatsapp_number_local: match?.[3] || num.slice(5) || "",
              };

        const parsedNiches = data.niche
          ? data.niche
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        let parsedLinks = [];
        if (data.social_links) {
          try {
            const parsed = JSON.parse(data.social_links);
            if (Array.isArray(parsed)) parsedLinks = parsed;
          } catch {
            parsedLinks = data.social_links.trim()
              ? [{ label: "Red Social", url: data.social_links }]
              : [];
          }
        }
        setNiches(parsedNiches);
        setSocialLinks(parsedLinks);
        setCurrentBanner(data.banner_url || "");
        reset({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          company_name: data.company_name || "",
          delivery_option: data.delivery_option || "",
          whatsapp_region: parts.whatsapp_region,
          whatsapp_area: parts.whatsapp_area,
          whatsapp_number_local: parts.whatsapp_number_local,
        });
        setCurrentAvatar(data.avatar_url);
      } else {
        try {
          const pending = localStorage.getItem("pending_profile");
          if (pending) {
            const pd = JSON.parse(pending);
            const parsedNiches = pd.niche
              ? pd.niche
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];
            setNiches(parsedNiches);
            reset({
              first_name: pd.first_name || "",
              last_name: pd.last_name || "",
              company_name: pd.company_name || "",
              delivery_option: pd.delivery_option || "",
              whatsapp_region: pd.whatsapp_region || "",
              whatsapp_area: pd.whatsapp_area || "",
              whatsapp_number_local: pd.whatsapp_number_local || "",
            });
            localStorage.removeItem("pending_profile");
            addToast(
              "Recuperamos los datos que completaste al registrarte.",
              "info",
            );
          }
        } catch (e) {}
      }
      setLoading(false);
    }
    loadProfile();
  }, [addToast, router, reset]);

  const uploadFile = async (file, bucket, folder) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${folder}/${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const onSubmitProfile = async (formData) => {
    setSaving(true);
    let newAvatarUrl = currentAvatar;
    let newBannerUrl = currentBanner;

    try {
      if (avatarFile) {
        newAvatarUrl = await uploadFile(avatarFile, "avatars", "avatar");
      }

      if (bannerFile) {
        newBannerUrl = await uploadFile(bannerFile, "banners", "banner");
      }
    } catch (err) {
      addToast("Error al subir imagen: " + err.message, "error");
      setSaving(false);
      return;
    }

    const whatsapp_number = concatParts(
      formData.whatsapp_region,
      formData.whatsapp_area,
      formData.whatsapp_number_local,
    );
    const whatsapp_region = onlyDigits(formData.whatsapp_region) || null;
    const whatsapp_area = onlyDigits(formData.whatsapp_area) || null;
    const whatsapp_number_local =
      onlyDigits(formData.whatsapp_number_local) || null;

    const nicheStr = niches.length > 0 ? niches.join(",") : null;
    const socialLinksStr =
      socialLinks.length > 0 ? JSON.stringify(socialLinks) : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        delivery_option: formData.delivery_option || null,
        niche: nicheStr,
        social_links: socialLinksStr,
        whatsapp_number,
        whatsapp_region,
        whatsapp_area,
        whatsapp_number_local,
        avatar_url: newAvatarUrl,
        banner_url: newBannerUrl || null,
      })
      .eq("id", user?.id);

    if (error) addToast("Error al guardar: " + error.message, "error");
    else {
      addToast("Perfil actualizado con éxito.", "success");
      setCurrentAvatar(newAvatarUrl);
      setCurrentBanner(newBannerUrl);
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
        "Tu cuenta ha sido eliminada. Esperamos verte pronto.",
        "success",
      );
      router.push("/");
    }
  };

  if (loading) return <LoadingSkeleton />;

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${
      errors[field]
        ? "border-red-400 focus:ring-red-500/20"
        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
    }`;

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
          Volver al Panel
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
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Nombre del emprendimiento{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            {...register("company_name")}
            placeholder="Ej: Dulces Artesanales"
            maxLength={100}
            className={inputClass("company_name")}
          />
          {errors.company_name && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.company_name.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Nombre
          </label>
          <input
            type="text"
            {...register("first_name")}
            placeholder="Tu nombre"
            maxLength={50}
            className={inputClass("first_name")}
          />
          {errors.first_name && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.first_name.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Apellido
          </label>
          <input
            type="text"
            {...register("last_name")}
            placeholder="Tu apellido"
            maxLength={50}
            className={inputClass("last_name")}
          />
          {errors.last_name && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.last_name.message}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            WhatsApp
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <select
              {...register("whatsapp_region")}
              className={`w-full px-4 py-3 rounded-xl border outline-none text-sm bg-white transition-shadow focus:ring-2 col-span-1 ${errors.whatsapp_region ? "border-red-400 focus:ring-red-500/20" : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"}`}
            >
              <option value="">+54</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  +{c.code} — {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              {...register("whatsapp_area")}
              placeholder="381"
              className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${errors.whatsapp_area ? "border-red-400 focus:ring-red-500/20" : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"}`}
            />
            <input
              type="text"
              {...register("whatsapp_number_local")}
              placeholder="9999999"
              className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 col-span-2 sm:col-span-1 ${errors.whatsapp_number_local ? "border-red-400 focus:ring-red-500/20" : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"}`}
            />
          </div>
          {(errors.whatsapp_region ||
            errors.whatsapp_area ||
            errors.whatsapp_number_local) && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              Completá todos los campos de WhatsApp.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Nichos{" "}
            <span className="text-gray-400 font-normal">(elegí uno o más)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {niches.map((n, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full"
              >
                {n}
                <button
                  type="button"
                  onClick={() =>
                    setNiches((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="hover:text-red-500 transition-colors"
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
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNicheInput}
              onChange={(e) => setNewNicheInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = newNicheInput.trim();
                  if (val && !niches.includes(val)) {
                    setNiches((prev) => [...prev, val]);
                  }
                  setNewNicheInput("");
                }
              }}
              placeholder="Escribí un nicho y presioná Enter"
              maxLength={100}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const val = newNicheInput.trim();
                if (val && !niches.includes(val)) {
                  setNiches((prev) => [...prev, val]);
                }
                setNewNicheInput("");
              }}
              className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tipo de entrega
          </label>
          <p className="text-xs text-gray-500 mb-3">
            ¿Cómo entregás tus productos?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-colors cursor-pointer has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-200 border-gray-200 hover:border-emerald-200">
              <input
                type="radio"
                value="delivery"
                {...register("delivery_option")}
                className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0"
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  Envío a domicilio
                </p>
                <p className="text-xs text-gray-400">
                  Llevo mis productos hasta la puerta del cliente
                </p>
              </div>
            </label>
            <label className="flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-colors cursor-pointer has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-200 border-gray-200 hover:border-emerald-200">
              <input
                type="radio"
                value="pickup"
                {...register("delivery_option")}
                className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0"
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  Punto de encuentro
                </p>
                <p className="text-xs text-gray-400">
                  Coordinamos un lugar para entregar en persona
                </p>
              </div>
            </label>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Redes sociales y sitio web
          </label>
          <div className="space-y-2">
            {socialLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select
                  value={link.label}
                  onChange={(e) =>
                    setSocialLinks((prev) =>
                      prev.map((l, j) =>
                        j === i ? { ...l, label: e.target.value } : l,
                      ),
                    )
                  }
                  className="w-[140px] shrink-0 px-3 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white"
                >
                  {[
                    "Instagram",
                    "Facebook",
                    "TikTok",
                    "YouTube",
                    "Twitter / X",
                    "LinkedIn",
                    "Pinterest",
                    "Sitio Web",
                    "Otro",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) =>
                    setSocialLinks((prev) =>
                      prev.map((l, j) =>
                        j === i ? { ...l, url: e.target.value } : l,
                      ),
                    )
                  }
                  placeholder="https://..."
                  maxLength={500}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSocialLinks((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setSocialLinks((prev) => [
                ...prev,
                { label: "Instagram", url: "" },
              ])
            }
            className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            + Agregar red social
          </button>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Banner del perfil{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          {currentBanner && (
            <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200">
              <img
                src={currentBanner}
                alt="Banner actual"
                className="w-full h-32 sm:h-40 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setCurrentBanner("");
                  setBannerFile(null);
                }}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
              >
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          {bannerFile && (
            <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200">
              <img
                src={URL.createObjectURL(bannerFile)}
                alt="Nuevo banner"
                className="w-full h-32 sm:h-40 object-cover"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setBannerFile(file);
                setCurrentBanner("");
              }
            }}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            PNG o JPG. Recomendado: 1200x400 px.
          </p>
        </div>

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
                ¿Te vas tan pronto?
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                Esta acción no se puede deshacer. ¿Podrías contarnos por qué
                decidiste eliminar tu cuenta?
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
                        placeholder="Contanos brevemente tu motivo..."
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
