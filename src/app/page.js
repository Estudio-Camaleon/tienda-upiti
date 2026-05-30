// Archivo: src/app/page.js
"use client";
import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState(""); // 1. Nuevo estado de búsqueda

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });
      setProducts(data || []);
      setLoading(false);
    }
    loadProducts();
  }, []);

  const categories = ["Todos", ...new Set(products.map((p) => p.category))];

  // 2. Filtramos por categoría Y por búsqueda de texto
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "Todos" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 flex-1">
      <Hero />
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Cargando catálogo...</p>
        </div>
      ) : (
        <>
          {/* 3. Panel superior con Filtros + Barra de Búsqueda */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory w-full md:w-auto">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`snap-center shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white shadow-[0_4px_10px] shadow-emerald-600/30"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all"
              />
              <svg
                className="w-5 h-5 absolute left-4 top-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </section>

          <section className="space-y-3">
            {filteredProducts.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">
                No se encontraron productos.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
