"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../lib/schemas";
import { supabase } from "../lib/supabase";
import { useToast } from "../context/ToastContext";
import { CATEGORIES, getCategoryFields } from "../data/categories";

const SLOT_LABELS = [
  { index: 0, label: "Foto 1", hint: "Principal" },
  { index: 1, label: "Foto 2", hint: "Opcional" },
  { index: 2, label: "Foto 3", hint: "Opcional" },
  { index: 3, label: "GIF", hint: "Opcional" },
];

export default function ProductEditModal({
  product,
  isOpen,
  onClose,
  onSaved,
}) {
  const { addToast } = useToast();
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState(() => {
    if (!product) return [null, null, null, null];
    const existing = product.images || [];
    const p = [null, null, null, null];
    for (let i = 0; i < Math.min(existing.length, 4); i++) p[i] = existing[i];
    return p;
  });
  const [uploading, setUploading] = useState(false);
  const [specs, setSpecs] = useState(() => product?.specifications || {});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      brand: product?.brand || "",
      category: product?.category || "",
      price: product?.price?.toString() || "",
      description: product?.description || "",
    },
  });

  const watchedCategory = product?.category || "";
  const categoryFields = getCategoryFields(watchedCategory);

  const handleFileSelect = (index, file) => {
    if (!file) return;
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles[index] = file;
    newPreviews[index] = URL.createObjectURL(file);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleRemove = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles[index] = null;
    newPreviews[index] = null;
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const onSubmit = async (data) => {
    if (!product) return;
    setUploading(true);

    // Build final images array: keep existing URLs + upload new files
    const finalImages = [];

    for (let i = 0; i < 4; i++) {
      const preview = imagePreviews[i];
      if (!preview) continue;

      if (imageFiles[i]) {
        // This is a new file to upload
        const file = imageFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${product.seller_id}/products/${crypto.randomUUID()}.${fileExt}`;
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
        finalImages.push(urlData.publicUrl);
      } else {
        // Keep existing URL (already uploaded)
        finalImages.push(preview);
      }
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: data.name,
        brand: data.brand || null,
        category: data.category,
        price: Number(data.price),
        description: data.description || null,
        image: finalImages[0] || product.image || null,
        images: finalImages,
        specifications: specs,
      })
      .eq("id", product.id);

    if (updateError) {
      addToast("Error al actualizar: " + updateError.message, "error");
      setUploading(false);
      return;
    }

    addToast("Producto actualizado correctamente.", "success");
    setUploading(false);
    onSaved();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                <h3 className="text-lg font-black text-gray-900">
                  Editar Producto
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
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

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Nombre del producto
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Ej: Cartera de cuero"
                    maxLength={100}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${
                      errors.name
                        ? "border-red-400 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Marca{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    {...register("brand")}
                    placeholder="Ej: Nike, Adidas"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Categoría
                  </label>
                  <select
                    {...register("category")}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm bg-white transition-shadow focus:ring-2 ${
                      errors.category
                        ? "border-red-400 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
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
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Precio
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border outline-none text-sm transition-shadow focus:ring-2 ${
                        errors.price
                          ? "border-red-400 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Descripción{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    {...register("description")}
                    placeholder="Describí tu producto, sus materiales, medidas, colores disponibles..."
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 text-sm h-28 resize-none"
                  />
                </div>

                {categoryFields.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">
                      Especificaciones de {watchedCategory}
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Imágenes del producto
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Subí hasta 3 fotos y opcionalmente un GIF. Dejá vacío para
                    mantener la imagen actual.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {SLOT_LABELS.map((slot) => (
                      <div
                        key={slot.index}
                        className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 min-h-[130px] transition-colors cursor-pointer hover:bg-gray-50 ${
                          imagePreviews[slot.index]
                            ? "border-emerald-300 bg-emerald-50/30"
                            : "border-gray-200"
                        }`}
                        onClick={() => {
                          document
                            .getElementById(`edit-img-upload-${slot.index}`)
                            .click();
                        }}
                      >
                        {imagePreviews[slot.index] ? (
                          <>
                            <img
                              src={imagePreviews[slot.index]}
                              alt=""
                              className="w-full h-full absolute inset-0 object-cover rounded-xl"
                            />
                            {imagePreviews[slot.index]
                              .toLowerCase()
                              .endsWith(".gif") && (
                              <span className="absolute top-1 left-1 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full z-10">
                                GIF
                              </span>
                            )}
                          </>
                        ) : (
                          <svg
                            className="w-8 h-8 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        <span
                          className={`text-xs font-bold z-10 ${
                            imagePreviews[slot.index]
                              ? "text-white bg-black/50 px-2 py-0.5 rounded-full"
                              : "text-gray-500"
                          }`}
                        >
                          {slot.label}
                        </span>
                        {!imagePreviews[slot.index] && (
                          <span className="text-[10px] text-gray-400">
                            {slot.hint}
                          </span>
                        )}
                        <input
                          id={`edit-img-upload-${slot.index}`}
                          type="file"
                          accept={
                            slot.index === 3 ? ".gif,image/gif" : "image/*"
                          }
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(slot.index, file);
                          }}
                        />
                        {imagePreviews[slot.index] && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-10 hover:bg-red-600 transition-colors shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(slot.index);
                            }}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all text-sm"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
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
                        Guardando...
                      </span>
                    ) : (
                      "Guardar cambios"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
