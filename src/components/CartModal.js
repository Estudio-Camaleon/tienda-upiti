// Archivo: src/components/CartModal.js
"use client";
import { CONFIG } from "../data/config";
import { useCart } from "../context/CartContext";

export default function CartModal() {
  const { cart, isCartOpen, setIsCartOpen, updateQty, confirmOrder } =
    useCart();
  const total = cart.reduce(
    (acc, item) => acc + Number(item.product.price) * item.qty,
    0,
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${isCartOpen ? "bg-gray-900/40 backdrop-blur-sm opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className={`bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] transition-transform duration-400 cubic-bezier(0.16, 1, 0.3, 1) ${isCartOpen ? "translate-y-0" : "translate-y-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto -mt-2 mb-2 shrink-0"></div>
        <div className="flex justify-between items-center shrink-0 border-b border-gray-100 pb-4">
          <h4 className="text-xl font-black text-gray-900 flex items-center gap-2">
            Tu Carrito <span className="animate-bounce">🛒</span>
          </h4>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 bg-gray-100 rounded-full text-sm font-bold w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-4 animate-bounce">🛒</div>
              <p className="text-base font-medium text-gray-500">
                Tu carrito está vacío
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
              >
                <img
                  src={
                    item.product.image ||
                    "https://placehold.co/150x150/eeeeee/999999?text=Sin+Imagen"
                  }
                  className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                  alt={item.product.name}
                />
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
                    {item.product.name}
                  </h5>
                  <span className="text-sm text-emerald-600 font-black">
                    {CONFIG.currency}
                    {(Number(item.product.price) * item.qty).toLocaleString(
                      "es-AR",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className="w-8 h-8 rounded-lg bg-white font-bold text-gray-600 shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-6 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="w-8 h-8 rounded-lg bg-white font-bold text-gray-600 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 shrink-0 bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase">
              Total Estimado
            </span>
            <span className="text-3xl font-black text-emerald-600 transition-all duration-300">
              {CONFIG.currency}
              {total.toLocaleString("es-AR")}
            </span>
          </div>
          <button
            onClick={confirmOrder}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_10px_20px] shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center"
          >
            Pedir por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
