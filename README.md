# Ferreplast - Instalación y Ejecución

## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

* Node.js (versión 20 o superior recomendada)
* npm (incluido con Node.js)
* Visual Studio Code (opcional, recomendado)

Verificar instalación:

```bash
node -v
npm -v
```

---

## Clonar el Proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd ferreplast
```

---

## Instalar Dependencias

Ejecutar:

```bash
npm install
```

Esto instalará automáticamente todas las dependencias definidas en el archivo `package.json`, incluyendo:

* React
* React DOM
* Vite
* Supabase JS

---

## Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://pddhzryhtbxilzuryoyy.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

> Solicitar la clave `VITE_SUPABASE_ANON_KEY` al administrador del proyecto.

---

## Ejecutar el Proyecto

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Debería aparecer algo similar a:

```text
Local: http://localhost:5173/
```

Abrir esa dirección en el navegador.

---

## Comandos Útiles

### Ejecutar en modo desarrollo

```bash
npm run dev
```

### Generar versión de producción

```bash
npm run build
```

### Previsualizar versión de producción

```bash
npm run preview
```

---

## Estructura Principal

```text
src/
│
├── componentes/
│   └── SupabaseTest.jsx
│
├── lib/
│   └── supabase.ts
│
├── App.jsx
└── main.jsx
```

---

## Solución de Problemas

### Error: Cannot find module

Ejecutar nuevamente:

```bash
npm install
```

### Error de Supabase

Verificar:

* Que el archivo `.env` exista.
* Que la URL de Supabase sea correcta.
* Que la API Key sea válida.
* Reiniciar el servidor después de modificar variables de entorno:

```bash
npm run dev
```

---

## Inicio Rápido

```bash
git clone <URL_DEL_REPOSITORIO>
cd ferreplast
npm install
npm run dev
```
