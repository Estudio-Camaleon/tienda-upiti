"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { registerSchema } from "../../lib/schemas";
import { onlyDigits } from "../../lib/phone";
import EmailConfirmationScreen from "../../components/EmailConfirmationScreen";

function sanitize(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") obj[key] = obj[key].trim();
  }
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(normalizeEmail(email));
}

async function checkEmailExists(email, signal) {
  const res = await fetch("/api/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizeEmail(email) }),
    signal,
  });

  if (!res.ok) throw new Error("No pudimos verificar el correo.");

  const data = await res.json();
  return !!data.exists;
}

function formatAuthError(error) {
  const message = error?.message || "No pudimos crear la cuenta.";
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("too many") ||
    lowerMessage.includes("exceeded") ||
    lowerMessage.includes("security purposes")
  ) {
    return "Superaste el límite de intentos. Volvé a intentarlo en 1 hora.";
  }

  return message;
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
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [emailCheck, setEmailCheck] = useState({
    email: "",
    status: "idle", // idle | checking | available | exists | error
  });
  // ── Redirect if already authenticated ──────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  // Derive callback state from URL (no setState in effect)
  const handlingCallback = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("confirmed") === "true",
    [],
  );

  // ── Handle confirmation callback (?confirmed=true) ─────────────
  useEffect(() => {
    if (!handlingCallback) return;
    // Give Supabase time to process URL auth tokens, then redirect
    const timer = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/login?confirmed=true");
      } else {
        // Tokens expired or invalid — redirect to login
        router.replace("/login?confirmed=true");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [handlingCallback, router]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const password = useWatch({ control, name: "password" });
  const confirmPassword = useWatch({ control, name: "confirmPassword" });
  const email = useWatch({ control, name: "email" });
  const normalizedEmail = normalizeEmail(email);
  const canCheckEmail = isValidEmail(normalizedEmail);
  const currentEmailCheck =
    emailCheck.email === normalizedEmail ? emailCheck : null;
  const emailAlreadyRegistered =
    canCheckEmail && currentEmailCheck?.status === "exists";
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  useEffect(() => {
    if (!canCheckEmail) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setEmailCheck({ email: normalizedEmail, status: "checking" });
      try {
        const exists = await checkEmailExists(
          normalizedEmail,
          controller.signal,
        );
        setEmailCheck({
          email: normalizedEmail,
          status: exists ? "exists" : "available",
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setEmailCheck({ email: normalizedEmail, status: "error" });
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [canCheckEmail, normalizedEmail]);

  const onSubmit = async (data) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    sanitize(data);

    try {
      const exists = await checkEmailExists(data.email);
      if (exists) {
        setEmailCheck({ email: normalizeEmail(data.email), status: "exists" });
        setError(
          "Este correo ya está registrado. Iniciá sesión o recuperá tu contraseña.",
        );
        setLoading(false);
        return;
      }
    } catch {
      setError(
        "No pudimos verificar si el correo ya existe. Intentá de nuevo.",
      );
      setLoading(false);
      return;
    }

    // Clean data first
    const cleanData = {
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      company_name: data.company_name || "",
      whatsapp_region: onlyDigits(data.whatsapp_region) || null,
      whatsapp_area: onlyDigits(data.whatsapp_area) || null,
      whatsapp_number_local: onlyDigits(data.whatsapp_number_local) || null,
      delivery_option: data.delivery_option?.join(",") || null,
      niche: data.niche || "",
      social_links: data.social_links || "",
    };

    // Send to Supabase Auth
    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    }/register?confirmed=true`;

    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: cleanData, // Data saves here until confirm
        emailRedirectTo: redirectTo,
      },
    });

    if (authError) {
      setError(formatAuthError(authError));
      setLoading(false);
      return;
    }

    // Upload Avatar if exist (best-effort without session thx to anon key)
    let avatarUrl = null;
    if (data.avatar && data.avatar[0] && auth.user) {
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

        // Update metadata with avatar
        await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });
      }
    }

    if (!auth.session) {
      setPendingEmail(data.email);
      setPendingUserId(auth.user?.id || null);
      setPendingConfirmation(true);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    setLoading(false);
  };

  // ── Show loading while processing confirmation redirect ─────
  if (handlingCallback) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-emerald-500 mx-auto mb-4"
            viewBox="0 0 24 24"
          >
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
          <p className="text-gray-500 text-sm">Confirmando cuenta…</p>
        </div>
      </main>
    );
  }

  if (pendingConfirmation) {
    return (
      <EmailConfirmationScreen email={pendingEmail} userId={pendingUserId} />
    );
  }

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
                <div>
                  <Field
                    label="Correo electrónico"
                    register={register}
                    name="email"
                    errors={errors}
                    type="email"
                    placeholder="ejemplo@correo.com"
                  />
                  {canCheckEmail &&
                    currentEmailCheck?.status === "checking" && (
                      <p className="text-gray-400 text-xs mt-1 ml-1 font-medium">
                        Verificando correo…
                      </p>
                    )}
                  {canCheckEmail &&
                    currentEmailCheck?.status === "available" && (
                      <p className="text-emerald-600 text-xs mt-1 ml-1 font-medium">
                        Correo disponible.
                      </p>
                    )}
                  {emailAlreadyRegistered && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      Este correo ya está registrado. Iniciá sesión o recuperá
                      tu contraseña.
                    </p>
                  )}
                  {canCheckEmail && currentEmailCheck?.status === "error" && (
                    <p className="text-amber-600 text-xs mt-1 ml-1 font-medium">
                      No pudimos verificar este correo ahora.
                    </p>
                  )}
                </div>
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
                  {passwordsMismatch && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      Las contraseñas no coinciden
                    </p>
                  )}
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

            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                  3
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
                  4
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
              disabled={loading || emailAlreadyRegistered}
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
