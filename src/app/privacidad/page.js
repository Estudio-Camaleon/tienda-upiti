"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Privacidad() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12"
      >
        <Link
          href="/register"
          className="text-sm font-bold text-emerald-600 hover:underline mb-6 inline-block"
        >
          ← Volver al registro
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-6">
          Política de Privacidad
        </h1>

        <div className="prose prose-gray max-w-none space-y-4 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              1. Datos que recopilamos
            </h2>
            <p>
              Al registrarte recopilamos tu nombre, correo electrónico, número
              de WhatsApp, provincia, ciudad, foto de perfil, y datos de tu
              emprendimiento. Estos datos son necesarios para operar la
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              2. Uso de los datos
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Tu perfil y productos son visibles para los compradores en el
                catálogo público.
              </li>
              <li>
                Tu número de WhatsApp se usa exclusivamente para que los
                compradores se contacten con vos.
              </li>
              <li>
                No compartimos tus datos con terceros sin tu consentimiento
                explícito.
              </li>
              <li>
                Usamos tu correo para enviar notificaciones relacionadas con la
                plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              3. Almacenamiento
            </h2>
            <p>
              Tus datos se almacenan en servidores seguros de Supabase
              (infraestructura AWS). Las imágenes se almacenan en buckets
              privados con acceso controlado por RLS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              4. Derechos del usuario
            </h2>
            <p>
              Podés solicitar la descarga o eliminación de tus datos en
              cualquier momento desde tu panel de perfil o contactándonos a
              soporte@upiti.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              5. Cookies
            </h2>
            <p>
              Upiti utiliza cookies esenciales para el funcionamiento de la
              plataforma (sesión de usuario). No utilizamos cookies de rastreo
              ni publicitarias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              6. Contacto
            </h2>
            <p>
              Si tenés dudas sobre esta política, escribinos a{" "}
              <a
                href="mailto:soporte@upiti.com"
                className="text-emerald-600 font-bold hover:underline"
              >
                soporte@upiti.com
              </a>
              .
            </p>
          </section>

          <p className="text-xs text-gray-400 mt-8">
            Última actualización: junio 2026.
          </p>
        </div>
      </motion.article>
    </main>
  );
}
