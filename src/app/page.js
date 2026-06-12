"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import ProtectedImage from "../components/ProtectedImage";
import { supabase } from "../lib/supabase";

const sortOptions = [
  { value: "recent", label: "Más recientes" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "name-asc", label: "Nombre: A-Z" },
  { value: "name-desc", label: "Nombre: Z-A" },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase
        .from("products")
        .select("*, profiles(whatsapp_number, company_name, avatar_url, slug)")
        .eq("status", "approved")
        .order("id", { ascending: true });
      setProducts(data || []);
      setLoading(false);
    }
    loadProducts();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(data.session?.user || null);
    });
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (!map.has(p.category)) {
        map.set(p.category, {
          name: p.category,
          count: 0,
          thumbnail: p.image || null,
        });
      }
      const cat = map.get(p.category);
      cat.count++;
      if (!cat.thumbnail && p.image) {
        cat.thumbnail = p.image;
      }
    }
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    switch (sortBy) {
      case "price-desc":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "price-asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        result.sort((a, b) => b.id - a.id);
    }
    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  function handleSelectCategory(categoryName) {
    setSelectedCategory(categoryName);
    setSearchQuery("");
    setView("products");
  }

  function handleBackToCategories() {
    setView("categories");
    setSelectedCategory(null);
    setSearchQuery("");
  }

  return (
    <div className="flex-1 bg-gray-50/50 min-h-screen pb-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Hero products={products} loading={loading} />
      </motion.div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-100 border-t-emerald-500 shadow-sm"></div>
            <p className="text-gray-500 mt-6 font-semibold animate-pulse tracking-wide">
              Cargando catálogo...
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {view === "categories" ? (
                <motion.section
                  key="categories"
                  id="catalogo"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="scroll-mt-24"
                >
                  <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                      Categorías
                    </h2>
                    <div className="w-24 h-1.5 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
                    <p className="text-gray-500 text-base sm:text-lg mt-4 font-medium">
                      Elegí una categoría para explorar productos
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                    {categories.map((cat, idx) => (
                      <motion.button
                        key={cat.name}
                        onClick={() => handleSelectCategory(cat.name)}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className="relative group rounded-[2rem] overflow-hidden bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer border border-gray-100"
                      >
                        <div className="relative pt-[80%] bg-gray-100 overflow-hidden">
                          <ProtectedImage
                            src={
                              cat.thumbnail ||
                              "https://placehold.co/400x320/eeeeee/999999?text=Categor%C3%ADa"
                            }
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full"
                            imgClassName="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/400x320/eeeeee/999999?text=Categor%C3%ADa";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent transition-opacity duration-300" />

                          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg">
                            {cat.count}{" "}
                            {cat.count === 1 ? "producto" : "productos"}
                          </div>

                          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="font-black text-white text-2xl sm:text-3xl drop-shadow-md leading-tight">
                              {cat.name}
                            </h3>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>
              ) : (
                <motion.section
                  key="products"
                  id="catalogo"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="scroll-mt-24"
                >
                  <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div>
                        <button
                          onClick={handleBackToCategories}
                          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors mb-4 bg-gray-50 hover:bg-emerald-50 px-4 py-2 rounded-full"
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
                              strokeWidth={3}
                              d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                          </svg>
                          Volver a categorías
                        </button>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                          {selectedCategory}
                        </h2>
                        <p className="text-gray-500 text-base font-medium mt-2">
                          {filteredProducts.length}{" "}
                          {filteredProducts.length === 1
                            ? "producto"
                            : "productos"}{" "}
                          disponibles
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-80">
                          <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium text-gray-700 transition-all bg-gray-50/50 focus:bg-white"
                          />
                          <svg
                            className="w-5 h-5 absolute left-4 top-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-5 py-3.5 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold text-gray-700 bg-gray-50/50 focus:bg-white transition-all cursor-pointer appearance-none min-w-[200px]"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3e%3c/svg%3e")`,
                            backgroundPosition: "right 1rem center",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "1.5em 1.5em",
                          }}
                        >
                          {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-10 h-10 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        No hay resultados
                      </h3>
                      <p className="text-gray-500">
                        No encontramos productos que coincidan con tu búsqueda.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {filteredProducts.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={index}
                          currentUser={currentUser}
                        />
                      ))}
                    </div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
