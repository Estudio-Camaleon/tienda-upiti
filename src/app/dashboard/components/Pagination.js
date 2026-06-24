"use client";

import { useMemo } from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const safePage = Math.min(currentPage, totalPages);

  const pages = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2,
      ),
    [totalPages, safePage],
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
        disabled={safePage <= 1}
        className="px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        ← Anterior
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p, idx, arr) => (
          <span key={`page-${p}`} className="flex items-center">
            {idx > 0 && arr[idx - 1] !== p - 1 && (
              <span
                key={`ellipsis-${p}`}
                className="px-1 text-gray-300 text-sm"
              >
                ...
              </span>
            )}
            <button
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                p === safePage
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          </span>
        ))}
      </div>
      <button
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        disabled={safePage >= totalPages}
        className="px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Siguiente →
      </button>
    </div>
  );
}
