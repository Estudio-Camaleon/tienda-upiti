"use client";

import { useState } from "react";
import ProtectedImage from "../../../components/ProtectedImage";

const SLOTS = [
  { index: 0, label: "Foto 1", required: true, hint: "Principal" },
  { index: 1, label: "Foto 2", required: false, hint: "Opcional" },
  { index: 2, label: "Foto 3", required: false, hint: "Opcional" },
  { index: 3, label: "GIF", required: false, hint: "Opcional" },
];

export default function ImageUploader({ initialPreviews, onChange }) {
  const [files, setFiles] = useState([null, null, null, null]);
  const [previews, setPreviews] = useState(
    () => initialPreviews || [null, null, null, null],
  );

  const handleSelect = (index, file) => {
    if (!file) return;
    const newFiles = [...files];
    const newPreviews = [...previews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newFiles[index] = file;
    newPreviews[index] = URL.createObjectURL(file);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange?.(newFiles, newPreviews);
  };

  const handleRemove = (index) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newFiles[index] = null;
    newPreviews[index] = null;
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange?.(newFiles, newPreviews);
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-3">
        Imágenes del producto
      </label>
      <p className="text-xs text-gray-400 mb-3">
        Subí hasta 3 fotos y opcionalmente un GIF. Primera foto = principal.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {SLOTS.map((slot) => (
          <div
            key={slot.index}
            className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 min-h-[130px] transition-colors cursor-pointer hover:bg-gray-50 ${
              previews[slot.index]
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-gray-200"
            }`}
            onClick={() => {
              document.getElementById(`img-upload-${slot.index}`)?.click();
            }}
          >
            {previews[slot.index] ? (
              <ProtectedImage
                src={previews[slot.index]}
                alt=""
                className="w-full h-full absolute inset-0"
                imgClassName="object-cover rounded-xl"
              />
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
                previews[slot.index]
                  ? "text-white bg-black/50 px-2 py-0.5 rounded-full"
                  : "text-gray-500"
              }`}
            >
              {slot.label}
              {slot.required && <span className="text-red-400 ml-0.5">*</span>}
            </span>
            {!previews[slot.index] && (
              <span className="text-[10px] text-gray-400">{slot.hint}</span>
            )}
            <input
              id={`img-upload-${slot.index}`}
              type="file"
              accept={slot.index === 3 ? ".gif,image/gif" : "image/*"}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSelect(slot.index, file);
                e.target.value = "";
              }}
            />
            {previews[slot.index] && (
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
  );
}
