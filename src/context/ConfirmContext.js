"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    variant: "danger",
    resolve: null,
  });

  const confirm = useCallback(
    ({ title, message, confirmText, cancelText, variant }) => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title: title || "¿Estás seguro?",
          message: message || "",
          confirmText: confirmText || "Confirmar",
          cancelText: cancelText || "Cancelar",
          variant: variant || "danger",
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    state.resolve(true);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve(false);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state]);

  const confirmColors =
    state.variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-emerald-600 hover:bg-emerald-500";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {state.title}
              </h3>
              {state.message && (
                <p className="text-sm text-gray-500 mb-6">{state.message}</p>
              )}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-all text-sm min-h-[44px]"
                >
                  {state.cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  className={`flex-1 text-white font-bold py-3 rounded-xl transition-all text-sm min-h-[44px] ${confirmColors}`}
                >
                  {state.confirmText}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
