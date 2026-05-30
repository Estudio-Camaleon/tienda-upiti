// Archivo: src/data/config.js

export const CONFIG = {
  storeName: "ExpressShop",
  whatsappNumber: "5491123456789", // Reemplaza con tu número
  currency: "$",
  heroImage:
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070",

  // Pega aquí el array completo de tus 24 productos
  products: [
    {
      id: 1,
      name: "Auriculares Pro Wireless",
      category: "Tecnología",
      price: 49900,
      description:
        "Cancelación de ruido activa, resistencia al sudor y hasta 30 horas de autonomía total.",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      isStar: true,
    },
    // ... agrega el resto de los productos aquí
  ],
};
