import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔍</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Página no encontrada
        </h2>
        <p className="text-gray-500 mb-8">
          La página que buscás no existe o fue eliminada.
        </p>
        <Link
          href="/"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full transition-colors inline-block"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
