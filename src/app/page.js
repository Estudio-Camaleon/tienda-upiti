// Archivo: src/app/page.js
"use client"; // Necesario en Next.js para usar interactividad en el lado del cliente

import { CONFIG } from "../data/config";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-20 min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-emerald-600 hover:scale-105 transition-transform cursor-pointer">
            {CONFIG.storeName}
          </h1>

          <div className="flex items-center gap-4">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
            <button className="relative p-2 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 rounded-full transition-all duration-300">
              🛒
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full hidden shadow-md">
                0
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <Hero />

        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Nuestra Galería
            </h3>
            <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded-md">
              {CONFIG.products.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CONFIG.products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
