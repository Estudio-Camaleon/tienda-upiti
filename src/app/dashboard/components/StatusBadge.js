"use client";

const statusStyles = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status, reason }) {
  return (
    <span
      title={reason || ""}
      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyles[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status === "approved"
        ? "Aprobado"
        : status === "pending"
          ? "Pendiente"
          : "Rechazado"}
    </span>
  );
}
