"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { loginSchema } from "../../lib/schemas";

function sanitize(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") obj[key] = obj[key].trim();
  }
}

export default function Login() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    sanitize(data);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.email.trim())
        .maybeSingle();

      if (!existing) {
        setError("Este correo no está registrado. ¿Querés crear una cuenta?");
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        setError("Aún no confirmaste tu correo. Revisá tu bandeja de entrada.");
      } else {
        setError("Contraseña incorrecta. Intentá de nuevo.");
      }

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
          <div>
            <input
              {...register("email")}
              placeholder="Correo Electrónico"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <input
              type="password"
              {...register("password")}
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 ml-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? (
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
                Ingresando...
              </span>
            ) : (
              "Ingresar"
            )}
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
