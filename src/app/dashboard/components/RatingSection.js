"use client";

import StarBar from "./StarBar";

const MAX_RATING = 5.5;

export default function RatingSection({ reviews }) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (counts[r.rating] !== undefined) counts[r.rating]++;
  });
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const pct = total > 0 ? (avg / MAX_RATING) * 100 : 0;

  if (total === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        Calificaciones
      </h3>
      <div className="flex items-end gap-6 mb-5">
        <div className="text-center">
          <p className="text-4xl font-black text-gray-900">{avg.toFixed(1)}</p>
          <p className="text-xs text-gray-400">/ {MAX_RATING.toFixed(1)}</p>
        </div>
        <div className="flex-1">
          <StarBar value={avg} />
          <p className="text-xs text-gray-500 mt-1">
            {pct.toFixed(1)}% positivo &bull; {total} reseña
            {total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const starPct = total > 0 ? (counts[star] / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-bold text-gray-600 text-right">
                {star}
              </span>
              <svg
                className="w-3.5 h-3.5 text-amber-400 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full"
                    style={{ width: `${starPct}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-gray-400">
                {starPct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
