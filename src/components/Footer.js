import Link from "next/link";
import { CONFIG } from "../data/config";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {CONFIG.storeName}. Todos los
          derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/terminos"
            className="text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            Términos
          </Link>
          <Link
            href="/privacidad"
            className="text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            Privacidad
          </Link>
          <a
            href="https://wa.me/5493813583226"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-400 transition-colors hover:text-emerald-600"
          >
            Soporte por WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
