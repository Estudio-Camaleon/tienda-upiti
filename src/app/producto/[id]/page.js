"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { CONFIG } from "../../../data/config";

function openWhatsApp(phone, product) {
  const message = encodeURIComponent(
    `¡Hola! Me gustaría consultar sobre:\n\n🏷️ *${product.name}*\n💰 ${CONFIG.currency}${Number(product.price).toLocaleString("es-AR")}\n📂 ${product.category}\n\nQuedo atento. ¡Gracias!`,
  );
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase
        .from("products")
        .select(
          "*, profiles(whatsapp_number, company_name, first_name, last_name)",
        )
        .eq("id", id)
        .single();
      if (data && data.status !== "approved") {
        setProduct(null);
      } else {
        setProduct(data);
      }
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
        <p className="text-gray-500 text-sm mt-2">
          Este producto no está disponible o está pendiente de moderación.
        </p>
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
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1"
    >
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
        {}
        <div className="w-full md:w-1/2 bg-gray-50 relative pt-[100%] md:pt-0 min-h-[280px] sm:min-h-[400px]">
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

        {}
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

          {product.profiles?.whatsapp_number && (
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
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={() =>
                    openWhatsApp(product.profiles.whatsapp_number, product)
                  }
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_10px_20px] shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Consultar por WhatsApp
                </button>
                {product.seller_id && (
                  <Link
                    href={`/vendedor/${product.seller_id}`}
                    className="text-center text-xs font-bold text-gray-400 hover:text-emerald-600"
                  >
                    Ver perfil del vendedor →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
