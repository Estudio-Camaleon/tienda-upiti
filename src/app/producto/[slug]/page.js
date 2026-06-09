"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { CONFIG } from "../../../data/config";
import { useStoreConfig } from "../../../context/StoreConfigContext";
import ProductCard from "../../../components/ProductCard";
import ShareButtons from "../../../components/ShareButtons";

function openWhatsApp(phone, product) {
  const message = encodeURIComponent(
    `¡Hola! Me gustaría consultar sobre:\n\nProducto: *${product.name}*\nPrecio: ${CONFIG.currency}${Number(product.price).toLocaleString("es-AR")}\nCategoría: ${product.category}\n\nQuedo atento. ¡Gracias!`,
  );
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded-full mb-8" />
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 bg-gray-100 min-h-[300px] sm:min-h-[400px]" />
        <div className="w-full md:w-1/2 p-8 md:p-12 space-y-4">
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
          <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
            <div className="h-4 w-4/6 bg-gray-100 rounded" />
          </div>
          <div className="h-12 w-full bg-gray-200 rounded-2xl mt-8" />
        </div>
      </div>
    </div>
  );
}

function SellerCard({ seller, themeColor }) {
  if (!seller) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
        Vendedor
      </h3>
      <div className="flex items-center gap-3">
        <img
          src={seller.avatar_url || "https://placehold.co/48"}
          alt={seller.company_name}
          className="w-12 h-12 rounded-full object-cover border border-gray-100"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 text-sm truncate">
            {seller.company_name || `${seller.first_name} ${seller.last_name}`}
          </p>
          {seller.delivery_option && (
            <p className="text-xs text-gray-400 truncate">
              {seller.delivery_option === "delivery"
                ? "Envío a domicilio"
                : "Punto de encuentro"}
            </p>
          )}
        </div>
      </div>
      {seller.whatsapp_number && (
        <Link
          href={`https://wa.me/${seller.whatsapp_number}`}
          target="_blank"
          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all"
          style={{ backgroundColor: themeColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "";
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Contactar vendedor
        </Link>
      )}
      <Link
        href={`/vendedor/${seller.slug || seller.id}`}
        className="mt-2 block text-center text-xs font-bold transition-colors"
        style={{ color: themeColor }}
      >
        Ver perfil completo ?
      </Link>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const { mainColor } = useStoreConfig();
  const themeColor = mainColor || CONFIG.mainColor;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  async function findProduct(param) {
    let { data } = await supabase
      .from("products")
      .select("*, profiles(*)")
      .eq("slug", param)
      .maybeSingle();
    if (data) return data;
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRe.test(param)) {
      const { data: byId } = await supabase
        .from("products")
        .select("*, profiles(*)")
        .eq("id", param)
        .maybeSingle();
      if (byId) return byId;
    }
    return null;
  }

  useEffect(() => {
    async function fetchProduct() {
      const data = await findProduct(slug);

      if (!data || data.status !== "approved") {
        setProduct(null);
      } else {
        setProduct(data);

        if (data?.category) {
          const { data: related } = await supabase
            .from("products")
            .select(
              "*, profiles(whatsapp_number, company_name, avatar_url, slug)",
            )
            .eq("category", data.category)
            .eq("status", "approved")
            .neq("id", data.id)
            .limit(4);
          setRelatedProducts(related || []);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  // Update meta tags dynamically on the client once product is loaded
  useEffect(() => {
    if (loading) return;
    const title = product
      ? `${product.name} - ${CONFIG.storeName}`
      : `${CONFIG.storeName} - Compra Rapida`;
    const description =
      product?.description ||
      "Compra facil y rapido, enviando tu pedido directamente por WhatsApp.";
    const image = product?.image || "/media/portadas/portada_upiti.webp";

    const upsertMeta = (attr, name, content) => {
      const selector =
        attr === "name" ? `meta[name="${name}"]` : `meta[property="${name}"]`;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "theme-color", themeColor || CONFIG.mainColor);
  }, [loading, product, themeColor]);

  if (loading) return <LoadingSkeleton />;

  if (!product) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-32 flex-1 flex flex-col items-center justify-center px-4"
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-800">
          Producto no encontrado
        </h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">
          Este producto no esta disponible o esta pendiente de moderacion.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all min-h-[44px]"
          style={{ backgroundColor: themeColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "";
          }}
        >
          Volver a la tienda
        </button>
      </motion.div>
    );
  }

  const seller = product.profiles;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1"
    >
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-bold transition-colors"
        style={{ color: themeColor }}
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
        Volver al catalogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 relative pt-[70%]">
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
              <ShareButtons
                url={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/producto/${product.slug || product.id}`
                    : ""
                }
                title={`${product.name} - ${CONFIG.storeName}`}
              />
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  {product.category}
                </span>
                {product.brand && (
                  <span className="max-w-[200px] truncate text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {product.brand}
                  </span>
                )}
              </div>

              <h1 className="break-words text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>

              <p className="break-words text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <div>
                  <span className="text-sm font-bold text-gray-400 uppercase">
                    Precio final
                  </span>
                  <p
                    className="text-3xl sm:text-4xl font-black"
                    style={{ color: themeColor }}
                  >
                    {CONFIG.currency}
                    {Number(product.price).toLocaleString("es-AR")}
                  </p>
                </div>

                {product.profiles?.whatsapp_number && (
                  <button
                    onClick={() =>
                      openWhatsApp(product.profiles.whatsapp_number, product)
                    }
                    className="text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center gap-2.5 text-base shadow-lg min-h-[48px]"
                    style={{ backgroundColor: themeColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = "brightness(1.1)";
                      e.currentTarget.style.boxShadow = `0 10px 25px ${themeColor}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = "";
                      e.currentTarget.style.boxShadow = "";
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Consultar por WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <SellerCard seller={seller} themeColor={themeColor} />

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Detalles
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Categoria</span>
                <span className="font-medium text-gray-900">
                  {product.category}
                </span>
              </div>
              {product.brand && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Marca</span>
                  <span className="font-medium text-gray-900">
                    {product.brand}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Precio</span>
                <span className="font-black" style={{ color: themeColor }}>
                  {CONFIG.currency}
                  {Number(product.price).toLocaleString("es-AR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ID</span>
                <span className="font-mono text-xs text-gray-400">
                  #{product.id.toString().slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </motion.main>
  );
}
