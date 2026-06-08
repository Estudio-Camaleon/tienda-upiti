"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { CONFIG } from "../data/config";
import { useStoreConfig } from "../context/StoreConfigContext";
import { supabase } from "../lib/supabase";

function openWhatsApp(phone, product) {
  const message = encodeURIComponent(
    `¡Hola! Me gustaría consultar sobre:\n\nProducto: *${product.name}*\nPrecio: ${CONFIG.currency}${Number(product.price).toLocaleString("es-AR")}\nCategoría: ${product.category}\n\nQuedo atento. ¡Gracias!`,
  );
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

export default function Hero({ products, loading }) {
  const { logo_image, mainColor, heroImage, storeName } = useStoreConfig();
  const themeColor = mainColor || CONFIG.mainColor;
  const [user, setUser] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: false,
      containScroll: "trimSnaps",
      breakpoints: {
        "(min-width: 640px)": { slidesToScroll: 2 },
        "(min-width: 1024px)": { slidesToScroll: 3 },
      },
    },
    [
      Autoplay({
        delay: 4000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const snapCount = products.length;

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  if (loading) return null;

  const showCarousel = products.length > 5;
  const bgImage = heroImage || CONFIG.heroImage;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
      style={{ "--theme-color": themeColor }}
    >
      <div className="absolute inset-0 -z-10">
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = "none";
          }}
        />
      </div>
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(to bottom right, ${themeColor}15 0%, ${themeColor}08 40%, white 70%, ${themeColor}10 100%)`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -z-10"
        style={{ backgroundColor: `${themeColor}15` }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none -z-10"
        style={{ backgroundColor: `${themeColor}10` }}
      />

      <div className="relative px-6 sm:px-10 py-8 sm:py-12 lg:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src={logo_image}
              alt={storeName}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
              {storeName}
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-xl mx-auto font-medium">
            Descubrí productos únicos de emprendedores locales. Comprá directo
            por WhatsApp, sin intermediarios.
          </p>
        </div>

        {showCarousel ? (
          <>
            <div ref={emblaRef}>
              <div className="flex gap-4 cursor-grab active:cursor-grabbing">
                {products.map((product) => {
                  const whatsapp = product.profiles?.whatsapp_number;
                  return (
                    <div
                      key={product.id}
                      className="relative shrink-0 w-[75%] sm:w-[48%] lg:w-[32%] min-w-0"
                    >
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group h-full">
                        <Link
                          href={`/producto/${product.id}`}
                          className="relative pt-[60%] bg-gray-100 overflow-hidden block"
                        >
                          <img
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            src={
                              product.image ||
                              "https://placehold.co/400x260/eeeeee/999999?text=Sin+Imagen"
                            }
                            alt={product.name}
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm"
                              style={{ color: themeColor }}
                            >
                              {product.category}
                            </span>
                          </div>
                        </Link>
                        <div className="p-4 sm:p-5 flex flex-col gap-2">
                          <Link href={`/producto/${product.id}`}>
                            <h3
                              className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-1 transition-colors"
                              style={{ "--hover-color": themeColor }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = themeColor)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "")
                              }
                            >
                              {product.name}
                            </h3>
                          </Link>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                          {product.profiles?.company_name && (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                                style={{ backgroundColor: themeColor }}
                              >
                                {product.profiles.company_name.charAt(0)}
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">
                                {product.profiles.company_name}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                            <span className="text-base sm:text-lg font-black text-gray-900">
                              {CONFIG.currency}
                              {Number(product.price).toLocaleString("es-AR")}
                            </span>
                            <button
                              onClick={() => openWhatsApp(whatsapp, product)}
                              disabled={!whatsapp}
                              className="text-white font-bold text-xs sm:text-[11px] py-2.5 sm:py-2 px-4 sm:px-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-1 shadow-sm min-h-[44px] sm:min-h-0"
                              style={{
                                backgroundColor: themeColor,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.filter =
                                  "brightness(1.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.filter = "";
                              }}
                            >
                              <svg
                                className="w-4 h-4 sm:w-3.5 sm:h-3.5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              Consultar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {snapCount > 1 && (
              <div className="flex justify-center items-center gap-2 mt-5">
                {Array.from({ length: snapCount }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`rounded-full transition-all duration-300 h-3 sm:h-2 ${
                      index === selectedIndex
                        ? "w-8 sm:w-6"
                        : "w-3 sm:w-2 bg-gray-200 hover:bg-gray-300"
                    }`}
                    style={
                      index === selectedIndex
                        ? { backgroundColor: themeColor }
                        : undefined
                    }
                    aria-label={`Ir al producto ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="#catalogo"
              className="text-white font-bold text-sm px-6 py-3 sm:py-3.5 rounded-xl transition-all shadow-sm min-h-[44px] flex items-center justify-center"
              style={{ backgroundColor: themeColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
              }}
            >
              Explorar productos
            </Link>
            <Link
              href={user ? "/dashboard#agregar-producto" : "/register"}
              className="bg-white font-bold text-sm px-6 py-3 sm:py-3.5 rounded-xl border transition-all shadow-sm min-h-[44px] flex items-center justify-center"
              style={{
                color: themeColor,
                borderColor: `${themeColor}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              Quiero vender
            </Link>
          </div>
        )}
      </div>
    </motion.section>
  );
}
