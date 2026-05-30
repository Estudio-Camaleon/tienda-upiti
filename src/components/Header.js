// Archivo: src/components/Header.js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CONFIG } from "../data/config";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

export default function Header() {
  const { cart, setIsCartOpen } = useCart();
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const [user, setUser] = useState(null);

  // Escuchamos si hay un usuario en sesión
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
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer"
        >
          {CONFIG.logoUrl && (
            <img
              src={CONFIG.logoUrl}
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
          )}
          <h1 className="text-xl font-black tracking-tight text-emerald-600 hidden sm:block">
            {CONFIG.storeName}
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {/* Navegación de Usuario */}
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors hidden sm:block"
              >
                Cerrar Sesión
              </button>
              {/* Botón temporal, en la Fase 3 lo conectaremos al Panel Real */}
              <Link
                href="/dashboard"
                className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors"
              >
                Mi Panel
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-bold text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors hidden sm:block"
              >
                Vender
              </Link>
            </div>
          )}

          {/* Botón del Carrito */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 rounded-full transition-all duration-300 active:scale-90"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pop">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
