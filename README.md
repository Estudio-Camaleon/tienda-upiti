## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## npm run dev:mobile:

Este es un salvavidas. Al agregar -H 0.0.0.0, le indicas a Next.js que exponga tu servidor local a tu red Wi-Fi. Esto te permite tomar tu celular, poner la IP de tu computadora (por ejemplo, 192.168.1.5:3000) y probar cómo se ve y funciona el carrito táctilmente antes de subirlo a internet.

## npm run lint:fix:

Ejecuta el analizador de código (ESLint) pero con la orden de arreglar automáticamente todos los problemas menores que encuentre, como variables declaradas que no usaste o errores de sintaxis.

## npm run format:

Revisa todos tus archivos dentro de la carpeta src/ y los formatea instantáneamente (arregla la indentación, los espacios, las comillas dobles/simples, etc.).

## npm run clean:

A veces Next.js guarda en caché archivos antiguos en la carpeta oculta .next. Si alguna vez notas que un cambio no se refleja en pantalla o algo se "traba", este script borra ese caché para forzar una compilación completamente limpia la próxima vez que corras npm run dev. (Nota: si usas Windows, este comando puede requerir usar Powershell o instalar la librería rimraf para que funcione correctamente).
