"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";

export default function Login() {
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("Credenciales incorrectas.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
      >
        <h2 className="text-3xl font-black text-center text-gray-900 mb-6">
          Iniciar Sesión
        </h2>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register("email", { required: true })}
            placeholder="Correo Electrónico"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            {...register("password", { required: true })}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-emerald-600 font-bold hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
