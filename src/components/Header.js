"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useStoreConfig } from "../context/StoreConfigContext";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { logoUrl } = useStoreConfig();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer"
          onClick={() => setMenuOpen(false)}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
          )}
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <nav className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                >
                  Cerrar sesión
                </button>
                <Link
                  href="/dashboard"
                  className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors"
                >
                  Mi Panel
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors"
                >
                  Vender
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-left px-4 py-4 rounded-xl font-bold text-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors min-h-[48px] flex items-center"
                  >
                    Mi Panel
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-4 rounded-xl font-bold text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors min-h-[48px]"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-left px-4 py-4 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[48px] flex items-center"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-left px-4 py-4 rounded-xl font-bold text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors min-h-[48px] flex items-center"
                  >
                    Vender
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
