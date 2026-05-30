"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";

export default function Register() {
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    // 1. Crear el usuario en Auth
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Subir avatar si existe
    let avatarUrl = null;
    if (data.avatar && data.avatar[0]) {
      const file = data.avatar[0];
      const fileName = `${auth.user.id}/${new Date().getTime()}`;
      await supabase.storage.from("avatars").upload(fileName, file);
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      avatarUrl = urlData.publicUrl;
    }

    // 3. Actualizar perfil
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        province: data.province,
        city: data.city,
        address: data.address,
        whatsapp_number: data.whatsapp_number,
        birthdate: data.birthdate,
        niche: data.niche,
        social_links: data.social_links,
        avatar_url: avatarUrl,
      })
      .eq("id", auth.user.id);

    if (profileError) setError(profileError.message);
    else router.push("/dashboard");

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <h2 className="text-3xl font-black text-center text-gray-900 mb-2">
          Únete como Vendedor
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Crea tu tienda y sube tus productos hoy mismo.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            {...register("email", { required: true })}
            placeholder="Correo Electrónico"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            {...register("password", { required: true })}
            placeholder="Contraseña Segura"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-700">
              Foto de Perfil
            </label>
            <input
              type="file"
              {...register("avatar")}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
            />
          </div>

          <input
            {...register("first_name")}
            placeholder="Nombre"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            {...register("last_name")}
            placeholder="Apellido"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            {...register("company_name")}
            placeholder="Nombre de Emprendimiento"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            type="date"
            {...register("birthdate")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-gray-500"
          />

          <input
            {...register("whatsapp_number")}
            placeholder="WhatsApp (Ej: 54911234567)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            {...register("province")}
            placeholder="Provincia"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            {...register("city")}
            placeholder="Ciudad"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            {...register("address")}
            placeholder="Domicilio"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 md:col-span-2"
          />
          <input
            {...register("niche")}
            placeholder="Nicho"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            {...register("social_links")}
            placeholder="Link Instagram/Web"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="md:col-span-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all"
          >
            {loading ? "Creando cuenta..." : "Registrarme y Vender"}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
