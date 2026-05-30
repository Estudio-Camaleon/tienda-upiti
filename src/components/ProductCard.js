// Archivo: src/components/ProductCard.js
"use client";
import Link from "next/link";
import { CONFIG } from "../data/config";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, index }) {
  const { addToCart } = useCart();

  return (
    <div
      className="product-card animate-fade-in-up opacity-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col group"
      style={{
        animationDelay: `${index * 0.05}s`,
        animationFillMode: "forwards",
      }}
    >
      {/* 1. ENLACE AL PRODUCTO (IMAGEN) */}
      <Link
        href={`/producto/${product.id}`}
        className="relative pt-[80%] bg-gray-100 overflow-hidden block cursor-pointer"
      >
        <img
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          src={
            product.image ||
            "https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen"
          }
          alt={product.name}
          loading="lazy"
        />
        {product.isStar && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-sm shadow-orange-500/30">
            ★ Estrella
          </span>
        )}
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* 2. FILA SUPERIOR: CATEGORÍA Y ENLACE A TIENDA (Fuera del enlace del producto) */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              {product.category}
            </span>
            {product.seller_id && (
              <Link
                href={`/vendedor/${product.seller_id}`}
                className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 hover:underline relative z-10"
              >
                Ver Tienda 🏪
              </Link>
            )}
          </div>

          {/* 3. ENLACE AL PRODUCTO (TÍTULO Y DESCRIPCIÓN) */}
          <Link
            href={`/producto/${product.id}`}
            className="block cursor-pointer"
          >
            <h4 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </Link>
        </div>

        {/* 4. SECCIÓN DE PRECIO Y BOTÓN */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-50">
          <span className="text-xl font-black text-gray-900">
            {CONFIG.currency}
            {Number(product.price).toLocaleString("es-AR")}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-800 font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-300 active:scale-[0.90] flex items-center gap-1 shadow-sm relative z-10"
          >
            Añadir 🛒
          </button>
        </div>
      </div>
    </div>
  );
}
