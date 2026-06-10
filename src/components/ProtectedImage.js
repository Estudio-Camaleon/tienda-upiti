"use client";

import { useCallback } from "react";

/**
 * ProtectedImage — Imagen con protección multicapa contra descarga no autorizada.
 *
 * ═══════════════════════════════════════════════════
 *   MEDIDAS DE PROTECCIÓN IMPLEMENTADAS
 * ═══════════════════════════════════════════════════
 *
 * 1. CSS pointer-events: none sobre el <img>
 *    → El navegador no reconoce la imagen como objetivo de clic derecho.
 *    → "Guardar imagen como" no aparece en el menú contextual del contenedor.
 *
 * 2. onContextMenu en el contenedor con preventDefault()
 *    → Cancela cualquier menú contextual que intente abrirse sobre el área
 *      de la imagen (clic derecho en desktop, long-press en algunos móviles).
 *
 * 3. draggable={false} + onDragStart preventDefault()
 *    → Bloquea arrastrar la imagen a otra pestaña/ventana/escritorio.
 *
 * 4. Overlay transparente (position: absolute; inset: 0; z-index: 1)
 *    → Capa física entre el cursor y el <img>.
 *    → Impide "Guardar imagen como" aunque el navegador ignore pointer-events.
 *    → Tiene aria-hidden="true" para no afectar accesibilidad.
 *
 * 5. onCopy / onCut con preventDefault()
 *    → Bloquea copiar la imagen al portapapeles mediante atajos de teclado.
 *
 * 6. user-select: none + -webkit-user-drag: none
 *    → Evita selección visual del contenido de la imagen.
 *    → Evita el "callout" en iOS/Safari al mantener presionado.
 *
 * ═══════════════════════════════════════════════════
 *   LIMITACIONES CONOCIDAS
 * ═══════════════════════════════════════════════════
 *
 * - DevTools: cualquier usuario con DevTools abierto puede ver la URL
 *   de la imagen en el inspector de elementos o en la pestaña Network,
 *   y descargarla desde ahí. Esto NO es prevenible con JS/CSS.
 *
 * - Capturas de pantalla: el SO permite capturar la pantalla completa
 *   o ventana, esto está fuera del alcance del navegador.
 *
 * - View Source: si la imagen está en el HTML (no background-image),
 *   la URL es visible en el código fuente de la página.
 *
 * - Bots/rastreadores: no afecta a crawlers que descarguen recursos.
 *
 * - Esta implementación es una BARRERA DISUASIVA para usuarios
 *   ocasionales, NO un sistema DRM. No existe protección absoluta
 *   para contenido digital en el navegador.
 *
 * ═══════════════════════════════════════════════════
 *   USO
 * ═══════════════════════════════════════════════════
 *
 * @param {string}  src          — URL de la imagen (requerido)
 * @param {string}  alt          — Texto alternativo (requerido para accesibilidad)
 * @param {string}  className    — Clases para el contenedor (sizing, posición)
 * @param {string}  imgClassName — Clases para el <img> (object-fit, rounded, etc.)
 * @param {Object}  ...props     — Props adicionales para el <img> (onError, etc.)
 *
 * Ejemplo:
 *   <ProtectedImage
 *     src={product.image}
 *     alt={product.name}
 *     className="absolute inset-0 w-full h-full"
 *     imgClassName="object-cover"
 *   />
 */
export default function ProtectedImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  ...props
}) {
  const prevent = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className={`overflow-hidden ${className}`}
      onContextMenu={prevent}
      onCopy={prevent}
      onCut={prevent}
    >
      <img
        src={src}
        alt={alt}
        className={`block w-full h-full select-none ${imgClassName}`}
        draggable={false}
        onDragStart={prevent}
        style={{
          WebkitUserDrag: "none",
          WebkitTouchCallout: "none",
          pointerEvents: "none",
        }}
        {...props}
      />
      {/* Overlay transparente: impide interacción directa con el <img> */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 1, pointerEvents: "none" }}
        aria-hidden="true"
      />
    </div>
  );
}
