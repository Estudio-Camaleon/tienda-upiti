// src/components/ProductCard.js
"use client";
import Link from "next/link";
import { CONFIG } from "../data/config";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, index }) {
  const { addToCart } = useCart();

  return (
    <div className="product-card bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col group">
      {/* Imagen: Solo enlace al producto */}
      <Link
        href={`/producto/${product.id}`}
        className="relative pt-[80%] bg-gray-100 overflow-hidden block"
      >
        <img
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          src={
            product.image ||
            "https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen"
          }
          alt={product.name}
        />
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Fila superior: Categoría y Tienda (separados para no anidar enlaces) */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              {product.category}
            </span>
            {product.seller_id && (
              <Link
                href={`/vendedor/${product.seller_id}`}
                className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 underline"
              >
                Ver Tienda 🏪
              </Link>
            )}
          </div>

          <Link href={`/producto/${product.id}`} className="block">
            <h4 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
              {product.description}
            </p>
          </Link>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-gray-50">
          <span className="text-xl font-black text-gray-900">
            {CONFIG.currency}
            {Number(product.price).toLocaleString("es-AR")}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-800 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
          >
            Añadir 🛒
          </button>
        </div>
      </div>
    </div>
  );
}
