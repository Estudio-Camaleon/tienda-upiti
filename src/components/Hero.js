"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import ProtectedImage from "./ProtectedImage";
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
  const { logoUrl, mainColor, heroImage, storeName } = useStoreConfig();
  const themeColor = mainColor || CONFIG.mainColor;
  const [user, setUser] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
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
  const [scrollSnaps, setScrollSnaps] = useState([]);

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

  const initScrollSnaps = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const timer = setTimeout(() => {
      initScrollSnaps();
    }, 0);

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("reInit", initScrollSnaps);

    return () => clearTimeout(timer);
  }, [emblaApi, onSelect, initScrollSnaps]);

  if (loading) return null;

  const showCarousel = products.length > 5;
  const bgImage = heroImage || CONFIG.heroImage;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden"
      style={{ "--theme-color": themeColor }}
    >
      <div className="absolute inset-0 -z-10">
        <ProtectedImage
          src={bgImage}
          alt=""
          className="w-full h-full"
          imgClassName="object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = "none";
          }}
        />
      </div>

      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -z-10 transition-colors duration-700"
        style={{ backgroundColor: `${themeColor}15` }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none -z-10 transition-colors duration-700"
        style={{ backgroundColor: `${themeColor}10` }}
      />

      <div className="relative px-6 sm:px-10 py-8 sm:py-12 lg:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-4">
            <ProtectedImage
              src={logoUrl}
              alt={storeName}
              className="w-50 h-50"
              imgClassName="object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
          </div>
          <strong>
            <p className="text-gray-800">
              Descubrí productos únicos de emprendedores locales.
            </p>
            <p className="text-gray-800">
              Comprá directo por WhatsApp, sin intermediarios.
            </p>
          </strong>
        </div>

        {showCarousel ? (
          <>
            <div
              className="overflow-hidden w-full cursor-grab active:cursor-grabbing"
              ref={emblaRef}
            >
              <div className="flex -ml-4 sm:-ml-6 touch-pan-y">
                {products.map((product) => {
                  const whatsapp = product.profiles?.whatsapp_number;
                  return (
                    <div
                      key={product.id}
                      className="flex-[0_0_85%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 pl-4 sm:pl-6 relative"
                    >
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col">
                        <Link
                          href={`/producto/${product.slug || product.id}`}
                          className="relative pt-[65%] bg-gray-100 overflow-hidden block shrink-0"
                        >
                          <ProtectedImage
                            className="absolute inset-0 w-full h-full"
                            imgClassName="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                            src={
                              product.image ||
                              "https://placehold.co/400x260/eeeeee/999999?text=Sin+Imagen"
                            }
                            alt={product.name}
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm"
                              style={{ color: themeColor }}
                            >
                              {product.category}
                            </span>
                          </div>
                        </Link>

                        <div className="p-5 flex flex-col flex-grow gap-3">
                          <Link
                            href={`/producto/${product.slug || product.id}`}
                          >
                            <h3
                              className="font-bold text-gray-900 text-base sm:text-lg leading-tight line-clamp-1 transition-colors duration-300"
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

                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-grow">
                            {product.description}
                          </p>

                          {product.profiles?.company_name && (
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm"
                                style={{ backgroundColor: themeColor }}
                              >
                                {product.profiles.company_name.charAt(0)}
                              </div>
                              <p className="text-xs font-medium text-gray-500 truncate">
                                {product.profiles.company_name}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                            <span className="text-lg sm:text-xl font-black text-gray-900">
                              {CONFIG.currency}
                              {Number(product.price).toLocaleString("es-AR")}
                            </span>
                            <button
                              onClick={() => openWhatsApp(whatsapp, product)}
                              disabled={!whatsapp}
                              className="text-white font-bold text-xs py-2 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                              style={{ backgroundColor: themeColor }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.filter =
                                  "brightness(1.1)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.filter = "")
                              }
                            >
                              <svg
                                className="w-4 h-4"
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

            {scrollSnaps.length > 1 && (
              <div className="flex justify-center items-center gap-2.5 mt-8">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`rounded-full transition-all duration-300 h-2.5 ${
                      index === selectedIndex
                        ? "w-8 bg-opacity-100 shadow-md"
                        : "w-2.5 bg-gray-300 hover:bg-gray-400"
                    }`}
                    style={
                      index === selectedIndex
                        ? { backgroundColor: themeColor }
                        : undefined
                    }
                    aria-label={`Ir al grupo de productos ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="#catalogo"
              className="text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
              style={{ backgroundColor: themeColor }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
            >
              Explorar productos
            </Link>
            <Link
              href={user ? "/dashboard#agregar-producto" : "/register"}
              className="bg-white font-bold text-sm px-8 py-3.5 rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center"
              style={{
                color: themeColor,
                borderColor: themeColor,
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
