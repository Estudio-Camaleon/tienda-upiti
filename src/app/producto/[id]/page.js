// Archivo: src/app/producto/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { CONFIG } from "../../../data/config";
import { useCart } from "../../../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams(); // Obtiene el ID de la URL
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      // Pedimos a Supabase solo el producto con el ID exacto
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      setProduct(data);
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-32 flex-1">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32 flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-gray-800">
          Producto no encontrado
        </h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-emerald-600 font-bold hover:underline"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 animate-fade-in-up">
      <button
        onClick={() => router.back()}
        className="mb-8 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors"
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
            strokeWidth="3"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Volver al catálogo
      </button>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Imagen del producto grande */}
        <div className="w-full md:w-1/2 bg-gray-50 relative pt-[100%] md:pt-0 min-h-[400px]">
          <img
            src={
              product.image ||
              "https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen"
            }
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen";
            }}
          />
        </div>

        {/* Detalles e información */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-3 bg-emerald-50 w-fit px-3 py-1 rounded-full">
            {product.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
            {product.name}
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            {product.description}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-100 pt-8 mt-auto gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-400 uppercase">
                Precio final
              </span>
              <span className="text-4xl font-black text-emerald-600">
                {CONFIG.currency}
                {Number(product.price).toLocaleString("es-AR")}
              </span>
            </div>
            <button
              onClick={() => addToCart(product)}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_10px_20px] shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 text-lg"
            >
              Añadir 🛒
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
