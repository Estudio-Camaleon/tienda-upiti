// Archivo: src/context/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { CONFIG } from "../data/config";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Cargar el carrito guardado al abrir la página
  useEffect(() => {
    const savedCart = localStorage.getItem("tienda_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // 2. Guardar el carrito en la memoria del dispositivo cada vez que cambie
  useEffect(() => {
    localStorage.setItem("tienda_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prevCart, { product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.product.id === productId
            ? { ...item, qty: item.qty + delta }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const confirmOrder = () => {
    if (cart.length === 0) return;
    let total = 0;
    let message = `¡Hola! Me gustaría confirmar mi pedido:\n\n`;

    cart.forEach((item) => {
      let subtotal = Number(item.product.price) * item.qty;
      total += subtotal;
      message += `▫️ *${item.qty}x* ${item.product.name} - ${CONFIG.currency}${subtotal.toLocaleString("es-AR")}\n`;
    });

    message += `\n💰 *Total a pagar: ${CONFIG.currency}${total.toLocaleString("es-AR")}*\n\nPor favor, confirmame la disponibilidad. ¡Gracias!`;
    window.open(
      `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQty,
        confirmOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
