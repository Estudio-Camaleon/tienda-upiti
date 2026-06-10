"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
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

  // Fetch current user for favorites
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(data.session?.user || null);
    });
  }, []);

  // Build categories with thumbnails and product counts
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
      // Use first product's image as category thumbnail
      if (!cat.thumbnail && p.image) {
        cat.thumbnail = p.image;
      }
    }
    return Array.from(map.values());
  }, [products]);

  // Filter + sort products
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
    <div className="flex-1">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Hero products={products} loading={loading} />
      </motion.div>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-500 mt-4 font-medium">
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
                  <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                      Categorías
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                      Elegí una categoría para explorar productos
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {categories.map((cat, idx) => (
                      <motion.button
                        key={cat.name}
                        onClick={() => handleSelectCategory(cat.name)}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className="relative group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 text-left cursor-pointer"
                      >
                        <div className="relative pt-[60%] bg-gray-100">
                          <img
                            src={
                              cat.thumbnail ||
                              "https://placehold.co/400x240/eeeeee/999999?text=Categor%C3%ADa"
                            }
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/400x240/eeeeee/999999?text=Categor%C3%ADa";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                            {cat.count}{" "}
                            {cat.count === 1 ? "producto" : "productos"}
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-emerald-600 transition-colors">
                            {cat.name}
                          </h3>
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
                  className="scroll-mt-24 space-y-6"
                >
                  <button
                    onClick={handleBackToCategories}
                    className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
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
                    Todas las categorías
                  </button>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                      {selectedCategory}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {filteredProducts.length}{" "}
                      {filteredProducts.length === 1 ? "producto" : "productos"}{" "}
                      disponibles
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar en esta categoría..."
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
                        />
                      </svg>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm text-sm bg-white transition-all cursor-pointer"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <p className="text-center py-12 text-gray-400 text-sm">
                      No se encontraron productos en esta categoría.
                    </p>
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
