"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { productSchema } from "../../../lib/schemas";
import { slugify, generateUniqueSlug } from "../../../lib/slug";
import { compressImage } from "../../../lib/image";
import { CATEGORIES, getCategoryFields } from "../../../data/categories";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../context/ToastContext";
import ImageUploader from "./ImageUploader";

const INPUT_CLASS = (error) =>
  `w-full px-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${
    error
      ? "border-red-400 focus:ring-red-500/20"
      : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
  }`;

export default function ProductForm({ user, onSaved, isOpen, onClose }) {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState([null, null, null, null]);
  const [specs, setSpecs] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(productSchema) });

  const selectedCategory = useWatch({ control, name: "category" });
  const categoryFields = selectedCategory
    ? getCategoryFields(selectedCategory)
    : [];

  const { onChange: catOnChange, ...catRest } = register("category");

  const onSubmit = async (data) => {
    if (!user) return;
    setUploading(true);

    const uploadedUrls = [];
    for (const rawFile of imageFiles) {
      if (!rawFile) continue;
      const file = await compressImage(rawFile, {
        maxWidth: 1200,
        quality: 0.8,
      });
      const fileName = `${user.id}/products/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);
      if (uploadError) {
        addToast("Error al subir imagen: " + uploadError.message, "error");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);
      uploadedUrls.push(urlData.publicUrl);
    }

    const productSlug = slugify(data.name) || "producto";
    const slug = await generateUniqueSlug(supabase, "products", productSlug);

    const { error: insertError } = await supabase.from("products").insert([
      {
        name: data.name,
        brand: data.brand || null,
        category: data.category,
        price: Number(data.price),
        stock:
          data.stock === "" || data.stock == null ? null : Number(data.stock),
        description: data.description || null,
        image: uploadedUrls[0] || null,
        images: uploadedUrls,
        seller_id: user.id,
        status: "pending",
        slug,
        specifications: specs,
      },
    ]);

    if (insertError) {
      addToast("Error al crear el producto: " + insertError.message, "error");
      setUploading(false);
      return;
    }

    addToast(
      "Producto enviado para revisión. El administrador lo revisará pronto.",
      "success",
    );

    const sellerName =
      user.user_metadata?.full_name || user.email || "Un vendedor";
    fetch("/api/notify-new-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: data.name,
        sellerName,
        productSlug: slug,
        price: data.price,
      }),
    }).catch(() => {});

    reset();
    setImageFiles([null, null, null, null]);
    setImagePreviews([null, null, null, null]);
    setSpecs({});
    setUploading(false);
    onSaved?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Agregar Producto
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tu producto será revisado antes de publicarse.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                id="product-form"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Nombre del producto
                  </label>
                  <input
                    id="name"
                    {...register("name")}
                    placeholder="Ej: Cartera de cuero"
                    maxLength={100}
                    className={INPUT_CLASS(errors.name)}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="brand"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Marca{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="brand"
                    {...register("brand")}
                    placeholder="Ej: Nike, Adidas"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Categoría
                  </label>
                  <select
                    id="category"
                    onChange={(e) => {
                      catOnChange(e);
                      setSpecs({});
                    }}
                    {...catRest}
                    className={INPUT_CLASS(errors.category) + " bg-white"}
                  >
                    <option value="">Seleccioná una categoría</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Precio
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                      $
                    </span>
                    <input
                      id="price"
                      type="text"
                      inputMode="decimal"
                      {...register("price")}
                      placeholder="0.00"
                      maxLength={20}
                      className={INPUT_CLASS(errors.price) + " pl-8"}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Cantidad en stock{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="stock"
                    type="text"
                    inputMode="numeric"
                    {...register("stock")}
                    placeholder="Ej: 10"
                    maxLength={10}
                    className={INPUT_CLASS(errors.stock)}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Si lo dejás vacío, no se mostrará stock. Si llega a 0,
                    aparecerá como sin stock.
                  </p>
                  {errors.stock && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.stock.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-bold text-gray-700 mb-1.5"
                  >
                    Descripción{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describí tu producto, sus materiales, medidas, colores disponibles..."
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm h-28 resize-none"
                  />
                </div>

                {categoryFields.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">
                      Especificaciones de {selectedCategory}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categoryFields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            {field.label}
                          </label>
                          {field.type === "select" ? (
                            <select
                              value={specs[field.name] || ""}
                              onChange={(e) =>
                                setSpecs((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm bg-white"
                            >
                              <option value="">Seleccionar...</option>
                              {field.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={specs[field.name] || ""}
                              onChange={(e) =>
                                setSpecs((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                              placeholder={field.placeholder || ""}
                              maxLength={100}
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ImageUploader
                  initialPreviews={null}
                  onChange={(files, previews) => {
                    setImageFiles(files);
                    setImagePreviews(previews);
                  }}
                />
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="product-form"
                  disabled={uploading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all text-sm"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Subiendo...
                    </span>
                  ) : (
                    "Enviar para revisión"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
