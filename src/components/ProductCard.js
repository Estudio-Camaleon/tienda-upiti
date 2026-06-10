"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CONFIG } from "../data/config";
import ShareButtons from "./ShareButtons";
import ProtectedImage from "./ProtectedImage";
import { toggleFavorite, isFavorited } from "../lib/interactions";

function openWhatsApp(phone, product) {
  const message = encodeURIComponent(
    `¡Hola! Me gustaría consultar sobre:\n\n🏷️ *${product.name}*\n💰 ${CONFIG.currency}${Number(product.price).toLocaleString("es-AR")}\n📂 ${product.category}\n\nQuedo atento. ¡Gracias!`,
  );
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

export default function ProductCard({ product, index, currentUser }) {
  const whatsapp = product.profiles?.whatsapp_number;
  const hasStock = product.stock == null || Number(product.stock) > 0;
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      isFavorited(currentUser.id, product.id).then(setFavorited);
    }
  }, [currentUser, product.id]);

  async function handleToggleFav(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || favLoading) return;
    setFavLoading(true);
    try {
      const result = await toggleFavorite(currentUser.id, product.id);
      setFavorited(result.favorited);
    } catch {
      // ignore
    }
    setFavLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="product-card bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col group"
    >
      <Link
        href={`/producto/${product.slug || product.id}`}
        className="relative pt-[80%] bg-gray-100 overflow-hidden block"
      >
        <ProtectedImage
          className="absolute inset-0 w-full h-full"
          imgClassName="object-cover group-hover:scale-110 transition-transform duration-700"
          src={
            product.image ||
            "https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen"
          }
          alt={product.name}
        />
        <ShareButtons
          url={
            typeof window !== "undefined"
              ? `${window.location.origin}/producto/${product.slug || product.id}`
              : ""
          }
          title={`${product.name} - ${CONFIG.storeName}`}
        />
        {/* Heart favorite button */}
        {currentUser && (
          <button
            onClick={handleToggleFav}
            disabled={favLoading}
            className="absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                favorited
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400 fill-transparent"
              }`}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              {product.category}
            </span>
          </div>

          <Link
            href={`/producto/${product.slug || product.id}`}
            className="block"
          >
            <h4 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
              {product.description}
            </p>
          </Link>
        </div>

        {product.seller_id && (
          <p className="truncate text-[11px] text-gray-400 -mt-2">
            Vendido por{" "}
            <Link
              href={`/vendedor/${product.profiles?.slug || product.seller_id}`}
              className="font-bold text-gray-500 hover:text-emerald-600"
            >
              {product.profiles?.company_name || "el vendedor"}
            </Link>
          </p>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-gray-50">
          <div>
            <span className="text-xl font-black text-gray-900">
              {CONFIG.currency}
              {Number(product.price).toLocaleString("es-AR")}
            </span>
            {product.stock != null && (
              <p
                className={`mt-1 text-[11px] font-bold ${
                  hasStock ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {hasStock ? `${product.stock} disponibles` : "Sin stock"}
              </p>
            )}
          </div>
          <button
            onClick={() => openWhatsApp(whatsapp, product)}
            disabled={!whatsapp || !hasStock}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs p-2.5 md:py-2.5 md:px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px]"
            title={hasStock ? "Consultar por WhatsApp" : "Producto sin stock"}
          >
            <svg
              className="w-5 h-5 md:w-4 md:h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="hidden md:inline">
              {hasStock ? "Consultar" : "Sin stock"}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
