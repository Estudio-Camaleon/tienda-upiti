// Archivo: src/components/ProductCard.js
import { CONFIG } from "../data/config";

export default function ProductCard({ product, index, onAdd }) {
  return (
    <div
      className="product-card animate-fade-in-up opacity-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col group"
      style={{
        animationDelay: `${index * 0.05}s`,
        animationFillMode: "forwards",
      }}
    >
      <div className="relative pt-[80%] bg-gray-100 overflow-hidden">
        <img
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          src={
            product.image ||
            "https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen"
          }
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen";
          }}
        />
        {product.isStar && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-sm shadow-orange-500/30">
            ★ Estrella
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            {product.category}
          </span>
          <h4 className="font-bold text-gray-900 mt-1 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h4>
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-50">
          <span className="text-xl font-black text-gray-900">
            {CONFIG.currency}
            {/* Aseguramos que sea un número antes de formatearlo */}
            {Number(product.price).toLocaleString("es-AR")}
          </span>
          <button
            onClick={onAdd} /* Ahora sí llama a la función real */
            className="bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-800 font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-300 active:scale-[0.90] flex items-center gap-1 shadow-sm"
          >
            Añadir 🛒
          </button>
        </div>
      </div>
    </div>
  );
}
