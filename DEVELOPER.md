# Guía para desarrolladores — Upiti

## Requisitos previos

- **Node.js** >= 18
- **npm**
- **Git**
- Una cuenta de **Supabase** con proyecto creado

## Clonar e inicializar

```bash
git clone <repo-url>
cd upiti
npm install
```

## Variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STORE_NAME=Upiti
NEXT_PUBLIC_WHATSAPP_NUMBER=549381xxxxxx
NEXT_PUBLIC_CURRENCY=$
NEXT_PUBLIC_MAIN_COLOR=#ed355d
```

> No committear `.env.local`. El archivo está en `.gitignore`.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run dev:mobile` | Expóne en LAN (192.168.x.x:3000) para probar en celular |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint con auto-fix |
| `npm run format` | Prettier |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run validate` | lint + format:check + typecheck |
| `npm run clean` | Borra `.next/` (caché) |

## Estructura del proyecto

```
upiti/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── page.js             # Home (listado de productos + Hero)
│   │   ├── login/page.js       # Inicio de sesión
│   │   ├── register/page.js    # Registro multi-step
│   │   ├── dashboard/
│   │   │   ├── page.js         # Panel vendedor / admin / add product
│   │   │   └── perfil/page.js  # Editar perfil
│   │   ├── producto/[slug]/page.js   # Detalle público de producto
│   │   ├── vendedor/[slug]/page.js   # Perfil público de vendedor
│   │   ├── terminos/page.js    # Términos y condiciones
│   │   ├── privacidad/page.js  # Política de privacidad
│   │   └── api/
│   │       └── check-confirmation/route.js  # Endpoint para polling de confirmación
│   ├── components/             # Componentes reutilizables
│   │   ├── EmailConfirmationScreen.js
│   │   └── ...
│   ├── lib/                    # Utilidades, cliente Supabase, schemas
│   │   ├── supabase.js         # Cliente Supabase (browser)
│   │   ├── supabaseAdmin.js    # Cliente con service_role (server-only)
│   │   ├── schemas.js          # Schemas Zod
│   │   └── phone.js            # Utilidades de teléfono
│   └── ...
├── supabase/
│   └── migrations/             # Migraciones SQL de base de datos (001 a 012)
├── public/                     # Archivos estáticos
├── .husky/                     # Pre-commit hooks (lint-staged)
├── eslint.config.mjs
├── next.config.mjs
├── tailwind.config.js          # (no existe — Tailwind v4 no necesita)
├── postcss.config.mjs
├── jsconfig.json               # Alias @/ → ./src/*
├── tsconfig.json               # Solo para type-check
├── package.json
├── AGENTS.md                   # Guía para asistentes IA
└── DEVELOPER.md                # Este archivo
```

## Convenciones importantes

- **Todas las páginas llevan `"use client"`**, incluso las que podrían ser Server Components.
- **No usar `next/image`**, usar siempre `<img>` (regla `@next/next/no-img-element` deshabilitada).
- **Alias `@/`** disponible para rutas, aunque la mayoría del código usa rutas relativas.
- **Inputs de texto**: siempre con `maxLength` + Zod `.max()` + `.trim()`.
- **React Compiler** habilitado (`reactCompiler: true` en `next.config.mjs`).

## Base de datos (Supabase)

### Migraciones

Todas en `supabase/migrations/` con prefijo numérico (`001_*` a `012_*`). Aplicar en orden desde el SQL Editor de Supabase.

### Tablas principales

| Tabla | Descripción |
|---|---|
| `profiles` | Datos de perfil de cada usuario (vendedor) |
| `products` | Productos publicados por vendedores |
| `reviews` | Reseñas de compradores a vendedores |
| `store_config` | Configuración general de la tienda |

### Roles

- **Admin** — acceso completo al panel de administración.
- **Vendedor** — acceso a su propio dashboard, productos y perfil.

Asignar rol admin vía SQL:
```sql
UPDATE public.profiles SET role = 'admin', is_verified = true WHERE email = '...';
```

### WhatsApp

Almacenado en 3 columnas separadas:
- `whatsapp_region` (código de país)
- `whatsapp_area` (código de área)
- `whatsapp_number_local` (número local)

Concatenar con `concatParts()` de `src/lib/phone.js`.

### Imágenes / Archivos

Buckets en Supabase Storage:
- `avatars` — fotos de perfil
- `products` — imágenes de productos
- `banners` — banners de tienda

## Flujo de registro y confirmación de email

1. Usuario completa formulario y hace `signUp` en Supabase Auth.
2. Si `email confirmation` está habilitado, se muestra `EmailConfirmationScreen`.
3. La pantalla de espera detecta confirmación por 3 vías en paralelo:
   - **`onAuthStateChange`** (misma pestaña / mismo navegador cross-tab)
   - **`getSession()` polling** cada 3 segundos (mismo navegador)
   - **Server-side polling** a `/api/check-confirmation` cada 5 segundos (cross-device)
4. Al detectar confirmación → redirige a `/login?confirmed=true`.
5. El usuario ingresa sus credenciales manualmente (nunca auto-login).
6. Timeout de 5 minutos con sugerencias si no confirma.

## Flujo de trabajo (git)

- **Rama principal**: `main`
- **Commits**: mensajes en español, cortos y descriptivos.
- **Pre-commit hooks**: Husky ejecuta `lint-staged` (ESLint + Prettier) automáticamente.
- Antes de commitear, verificar:
  ```bash
  git status
  git diff
  npm run build   # debe pasar sin errores
  ```

## Build y deploy

- Build local:
  ```bash
  npm run build
  ```
- Deploy en Vercel (desde el equipo autorizado):
  ```bash
  npx vercel          # preview
  npx vercel --prod   # producción
  ```

> No hay tests automatizados. Verificar manualmente antes de hacer deploy.

## Resolución de problemas comunes

- **Cambios no se reflejan en pantalla** → `npm run clean && npm run dev`
- **Error de ESLint en commit** → `npm run lint:fix` para auto-corregir
- **Type error en build** → `npm run typecheck` para diagnosticar
- **Rate limit en Supabase Auth** → ajustar en Supabase Dashboard → Authentication → Settings → Rate limits
