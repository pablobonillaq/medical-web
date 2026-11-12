[English](README.md) | **Español**

# Medical Web

[![CI](https://github.com/pablobonillaq/medical-web/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/pablobonillaq/medical-web/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=pablobonillaq_medical-web&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=pablobonillaq_medical-web)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=pablobonillaq_medical-web&metric=coverage)](https://sonarcloud.io/summary/new_code?id=pablobonillaq_medical-web)

Cliente web de [Medical API](https://github.com/pablobonillaq/medical-api): agenda de citas, expediente clínico, archivos y chat con la recepción de la clínica, para pacientes, médicos, recepción y administradores. Accesible, en español e inglés, con tema claro y oscuro.

> **Estado:** en desarrollo. Fases 1 (configuración base) y 2 (sistema de diseño) completadas; sigue la Fase 3 (idiomas y estructura).
> Proyecto de portfolio. Todos los datos de prueba son **ficticios**.

## Funcionalidades

- [x] Tema claro, oscuro o el del sistema, sin parpadeo al cargar
- [ ] Librería de componentes con variantes tipadas, documentada en Storybook
- [ ] Español e inglés (`/es`, `/en`)
- [ ] Inicio de sesión, registro de pacientes y cierre de sesión; rutas protegidas por rol desde el servidor
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
- **Validación:** Zod
- **Pruebas:** Vitest, Testing Library y cobertura con V8
- **Calidad de código:** ESLint y Prettier
- **CI:** GitHub Actions y SonarQube Cloud
- **Librería de componentes:** class-variance-authority y tailwind-merge, documentada en Storybook con revisiones de accesibilidad (axe)
- **Por agregar:** Redux Toolkit con thunks y sagas, Playwright con axe, Lighthouse CI

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

Abre `http://localhost:3001`. La API se queda en el puerto 3000, así que las dos corren al mismo tiempo.

El navegador nunca llama a la API directamente: el servidor de Next.js reenvía las peticiones a `/api/...` hacia `API_URL` (por ejemplo, `/api/health` → `http://localhost:3000/health`). Web y API comparten un solo origen, así que no hace falta CORS y la cookie httpOnly de sesión de la API funciona tal cual.

## Variables de entorno

| Variable  | Descripción                                                                  | Ejemplo                 |
| --------- | ---------------------------------------------------------------------------- | ----------------------- |
| `API_URL` | Dónde corre la API de Express. Solo la usa el servidor de Next.js (`/api/*`) | `http://localhost:3000` |

Las variables se validan con Zod al iniciar la app (`src/config/env.ts`): un valor incorrecto la detiene con un mensaje claro.

## Scripts

| Comando                   | Descripción                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `npm run dev`             | Inicia el servidor de desarrollo en el puerto 3001                 |
| `npm run build`           | Genera el build de producción                                      |
| `npm start`               | Sirve el build de producción en el puerto 3001                     |
| `npm run typecheck`       | Genera los tipos de las rutas y revisa los tipos                   |
| `npm run lint`            | Revisa el código con ESLint                                        |
| `npm run format`          | Formatea el código con Prettier (y ordena las clases de Tailwind)  |
| `npm run check`           | Ejecuta typecheck, lint, la revisión de formato y las pruebas      |
| `npm test`                | Ejecuta las pruebas                                                |
| `npm run test:watch`      | Ejecuta las pruebas en modo watch                                  |
| `npm run test:coverage`   | Ejecuta las pruebas y genera el reporte de cobertura (`coverage/`) |
| `npm run storybook`       | Abre Storybook en el puerto 6006                                   |
| `npm run build-storybook` | Genera el sitio estático de Storybook (`storybook-static/`)        |

## Pruebas

Las pruebas usan **Vitest** con **Testing Library** y están junto al código que prueban (`*.test.ts(x)`). Los componentes se buscan por su rol y su nombre accesible, igual que los encuentra un lector de pantalla.

La cobertura se mantiene en **100 %** de líneas, ramas, funciones y sentencias, y `npm run test:coverage` falla si alguna baja. Vitest todavía no puede renderizar Server Components `async`, así que esos se mantienen delgados (solo cargan datos y pasan props) y la lógica vive en funciones y componentes que sí se pueden probar. Las páginas se cubrirán con pruebas end-to-end en Playwright (ver [ADR 0004](docs/adr/0004-testing-strategy.md)).

### Integración continua

En cada push a `master` y en cada pull request, [GitHub Actions](.github/workflows/ci.yml) ejecuta la revisión de tipos, ESLint, la revisión de Prettier, las pruebas con cobertura y el build de producción. Después envía el reporte de cobertura a **SonarQube Cloud**, que evalúa el Quality Gate.

## Librería de componentes

Los componentes están en `src/components/ui/`. Cada uno tiene variantes tipadas y sus historias en Storybook, con un selector de tema claro y oscuro en la barra y un panel de accesibilidad que ejecuta axe en cada historia.

**Storybook:** https://pablobonillaq.github.io/medical-web/ (se publica en cada push a `master`).

```bash
npm run storybook   # http://localhost:6006
```

## Accesibilidad

La meta es **WCAG 2.2 nivel AA**. Los tokens de color tienen pruebas: cada color de texto tiene al menos 4.5:1 de contraste y cada borde y anillo de foco 3:1, en los dos temas (`src/app/globals.test.ts`). Cada funcionalidad se considera terminada solo cuando:

- se puede usar solo con el teclado, con el foco visible;
- usa HTML semántico (regiones, encabezados, etiquetas) y anuncia los cambios con `aria-live` donde hace falta;
- su contraste pasa en los dos temas y respeta `prefers-reduced-motion`;
- pasan sus revisiones automáticas de accesibilidad (axe).

## Estructura del proyecto

```
.github/
└── workflows/
    ├── ci.yml             # CI: tipos, lint, formato, pruebas, build, Storybook y SonarQube
    └── storybook.yml      # publica Storybook en GitHub Pages
.storybook/                # Storybook: Vite con Tailwind, selector de tema, revisiones de accesibilidad
docs/
└── adr/                   # registros de decisiones de arquitectura
src/
├── app/                   # rutas (App Router)
│   ├── globals.css        # Tailwind y tokens de diseño (colores con light-dark())
│   ├── globals.test.ts    # revisa el contraste WCAG de cada par de colores, en los dos temas
│   ├── layout.tsx         # layout raíz: idioma, fuentes, metadatos, script del tema, avisos
│   └── page.tsx           # página de inicio
├── components/
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
├── lib/
│   └── cn.ts              # une clases y resuelve los choques de Tailwind
└── theme/
    ├── theme.ts           # leer, guardar y aplicar el tema, y el script que corre antes de pintar
    └── use-theme.ts       # hook de React, sincronizado entre pestañas
next.config.ts             # configuración de Next.js (Cache Components, rewrites)
vitest.config.mts          # pruebas y el umbral de 100 % de cobertura
```

## Decisiones de arquitectura

Están escritas en inglés, como el código.

| ADR                                                 | Decisión                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| [0001](docs/adr/0001-nextjs-app-router.md)          | Next.js App Router con Cache Components, en el mismo origen que la API          |
| [0002](docs/adr/0002-tailwind-component-library.md) | Librería de componentes con Tailwind y variantes tipadas, sin styled-components |
| [0003](docs/adr/0003-redux-thunks-and-sagas.md)     | Redux Toolkit: thunks para peticiones, sagas para flujos largos                 |
| [0004](docs/adr/0004-testing-strategy.md)           | Estrategia de pruebas y 100 % de cobertura                                      |

## Roadmap

1. ~~Configuración base: Next.js, Prettier, Vitest con 100 % de cobertura, CI y SonarQube, conexión con la API~~ ✅
2. ~~Sistema de diseño: tokens, temas claro y oscuro, librería de componentes, Storybook~~ ✅
3. Idiomas y estructura: español e inglés, layout y navegación por rol, Playwright con axe, Lighthouse CI
4. Capa de datos: store de Redux Toolkit, cliente de la API, thunks, sagas y MSW
5. Autenticación: inicio de sesión, registro, cierre de sesión, rutas protegidas, vencimiento de sesión
6. Páginas públicas: inicio, servicios y médicos
7. Área del paciente: perfil, reservas, mis citas, registro de accesos
8. Recepción: búsqueda de pacientes, pacientes sin cuenta, reservas para un paciente, agenda del día
9. Área del médico: agenda, horario y días libres, asistencia
10. Expediente clínico: antecedentes, notas clínicas, archivos
11. Chat en tiempo real
12. Administración: usuarios, servicios, médicos y registro de auditoría
13. Despliegue
