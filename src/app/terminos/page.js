"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Terminos() {
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
          Términos y Condiciones
        </h1>

        <div className="prose prose-gray max-w-none space-y-4 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              1. Aceptación de los términos
            </h2>
            <p>
              Al registrarte como vendedor en Upiti aceptás los presentes
              Términos y Condiciones. Si no estás de acuerdo, no podés usar la
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              2. Responsabilidades del vendedor
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Los productos publicados deben ser reales, lícitos y cumplir con
                la normativa vigente.
              </li>
              <li>
                El vendedor es el único responsable por la calidad, veracidad y
                legalidad de sus productos.
              </li>
              <li>
                Upiti actúa únicamente como intermediario y no se responsabiliza
                por las transacciones entre partes.
              </li>
              <li>
                El vendedor se compromete a responder consultas de compradores
                de forma clara y oportuna.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              3. Moderación de contenido
            </h2>
            <p>
              Todo producto publicado pasa por un proceso de moderación. Upiti
              se reserva el derecho de rechazar o eliminar cualquier producto
              que considere inapropiado, engañoso o que infrinja estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              4. Privacidad
            </h2>
            <p>
              Los datos personales proporcionados serán tratados conforme a
              nuestra Política de Privacidad. Upiti no comparte información de
              contacto con terceros sin consentimiento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              5. Baja de cuenta
            </h2>
            <p>
              El vendedor puede solicitar la eliminación de su cuenta en
              cualquier momento desde su panel de perfil. Upiti se reserva el
              derecho de suspender cuentas que violen estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
              6. Modificaciones
            </h2>
            <p>
              Upiti puede modificar estos términos en cualquier momento. Los
              cambios serán comunicados a través de la plataforma. El uso
              continuado implica la aceptación de los cambios.
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
