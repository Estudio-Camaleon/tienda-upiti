"use client";

import { useEffect } from "react";

/**
 * GlobalImageProtection — Protección global contra atajos de teclado de inspección.
 *
 * ═══════════════════════════════════════════════════
 *   TECLAS BLOQUEADAS
 * ═══════════════════════════════════════════════════
 *
 * - F12                          → Abre DevTools en Chrome/Edge/Firefox
 * - Ctrl+Shift+I (Win/Linux)     → Abre DevTools (Inspector)
 * - Cmd+Shift+I  (Mac)
 * - Ctrl+Shift+J (Win/Linux)     → Abre DevTools (Consola)
 * - Cmd+Shift+J  (Mac)
 * - Ctrl+Shift+C (Win/Linux)     → Abre DevTools (Inspeccionar elemento)
 * - Cmd+Shift+C  (Mac)
 * - Ctrl+U       (Win/Linux)     → Ver código fuente
 * - Cmd+U        (Mac)
 *
 * ═══════════════════════════════════════════════════
 *   LIMITACIONES
 * ═══════════════════════════════════════════════════
 *
 * - El usuario sigue pudiendo abrir DevTools desde:
 *   • Menú del navegador (⋮ → Más herramientas → Herramientas de desarrollo)
 *   • "Inspeccionar elemento" en clic derecho sobre cualquier elemento
 *     que NO sea una imagen (el componente ProtectedImage protege
 *     imágenes, pero el contexto global solo protege las teclas rápidas)
 *   • Atajos personalizados del navegador
 *   • Línea de comandos (chrome://inspect)
 *
 * - Es una barrera para usuarios ocasionales, no para desarrolladores.
 */
export default function GlobalImageProtection() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl/Meta + Shift + I/J/C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === "i" || key === "j" || key === "c") {
          e.preventDefault();
          return false;
        }
      }

      // Ctrl/Meta + U (ver código fuente)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
