"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.maxTouchPoints > 1 &&
      /Macintosh/.test(ua) &&
      !window.matchMedia("(pointer:fine)").matches)
  );
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true
  );
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isIOS = getIOS();

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS no soporta beforeinstallprompt, mostrar aviso directo
    if (isIOS) {
      setTimeout(() => setShow(true), 4000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed, isIOS]);

  const handleInstall = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          setShow(false);
          setDismissed(true);
        }
        setDeferredPrompt(null);
      });
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    setDismissed(true);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 sm:pb-4"
        >
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 max-w-md mx-auto">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <svg
                className="w-4 h-4"
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

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">
                  {isIOS
                    ? "Instala esta tienda en tu iPhone"
                    : "¿Acceso rápido?"}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {isIOS
                    ? "Toca Compartir y luego Añadir a pantalla de inicio para tener la tienda como app."
                    : "Añade esta tienda a tu pantalla de inicio y accede al instante."}
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="mt-4 flex flex-col gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Toca{" "}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded text-xs font-bold">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        Compartir
                      </span>
                    </li>
                    <li>
                      Desplázate y pulsa{" "}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded text-xs font-bold">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Añadir a pantalla de inicio
                      </span>
                    </li>
                  </ol>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  Ahora no
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors min-h-[44px] flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Añadir
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
