"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { registerSchema } from "../../lib/schemas";
import { onlyDigits, concatParts } from "../../lib/phone";
import { generateBaseSlug, generateUniqueSlug } from "../../lib/slug";

function sanitize(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") obj[key] = obj[key].trim();
  }
}

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

function PasswordStrength({ password }) {
  const checks = useMemo(() => {
    return [
      { label: "8 caracteres o más", ok: password?.length >= 8 },
      { label: "Al menos 1 mayúscula", ok: /[A-Z]/.test(password) },
      { label: "Al menos 1 minúscula", ok: /[a-z]/.test(password) },
      { label: "Al menos 1 número", ok: /\d/.test(password) },
    ];
  }, [password]);

  const strength = useMemo(() => {
    if (!password) return { label: "", bars: 0, color: "" };
    const score = checks.filter((c) => c.ok).length;
    if (score <= 1) return { label: "Débil", bars: 1, color: "bg-red-500" };
    if (score === 2)
      return { label: "Regular", bars: 2, color: "bg-orange-500" };
    if (score === 3) return { label: "Buena", bars: 3, color: "bg-yellow-500" };
    return { label: "Segura", bars: 4, color: "bg-emerald-500" };
  }, [password, checks]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= strength.bars ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-[11px] font-semibold ${strength.color.replace("bg-", "text-")}`}
      >
        {strength.label}
      </p>
      <ul className="space-y-0.5">
        {checks.map((c, i) => (
          <li
            key={i}
            className={`text-[11px] flex items-center gap-1.5 ${
              c.ok ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <span className="text-xs leading-none">{c.ok ? "✓" : "○"}</span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  register,
  name,
  errors,
  type,
  placeholder,
  options,
  className,
  maxLength,
}) {
  const hasError = !!errors[name];
  const borderColor = hasError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
    : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20";

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-bold text-gray-700 mb-1.5"
      >
        {label}
      </label>
      {options ? (
        <select
          id={name}
          {...register(name)}
          className={`w-full px-4 py-3 rounded-xl border outline-none text-sm bg-white transition-shadow focus:ring-2 ${borderColor}`}
        >
          <option value="">Seleccioná una provincia</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type || "text"}
          placeholder={placeholder}
          maxLength={maxLength}
          {...register(name)}
          className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${borderColor}`}
        />
      )}
      {hasError && (
        <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
          {errors[name].message}
        </p>
      )}
    </div>
  );
}

export default function Register() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { delivery_option: [] },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const password = useWatch({ control, name: "password" });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    sanitize(data);

    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/login`,
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already registered")) {
        setError("Este correo ya está registrado. Iniciá sesión.");
      } else {
        setError(
          "No pudimos crear tu cuenta. Verificá los datos e intentá de nuevo.",
        );
      }
      setLoading(false);
      return;
    }

    // No session means email confirmation is required
    if (!auth.session) {
      const pendingProfile = {
        email: data.email,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        company_name: data.company_name || "",
        whatsapp_region: onlyDigits(data.whatsapp_region) || "",
        whatsapp_area: onlyDigits(data.whatsapp_area) || "",
        whatsapp_number_local: onlyDigits(data.whatsapp_number_local) || "",
        delivery_option: data.delivery_option || [],
        niche: data.niche || "",
        social_links: data.social_links || "",
      };
      try {
        localStorage.setItem("pending_profile", JSON.stringify(pendingProfile));
      } catch (e) {}
      setError(
        "Revisá tu casilla de correo y confirmá tu cuenta. Tus datos se guardaron temporalmente.",
      );
      setLoading(false);
      return;
    }

    let avatarUrl = null;
    if (data.avatar && data.avatar[0]) {
      const file = data.avatar[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${auth.user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }
    }

    const whatsapp_number = concatParts(
      data.whatsapp_region,
      data.whatsapp_area,
      data.whatsapp_number_local,
    );
    const whatsapp_region = onlyDigits(data.whatsapp_region) || null;
    const whatsapp_area = onlyDigits(data.whatsapp_area) || null;
    const whatsapp_number_local =
      onlyDigits(data.whatsapp_number_local) || null;

    let profileError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 500));
      const result = await supabase.from("profiles").upsert(
        {
          id: auth.user.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          company_name: data.company_name,
          delivery_option: data.delivery_option?.join(",") || null,
          whatsapp_number,
          whatsapp_region,
          whatsapp_area,
          whatsapp_number_local,
          niche: data.niche,
          social_links: data.social_links,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" },
      );
      profileError = result.error;
      if (!profileError) break;
    }

    const pendingProfile = {
      email: data.email,
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      company_name: data.company_name || "",
      // store sanitized (digits-only) parts so restoring them later yields
      // the same visible values in the form
      whatsapp_region: onlyDigits(data.whatsapp_region) || "",
      whatsapp_area: onlyDigits(data.whatsapp_area) || "",
      whatsapp_number_local: onlyDigits(data.whatsapp_number_local) || "",
      delivery_option: data.delivery_option || [],
      niche: data.niche || "",
      social_links: data.social_links || "",
    };

    if (profileError) {
      try {
        localStorage.setItem("pending_profile", JSON.stringify(pendingProfile));
      } catch (e) {}
      setError(
        "Error al guardar el perfil. Guardamos temporalmente tus datos, por favor iniciá sesión e intentá de nuevo.",
      );
    } else {
      try {
        localStorage.removeItem("pending_profile");
      } catch (e) {}
      const baseSlug = generateBaseSlug(
        data.first_name,
        data.last_name,
        data.company_name,
      );
      const slug = await generateUniqueSlug(supabase, "profiles", baseSlug);
      await supabase.from("profiles").update({ slug }).eq("id", auth.user.id);
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 bg-gradient-to-b from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-gray-900">Creá tu tienda</h2>
          <p className="text-gray-500 mt-2 text-lg">
            Completá los datos y empezá a vender hoy mismo.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm font-semibold"
          >
            {error}
          </motion.div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-8 md:p-10 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  1
                </div>
                <h3 className="text-lg font-black text-gray-900">Acceso</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Correo electrónico"
                  register={register}
                  name="email"
                  errors={errors}
                  type="email"
                  placeholder="ejemplo@correo.com"
                />
                <div />
                <Field
                  label="Contraseña"
                  register={register}
                  name="password"
                  errors={errors}
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                ></Field>
                <div>
                  <Field
                    label="Repetir contraseña"
                    register={register}
                    name="confirmPassword"
                    errors={errors}
                    type="password"
                    placeholder="Escribila de nuevo"
                  />
                </div>
                <div className="md:col-span-2 -mt-2">
                  <PasswordStrength password={password} />
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  2
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  Foto de perfil
                </h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-2xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Subí tu foto
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    {...register("avatar")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAvatarPreview(URL.createObjectURL(file));
                    }}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Opcional. PNG o JPG, máximo 5 MB.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  3
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  Datos personales
                </h3>
                <span className="text-[11px] text-gray-400 font-medium ml-auto">
                  Obligatorio
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Nombre"
                  register={register}
                  name="first_name"
                  errors={errors}
                  placeholder="Tu nombre"
                  maxLength={50}
                />
                <Field
                  label="Apellido"
                  register={register}
                  name="last_name"
                  errors={errors}
                  placeholder="Tu apellido"
                  maxLength={50}
                />
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  4
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  Tu emprendimiento
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Nombre del emprendimiento (opcional)"
                  register={register}
                  name="company_name"
                  errors={errors}
                  placeholder="Ej: Dulces Artesanales"
                  className="md:col-span-2"
                  maxLength={100}
                />
                <Field
                  label="Nicho"
                  register={register}
                  name="niche"
                  errors={errors}
                  placeholder="Ej: Ropa, Accesorios, Deco"
                  maxLength={100}
                />
                <Field
                  label="Red social o web"
                  register={register}
                  name="social_links"
                  errors={errors}
                  type="url"
                  placeholder="https://instagram.com/tutienda"
                  maxLength={500}
                />
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  5
                </div>
                <h3 className="text-lg font-black text-gray-900">Envíos</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                ¿Cómo entregás tus productos?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-colors cursor-pointer has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-200 border-gray-200 hover:border-emerald-200">
                  <input
                    type="checkbox"
                    value="delivery"
                    {...register("delivery_option")}
                    className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0 rounded"
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
                    type="checkbox"
                    value="pickup"
                    {...register("delivery_option")}
                    className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0 rounded"
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
              {errors.delivery_option && (
                <p className="text-red-500 text-xs font-medium mt-2">
                  {errors.delivery_option.message ||
                    errors.delivery_option.root?.message}
                </p>
              )}
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  6
                </div>
                <h3 className="text-lg font-black text-gray-900">Contacto</h3>
                <span className="text-[11px] text-gray-400 font-medium ml-auto">
                  Obligatorio
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="whatsapp_region"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    País
                  </label>
                  <select
                    id="whatsapp_region"
                    {...register("whatsapp_region")}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm bg-white transition-shadow focus:ring-2 ${
                      errors.whatsapp_region
                        ? "border-red-400 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  >
                    <option value="">Código</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        +{c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.whatsapp_region && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.whatsapp_region.message}
                    </p>
                  )}
                </div>
                <Field
                  label="Área"
                  register={register}
                  name="whatsapp_area"
                  errors={errors}
                  placeholder="381"
                />
                <Field
                  label="Número"
                  register={register}
                  name="whatsapp_number_local"
                  errors={errors}
                  placeholder="9999999"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Solo dígitos, sin espacios ni signos. Ej: +54 381 9999999
              </p>
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  7
                </div>
                <h3 className="text-lg font-black text-gray-900">Legales</h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-200 border-gray-200 hover:border-emerald-200">
                  <input
                    type="checkbox"
                    {...register("terms")}
                    className="mt-0.5 w-5 h-5 rounded-md text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    Acepto los{" "}
                    <Link
                      href="/terminos"
                      className="text-emerald-600 font-bold hover:underline"
                      target="_blank"
                    >
                      Términos y Condiciones
                    </Link>{" "}
                    de la plataforma.
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-red-500 text-xs font-medium ml-1 -mt-3">
                    {errors.terms.message}
                  </p>
                )}

                <label className="flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-200 border-gray-200 hover:border-emerald-200">
                  <input
                    type="checkbox"
                    {...register("privacy")}
                    className="mt-0.5 w-5 h-5 rounded-md text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    Acepto la{" "}
                    <Link
                      href="/privacidad"
                      className="text-emerald-600 font-bold hover:underline"
                      target="_blank"
                    >
                      Política de Privacidad
                    </Link>{" "}
                    y el tratamiento de mis datos personales.
                  </span>
                </label>
                {errors.privacy && (
                  <p className="text-red-500 text-xs font-medium ml-1 -mt-3">
                    {errors.privacy.message}
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="bg-gray-50 border-t border-gray-100 px-8 md:px-10 py-6">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-sm text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                  Creando cuenta...
                </span>
              ) : (
                "Crear cuenta y empezar a vender"
              )}
            </motion.button>
            <p className="text-center text-sm text-gray-500 mt-4">
              ¿Ya tenés cuenta?{" "}
              <Link
                href="/login"
                className="text-emerald-600 font-bold hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
