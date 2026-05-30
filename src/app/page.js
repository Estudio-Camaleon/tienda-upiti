// Archivo: src/app/page.js
"use client";

import { useState } from "react";
import { CONFIG } from "../data/config";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import CartModal from "../components/CartModal";

export default function Home() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Obtener categorías únicas
  const categories = [
    "Todos",
    ...new Set(CONFIG.products.map((p) => p.category)),
  ];

  // Filtrar productos
  const filteredProducts =
    selectedCategory === "Todos"
      ? CONFIG.products
      : CONFIG.products.filter((p) => p.category === selectedCategory);

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  // Funciones del Carrito
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id,
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prevCart, { product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            return { ...item, qty: item.qty + delta };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const confirmOrder = () => {
    if (cart.length === 0) return;

    let total = 0;
    let message = `¡Hola! Me gustaría confirmar mi pedido:\n\n`;

    cart.forEach((item) => {
      let subtotal = item.product.price * item.qty;
      total += subtotal;
      message += `▫️ *${item.qty}x* ${item.product.name} - ${CONFIG.currency}${subtotal.toLocaleString("es-AR")}\n`;
    });

    message += `\n💰 *Total a pagar: ${CONFIG.currency}${total.toLocaleString("es-AR")}*\n\nPor favor, confirmame la disponibilidad. ¡Gracias!`;

    const encodedText = encodeURIComponent(message);
    window.open(
      `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedText}`,
      "_blank",
    );
  };

  return (
    <div className="bg-gray-50 text-gray-900 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-20 min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-emerald-600 hover:scale-105 transition-transform cursor-pointer">
            {CONFIG.storeName}
          </h1>

          <div className="flex items-center gap-4">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full hidden sm:flex items-center gap-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
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

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <Hero />

        {/* Filtros */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
            Filtros Rápidos
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x snap-mandatory">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`snap-center shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 hover:-translate-y-1 ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)] border-transparent"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Galería */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Nuestra Galería
            </h3>
            <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded-md">
              {filteredProducts.length}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm animate-fade-in-up">
              No hay productos en esta categoría.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                // Actualizamos ProductCard para que reciba la función addToCart real
                <div key={product.id} onClick={() => addToCart(product)}>
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQty={updateQty}
        confirmOrder={confirmOrder}
      />
    </div>
  );
}
