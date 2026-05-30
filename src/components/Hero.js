// Archivo: src/components/Hero.js
import { CONFIG } from "../data/config";

export default function Hero() {
  const handleContact = () => {
    const text = encodeURIComponent(
      "¡Hola! Tengo una consulta sobre sus productos.",
    );
    window.open(
      `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`,
      "_blank",
    );
  };

  return (
    <section
      id="hero-section"
      className="relative rounded-3xl overflow-hidden shadow-xl bg-gray-900 py-16 px-6 text-center group cursor-default"
    >
      <div
        id="hero-bg-img"
        className="hero-bg absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${CONFIG.heroImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>
      <div className="absolute inset-0 bg-black/60 z-10 transition-colors duration-500 group-hover:bg-black/50"></div>

      <div className="relative z-20 space-y-4 flex flex-col items-center animate-float">
        {/* Cambiamos a emerald-100 y emerald-800 que sí generamos dinámicamente */}
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-100 bg-emerald-800/50 px-3 py-1 rounded-md border border-emerald-500/30 backdrop-blur-sm">
          Envíos a todo el país
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white drop-shadow-lg">
          Comprá fácil y rápido
        </h2>
        <p className="text-gray-200 max-w-md mx-auto text-sm sm:text-base drop-shadow-md">
          Agregá productos a tu carrito y envianos tu pedido directamente por
          WhatsApp sin intermediarios.
        </p>

        <button
          onClick={handleContact}
          /* Separamos el tamaño de la sombra (shadow-[0_0_20px]) de su color dinámico (shadow-emerald-500/40) */
          className="mt-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 px-8 rounded-full shadow-[0_0_20px] shadow-emerald-500/40 hover:shadow-[0_0_25px] hover:shadow-emerald-500/60 flex items-center justify-center gap-3 transition-all duration-300"
        >
          Tengo una consulta
        </button>
      </div>
    </section>
  );
}
