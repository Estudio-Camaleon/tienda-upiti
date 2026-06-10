"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const RESEND_COOLDOWN = 60;
const LOCAL_POLL_INTERVAL = 3000; // ms — same-browser session check
const SERVER_POLL_INTERVAL = 5000; // ms — cross-device confirmation check
const TIMEOUT_MS = 5 * 60 * 1000; // 5 min — show timeout suggestion

export default function EmailConfirmationScreen({ email, userId }) {
  const router = useRouter();
  const [status, setStatus] = useState("waiting"); // waiting | resending | confirmed | timeout
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const mountedRef = useRef(true);
  const serverCheckIntervalRef = useRef(null);
  const timeoutTimerRef = useRef(null);

  const redirectTo = `${
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  }/register?confirmed=true`;

  // ── Confirmación detectada → siempre a login manual ──────────
  const onConfirmed = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("confirmed");
    clearInterval(serverCheckIntervalRef.current);
    clearTimeout(timeoutTimerRef.current);
    // Nunca auto-login. Usuario ingresa credenciales manualmente.
    setTimeout(() => router.push("/login?confirmed=true"), 800);
  }, [router]);

  // ── Local session polling (same-browser fallback) ────────────
  const startLocalPolling = useCallback(() => {
    if (!mountedRef.current) return;
    return setInterval(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && mountedRef.current) {
          onConfirmed();
        }
      } catch {
        // silent
      }
    }, LOCAL_POLL_INTERVAL);
  }, [onConfirmed]);

  // ── Server-side polling (cross-device) ───────────────────────
  const startServerPolling = useCallback(() => {
    if (!mountedRef.current || !userId) return;
    serverCheckIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/check-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) return;
        const { confirmed } = await res.json();
        if (confirmed && mountedRef.current) {
          onConfirmed();
        }
      } catch {
        // silent — network error, keep polling
      }
    }, SERVER_POLL_INTERVAL);
  }, [userId, onConfirmed]);

  // ── Init all listeners on mount ──────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // 1. Check if session already exists (same-browser)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mountedRef.current && session) onConfirmed();
    });

    // 2. Listen for cross-tab auth changes (same-browser, different tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        onConfirmed();
      }
    });

    // 3. Local polling (same-browser fallback)
    const localPollTimer = startLocalPolling();

    // 4. Server polling (cross-device)
    startServerPolling();

    // 5. Timeout — after TIMEOUT_MS suggest manual login
    timeoutTimerRef.current = setTimeout(() => {
      if (mountedRef.current && status === "waiting") {
        setStatus("timeout");
      }
    }, TIMEOUT_MS);

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
      clearInterval(localPollTimer);
      clearInterval(serverCheckIntervalRef.current);
      clearTimeout(timeoutTimerRef.current);
    };
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-send confirmation email ───────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || status === "resending") return;
    setStatus("resending");
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: { emailRedirectTo: redirectTo },
      });

      if (resendError) throw resendError;

      setStatus("waiting");
      setCooldown(RESEND_COOLDOWN);

      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("No pudimos reenviar el email. Intentá de nuevo.");
      setStatus("waiting");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 bg-gradient-to-b from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 text-center">
          {status === "confirmed" ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                ¡Cuenta confirmada!
              </h2>
              <p className="text-gray-500 mb-4">
                Redirigiendo al inicio de sesión...
              </p>
              <div className="flex justify-center">
                <svg
                  className="animate-spin h-6 w-6 text-emerald-500"
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
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">
                Revisá tu correo
              </h2>
              <p className="text-gray-600 mb-1">
                Te enviamos un email de confirmación a
              </p>
              <p className="text-emerald-600 font-bold text-lg mb-4 break-all">
                {email}
              </p>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Hacé clic en el enlace que te enviamos para activar tu cuenta.
                Si no lo ves, revisá la carpeta de spam.
              </p>

              {status === "waiting" && (
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-400">
                  <span className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                  <span>Esperando confirmación…</span>
                </div>
              )}

              {status === "resending" && (
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-400">
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
                  <span>Reenviando email…</span>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl mb-4 text-sm font-semibold"
                >
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleResend}
                disabled={cooldown > 0 || status === "resending"}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mb-3"
              >
                {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar email"}
              </button>

              {status === "timeout" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left"
                >
                  <p className="text-amber-800 font-bold text-sm mb-1">
                    ¿No recibiste el email?
                  </p>
                  <ul className="text-amber-700 text-xs space-y-1 list-disc list-inside">
                    <li>Revisá la carpeta de spam / correo no deseado.</li>
                    <li>
                      Si el correo es correcto, presioná{" "}
                      <strong>Reenviar email</strong>.
                    </li>
                    <li>
                      Si ya confirmaste desde otro dispositivo,{" "}
                      <strong>esperá unos segundos</strong> o{" "}
                      <a
                        href="/login?confirmed=true"
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        iniciá sesión
                      </a>{" "}
                      manualmente.
                    </li>
                  </ul>
                </motion.div>
              )}

              <p className="text-xs text-gray-400 mt-6">
                ¿Usaste otro correo?{" "}
                <a
                  href="/register"
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Volver a registrarte
                </a>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
