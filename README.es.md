[English](README.md) | **Español**

# Medical Web

[![CI](https://github.com/pablobonillaq/medical-web/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/pablobonillaq/medical-web/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=pablobonillaq_medical-web&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=pablobonillaq_medical-web)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=pablobonillaq_medical-web&metric=coverage)](https://sonarcloud.io/summary/new_code?id=pablobonillaq_medical-web)

Cliente web de [Medical API](https://github.com/pablobonillaq/medical-api): agenda de citas, expediente clínico, archivos y chat con la recepción de la clínica, para pacientes, médicos, recepción y administradores. Accesible, en español e inglés, con tema claro y oscuro.

> **Estado:** en desarrollo. Fases 1 a 5 completadas (configuración base, sistema de diseño, idiomas y estructura, capa de datos, autenticación); Fase 6 (páginas públicas) en curso: páginas de servicios y médicos listas.
> Proyecto de portfolio. Todos los datos de prueba son **ficticios**.

## Funcionalidades

- [x] Tema claro, oscuro o el del sistema, sin parpadeo al cargar
- [ ] Librería de componentes con variantes tipadas, documentada en Storybook
- [x] Español e inglés (`/es`, `/en`), con el idioma elegido según el navegador o la última visita
- [x] Inicio de sesión, registro de pacientes y cierre de sesión; rutas protegidas por rol desde el servidor; aviso antes de que venza la sesión
- [ ] Páginas públicas: inicio, servicios y médicos
- [ ] Pacientes: reservar, cancelar, reprogramar y confirmar citas; ver quién abrió su expediente
- [ ] Recepción: búsqueda de pacientes, pacientes sin cuenta, reservas para un paciente, agenda del día
- [ ] Médicos: agenda, horario semanal y días libres, asistencia
- [ ] Expediente clínico: antecedentes, notas SOAP con correcciones, archivos
- [ ] Chat en tiempo real entre pacientes y recepción
- [ ] Administración: usuarios, servicios, médicos y registro de auditoría
- [ ] Accesibilidad: con WCAG 2.2 AA como meta (ver [Accesibilidad](#accesibilidad))

## Tecnologías

- **Framework:** Next.js 16 (App Router, Cache Components), React 19, TypeScript
- **Estilos:** Tailwind CSS 4, con tokens de diseño en variables CSS
- **Idiomas:** rutas internacionalizadas de Next.js (`app/[lang]`, `next/root-params`, Proxy) y diccionarios tipados, sin librería de i18n
- **Estado:** Redux Toolkit (un store por carga de página, hooks tipados, thunks) y redux-saga para los flujos de larga duración
- **Validación:** Zod
- **Pruebas:** Vitest, Testing Library, MSW (API simulada), redux-saga-test-plan y cobertura con V8; Playwright con axe en Chromium, Firefox, WebKit y una vista de celular; Lighthouse CI
- **Calidad de código:** ESLint y Prettier
- **CI:** GitHub Actions y SonarQube Cloud
- **Librería de componentes:** class-variance-authority y tailwind-merge, documentada en Storybook con revisiones de accesibilidad (axe)

## Requisitos

- Node.js 22 o posterior
- npm
- [Medical API](https://github.com/pablobonillaq/medical-api) corriendo en local (puerto 3000)

## Instalación

```bash
git clone <url-del-repositorio>
cd medical-web
npm install
cp .env.example .env   # API_URL apunta a la API en el puerto 3000
npm run dev
```

Abre `http://localhost:3001`: redirige a `/es` o `/en` (ver [Idiomas](#idiomas)). La API se queda en el puerto 3000, así que las dos corren al mismo tiempo.

El navegador nunca llama a la API directamente: el servidor de Next.js reenvía las peticiones a `/api/...` hacia `API_URL` (por ejemplo, `/api/health` → `http://localhost:3000/health`). Web y API comparten un solo origen, así que no hace falta CORS y la cookie httpOnly de sesión de la API funciona tal cual.

## Variables de entorno

| Variable  | Descripción                                                                  | Ejemplo                 |
| --------- | ---------------------------------------------------------------------------- | ----------------------- |
| `API_URL` | Dónde corre la API de Express. Solo la usa el servidor de Next.js (`/api/*`) | `http://localhost:3000` |

Las variables se validan con Zod al iniciar la app (`src/config/env.ts`): un valor incorrecto la detiene con un mensaje claro.

## Scripts

| Comando                   | Descripción                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`             | Inicia el servidor de desarrollo en el puerto 3001                                           |
| `npm run build`           | Genera el build de producción                                                                |
| `npm start`               | Sirve el build de producción en el puerto 3001                                               |
| `npm run typecheck`       | Genera los tipos de las rutas y revisa los tipos                                             |
| `npm run lint`            | Revisa el código con ESLint                                                                  |
| `npm run format`          | Formatea el código con Prettier (y ordena las clases de Tailwind)                            |
| `npm run check`           | Ejecuta typecheck, lint, la revisión de formato y las pruebas                                |
| `npm test`                | Ejecuta las pruebas                                                                          |
| `npm run test:watch`      | Ejecuta las pruebas en modo watch                                                            |
| `npm run test:coverage`   | Ejecuta las pruebas y genera el reporte de cobertura (`coverage/`)                           |
| `npm run test:e2e`        | Genera el build y ejecuta las pruebas end-to-end con Playwright                              |
| `npm run test:e2e:ui`     | Abre la interfaz de Playwright para correr y depurar pruebas e2e                             |
| `npm run lighthouse`      | Corre Lighthouse CI sobre el build de producción (antes `npm run build`)                     |
| `npm run fake-api`        | Inicia un sustituto de la API en el puerto 3000 (salud, registro, inicio y cierre de sesión) |
| `npm run storybook`       | Abre Storybook en el puerto 6006                                                             |
| `npm run build-storybook` | Genera el sitio estático de Storybook (`storybook-static/`)                                  |

## Pruebas

Las pruebas usan **Vitest** con **Testing Library** y están junto al código que prueban (`*.test.ts(x)`). Los componentes se buscan por su rol y su nombre accesible, igual que los encuentra un lector de pantalla. Las peticiones a la API las responde **MSW** (`mocks/`), que intercepta `fetch` con respuestas con la misma forma que la API real; una petición sin respuesta hace fallar la prueba, así ninguna prueba llega a un servidor real.

La cobertura se mantiene en **100 %** de líneas, ramas, funciones y sentencias, y `npm run test:coverage` falla si alguna baja. Los Server Components `async` se esperan con `await` y se renderiza su resultado, con `next/root-params` y `next/navigation` simulados. Se mantienen delgados (cargan datos y pasan props), y la lógica vive en funciones y componentes que sí se pueden probar (ver [ADR 0004](docs/adr/0004-testing-strategy.md)).

### Pruebas end-to-end y de accesibilidad

Lo que jsdom no puede revisar corre en navegadores reales con **Playwright** (`e2e/`), contra el build de producción: las redirecciones del Proxy, el estado 404, el foco real del teclado, el tema antes del primer pintado y el diseño a 320 px de ancho. Además, **axe** revisa cada página con las reglas A y AA de WCAG 2.2, en los dos temas y los dos idiomas. Corren en Chromium, Firefox, WebKit (el motor de Safari) y una vista de celular.

```bash
npx playwright install   # una vez: descarga los navegadores
npm run test:e2e         # genera el build, lo inicia en el puerto 3001 y corre las pruebas
```

Playwright también inicia un sustituto de la API de Express en el puerto 3000 (`scripts/fake-api.mjs`), así las pruebas no necesitan base de datos. Siempre es este sustituto, con su cuenta ficticia, así que el puerto 3000 debe estar libre (detén antes la API real). Si `npm run dev` ya está corriendo en el puerto 3001, las pruebas lo usan en lugar de generar el build. El reporte HTML queda en `playwright-report/` (`npx playwright show-report`).

### Lighthouse

**Lighthouse CI** mide `/es`, `/en`, `/es/services` y `/es/doctors` sobre el build de producción, tres veces cada una, y falla si una puntuación baja del mínimo (`lighthouserc.json`): accesibilidad **100**, buenas prácticas 95, SEO 90 y rendimiento 90 (la ejecución mediana, con un perfil de celular con red y CPU limitadas). La página 404 queda fuera a propósito: Lighthouse baja el SEO de cualquier página que responde 404.

```bash
npm run build
npm run fake-api     # en otra terminal, si la API real no está corriendo
npm run lighthouse   # reportes en .lighthouseci/reports/
```

### Integración continua

En cada push a `master` y en cada pull request, [GitHub Actions](.github/workflows/ci.yml) ejecuta la revisión de tipos, ESLint, la revisión de Prettier, las pruebas con cobertura y el build de producción. Otros dos jobs corren en paralelo: las pruebas end-to-end, que suben el reporte de Playwright, y Lighthouse CI, que imprime un enlace a cada reporte. Después envía el reporte de cobertura a **SonarQube Cloud**, que evalúa el Quality Gate.

## Librería de componentes

Los componentes están en `src/components/ui/`. Cada uno tiene variantes tipadas y sus historias en Storybook, con un selector de tema claro y oscuro en la barra y un panel de accesibilidad que ejecuta axe en cada historia.

**Storybook:** https://pablobonillaq.github.io/medical-web/ (se publica en cada push a `master`).

```bash
npm run storybook   # http://localhost:6006
```

## Idiomas

Cada página vive bajo `/es` o `/en`, así que cada idioma tiene su propia URL, que se puede compartir e indexar. Una URL sin idioma (`/`, `/citas`) la redirige el Proxy (`src/proxy.ts`), conservando el resto de la ruta y la query:

1. al idioma usado la última vez, guardado en la cookie `locale`;
2. si no hay, al idioma del navegador (`Accept-Language`);
3. si no coincide ninguno, a español.

Los textos están en diccionarios tipados (`src/i18n/dictionaries/`). El español es la referencia y el inglés debe tener las mismas claves, lo que revisan TypeScript y una prueba. Se leen en el servidor, así que no agregan JavaScript al navegador; los client components reciben sus textos como props. `<html lang>` sigue a la URL, y el selector de idioma marca el nombre de cada idioma con su propio `lang`, para que los lectores de pantalla lo pronuncien bien.

## Accesibilidad

La meta es **WCAG 2.2 nivel AA**. Los tokens de color tienen pruebas: cada color de texto tiene al menos 4.5:1 de contraste y cada borde y anillo de foco 3:1, en los dos temas (`src/app/globals.test.ts`). Cada funcionalidad se considera terminada solo cuando:

- se puede usar solo con el teclado, con el foco visible;
- usa HTML semántico (regiones, encabezados, etiquetas; cada página tiene encabezado, región `main` y pie) y anuncia los cambios con `aria-live` donde hace falta;
- su contraste pasa en los dos temas y respeta `prefers-reduced-motion`;
- pasan sus revisiones automáticas de accesibilidad (axe), en Storybook y en las pruebas end-to-end.

## Estructura del proyecto

```
.github/
└── workflows/
    ├── ci.yml             # CI: tipos, lint, formato, pruebas, build, Storybook, SonarQube, e2e, Lighthouse
    └── storybook.yml      # publica Storybook en GitHub Pages
.storybook/                # Storybook: Vite con Tailwind, selector de tema, revisiones de accesibilidad
docs/
└── adr/                   # registros de decisiones de arquitectura
e2e/                       # pruebas end-to-end y de axe con Playwright
mocks/                     # API simulada para las pruebas (MSW)
scripts/
└── fake-api.mjs           # sustituto de la API en las pruebas e2e y Lighthouse CI (salud, autenticación, servicios, médicos)
src/
├── api/
│   └── client.ts          # fetch para /api: JSON de ida y vuelta, errores como ApiError
├── auth/
│   ├── constants.ts       # el nombre de la cookie de sesión
│   ├── guard.ts           # requireSession(): sin sesión → iniciar sesión, otro rol → 403
│   ├── login-schema.ts    # las reglas de inicio de sesión de la API, revisadas antes de enviar
│   ├── register-schema.ts # las reglas de registro de la API, revisadas antes de enviar
│   ├── redirect.ts        # a dónde ir después de iniciar sesión, nunca fuera del sitio
│   ├── protected-paths.ts # las páginas que necesitan sesión, para el Proxy
│   ├── session.ts         # getSession(): quién inició sesión, preguntado a la API en el servidor
│   ├── token.ts           # cuándo vence el token de la sesión
│   └── types.ts           # roles, SessionUser y Session
├── catalog/
│   └── catalog.ts         # los servicios y médicos de la clínica, leídos de la API y en caché para todos
├── app/                   # rutas (App Router)
│   ├── globals.css        # Tailwind y tokens de diseño (colores con light-dark())
│   ├── globals.test.ts    # revisa el contraste WCAG de cada par de colores, en los dos temas
│   └── [lang]/            # todas las páginas, bajo /es o /en
│       ├── [...rest]/     # cualquier dirección que no sea una página: un 404
│       ├── account/       # mi cuenta (protegida)
│       ├── forbidden.tsx  # página 403, para un rol que no puede ver una página
│       ├── layout.tsx     # layout raíz: <html lang>, encabezado, región principal, pie, avisos
│       ├── login/         # página de inicio de sesión
│       ├── register/      # página de registro de pacientes
│       ├── doctors/       # los médicos de la clínica, con filtro por servicio (pública)
│       ├── services/      # los servicios de la clínica (pública)
│       ├── not-found.tsx  # página 404, dentro del layout y en el idioma de la URL
│       └── page.tsx       # página de inicio
├── components/
│   ├── account-details.tsx # correo y rol de quien inició sesión, detrás de requireSession
│   ├── account-area.tsx   # la cuenta en el encabezado: quién inició sesión, detrás de <Suspense>
│   ├── account-menu.tsx   # correo, rol y el botón para cerrar sesión
│   ├── inline-script.tsx  # script que corre antes del primer pintado, sin el aviso de React
│   ├── language-switcher.tsx # enlaces a la misma página en cada idioma
│   ├── main-nav.tsx       # las secciones públicas del sitio, marcando la actual
│   ├── login-form.tsx     # formulario de inicio de sesión: errores junto a cada campo, fallas anunciadas
│   ├── register-form.tsx  # formulario de registro de pacientes, inicia sesión al crear la cuenta
│   ├── doctor-directory.tsx # los médicos en tarjetas, con un filtro por servicio en la URL
│   ├── api-status.tsx     # si el servicio está disponible, en el pie
│   ├── site-footer.tsx    # pie de cada página
│   ├── session-expiry-dialog.tsx # avisa antes de que venza la sesión, y cuando venció
│   ├── session-watcher.tsx # le pasa al store cuándo vence la sesión
│   ├── service-list.tsx   # los servicios en tarjetas, o un aviso si la API no responde
│   ├── sign-in-link.tsx   # enlace para iniciar sesión que regresa a la página actual
│   ├── site-header.tsx    # encabezado de cada página: enlace al inicio, cuenta, tema e idioma
│   ├── theme-switcher.tsx # claro, oscuro o sistema, con botones de radio nativos
│   └── ui/                # librería de componentes
│       ├── alert.tsx      # mensajes de información, éxito, aviso y error, anunciados cuando hace falta
│       ├── badge.tsx      # etiquetas cortas, como el estado de una cita
│       ├── button.tsx     # variantes, tamaños y un estado de carga accesible
│       ├── card.tsx       # tarjeta con un título cuyo nivel de encabezado se ajusta a la página
│       ├── checkbox.tsx   # casilla cuyo texto también forma parte del área de clic
│       ├── dialog.tsx     # <dialog> modal nativo: encierra el foco, Escape, devuelve el foco
│       ├── field.tsx      # etiqueta, ayuda y error ligados a cada control (ids, aria-describedby)
│       ├── input.tsx      # campo de texto
│       ├── select.tsx     # lista de opciones nativa
│       ├── skeleton.tsx   # marcador mientras carga el contenido
│       ├── table.tsx      # tabla de datos nombrada por su título, desplazable con el teclado
│       ├── tabs.tsx       # pestañas WAI-ARIA: flechas, Inicio y Fin
│       ├── textarea.tsx   # texto de varias líneas
│       ├── toast.tsx      # avisos breves anunciados por regiones en vivo; los errores esperan a que se cierren
│       ├── skip-link.tsx  # "saltar al contenido principal", la primera parada del teclado
│       └── visually-hidden.tsx # texto solo para lectores de pantalla
├── config/
│   ├── env.ts             # variables de entorno validadas con Zod
│   └── rewrites.ts        # reenvía /api/* a la API de Express
├── i18n/
│   ├── config.ts          # idiomas disponibles, idioma por defecto y nombre de la cookie
│   ├── dictionaries/      # textos por idioma (es es la referencia)
│   ├── dictionaries.ts    # idioma y textos de la página actual, en el servidor
│   └── negotiate.ts       # elige el idioma con la cookie y Accept-Language
├── lib/
│   ├── cn.ts              # une clases y resuelve los choques de Tailwind
│   ├── use-focus-first-invalid.ts # mueve el foco al primer campo con error
│   └── use-hydrated.ts    # si React ya hidrató la página
├── store/
│   ├── api-health-saga.ts # revisa la API cada minuto, espera más tras fallas, se pausa en pestañas ocultas
│   ├── api-status-slice.ts # si la API responde, con el thunk checkApiHealth
│   ├── hooks.ts           # useAppDispatch, useAppSelector y useAppStore tipados
│   ├── session-expiry-saga.ts # cuenta regresiva al vencimiento: primero el aviso, luego el fin
│   ├── session-expiry-slice.ts # cuándo vence la sesión y si el aviso está abierto
│   ├── session-slice.ts   # quién inició sesión, con los thunks signIn, signUp y signOut
│   ├── store-provider.tsx # crea el store una vez por carga de página e inicia las sagas
│   └── store.ts           # makeStore (thunks y sagas) y los tipos RootState y AppDispatch
└── theme/
    ├── theme.ts           # leer, guardar y aplicar el tema, y el script que corre antes de pintar
    └── use-theme.ts       # hook de React, sincronizado entre pestañas
src/proxy.ts               # agrega el idioma a la URL; las páginas protegidas sin sesión van a iniciar sesión
next.config.ts             # configuración de Next.js (Cache Components, rewrites)
lighthouserc.json          # páginas y puntuaciones mínimas de Lighthouse CI
playwright.config.ts       # navegadores y servidor de las pruebas end-to-end
vitest.config.mts          # pruebas unitarias y el umbral de 100 % de cobertura
```

## Decisiones de arquitectura

Están escritas en inglés, como el código.

| ADR                                                          | Decisión                                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [0001](docs/adr/0001-nextjs-app-router.md)                   | Next.js App Router con Cache Components, en el mismo origen que la API                    |
| [0002](docs/adr/0002-tailwind-component-library.md)          | Librería de componentes con Tailwind y variantes tipadas, sin styled-components           |
| [0003](docs/adr/0003-redux-thunks-and-sagas.md)              | Redux Toolkit: thunks para peticiones, sagas para flujos largos                           |
| [0004](docs/adr/0004-testing-strategy.md)                    | Estrategia de pruebas y 100 % de cobertura                                                |
| [0005](docs/adr/0005-i18n-without-a-library.md)              | Español e inglés con las rutas de Next.js y diccionarios tipados, sin librería            |
| [0006](docs/adr/0006-session-from-the-api-cookie.md)         | Sesión: la cookie httpOnly de la API, leída en el servidor con una capa de acceso a datos |
| [0007](docs/adr/0007-public-catalog-cached-on-the-server.md) | Catálogo público: leído de la API en el servidor y guardado en caché con `use cache`      |

## Roadmap

1. ~~Configuración base: Next.js, Prettier, Vitest con 100 % de cobertura, CI y SonarQube, conexión con la API~~ ✅
2. ~~Sistema de diseño: tokens, temas claro y oscuro, librería de componentes, Storybook~~ ✅
3. ~~Idiomas y estructura: español e inglés, layout, Playwright con axe, Lighthouse CI~~ ✅
4. ~~Capa de datos: store de Redux Toolkit, cliente de la API, thunks, sagas y MSW~~ ✅
5. ~~Autenticación: inicio de sesión, registro, cierre de sesión, rutas protegidas por rol, vencimiento de sesión~~ ✅ (la navegación por rol crece con cada área)
6. Páginas públicas: inicio, servicios y médicos
7. Área del paciente: perfil, reservas, mis citas, registro de accesos
8. Recepción: búsqueda de pacientes, pacientes sin cuenta, reservas para un paciente, agenda del día
9. Área del médico: agenda, horario y días libres, asistencia
10. Expediente clínico: antecedentes, notas clínicas, archivos
11. Chat en tiempo real
12. Administración: usuarios, servicios, médicos y registro de auditoría
13. Despliegue
