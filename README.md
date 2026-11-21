# 🧪 Ferreplast

Ferreplast es una plataforma web de ventas y cotizaciones desarrollada para **Ferreplast SpA**. Permite consultar productos, realizar compras, solicitar cotizaciones y gestionar las operaciones de bodega y administración mediante accesos diferenciados por rol.

La empresa comercializa resinas, fibra de vidrio, gelcoats, catalizadores y otros insumos destinados a aplicaciones industriales, náuticas, de construcción y reparación.

Sitio desplegado: https://ferreplastspa.cl

---

## 👥 Equipo de Trabajo

* 👩‍💻 **Ricardo Ojeda** – Full stack: frontend (UI/UX), integraciones y gestión del proyecto.
* 👨‍💻 **Kevin Vivanco** – Full stack: backend, base de datos y seguridad.
* 🤖 **IA** – Apoyo técnico y asistencia durante el desarrollo.

---

## 🧩 Repositorios del Sistema

| Módulo | Descripción | Repositorio |
| --- | --- | --- |
| 🖥️ **main** | Rama destinada a contener las versiones estables y los avances significativos de la plataforma. | [Rama Principal](https://github.com/Ferrplastsoporte/ferreplast) |
| 📄 **Fase 1** | Repositorio destinado al versionamiento y respaldo de la documentación correspondiente a la Fase 1 del proyecto. | [Fase 1](https://github.com/Ferrplastsoporte/ferreplast/tree/main/Fase%201) |
| 📄 **Fase 2** | Repositorio destinado al versionamiento y respaldo de la documentación correspondiente a la Fase 2 del proyecto. | [Fase 2](https://github.com/Ferrplastsoporte/ferreplast/tree/main/Fase%202) |
| 📄 **Fase 3** | Repositorio destinado al versionamiento y respaldo de la documentación correspondiente a la Fase 3 del proyecto. | [Fase 3](https://github.com/Ferrplastsoporte/ferreplast/tree/main/Fase%203) |

## ⚙️ Tecnologías Utilizadas

* **Frontend:** React, JavaScript, HTML5 y CSS3.
* **Build Tool:** Vite.
* **Backend as a Service:** Supabase.
* **Base de Datos:** PostgreSQL (gestionada mediante Supabase).
* **Control de Versiones:** Git y GitHub.

---

## 🧪 Entornos de Desarrollo

- Desarrollo realizado principalmente mediante Visual Studio Code.
- Control de versiones utilizando Git y GitHub.
- Ejecución local mediante Node.js y Vite.
- Gestión de datos, autenticación y almacenamiento mediante Supabase.
- Pruebas de funcionalidades realizadas en navegadores modernos (Google Chrome y Microsoft Edge).
- Integración continua mediante ramas de desarrollo y pruebas antes de fusionar cambios a la rama principal.

---

## 📌 Funcionalidades principales

- Catálogo con filtros, detalle de productos y documentos asociados.
- Búsqueda inteligente con sugerencias.
- Registro, autenticación, recuperación de contraseña y gestión de cuenta.
- Carrito y proceso de compra con modalidades de entrega y facturación.
- Integración con Webpay Plus y Banco de Chile.
- Consulta de pedidos y descarga de comprobantes de pago.
- Solicitud, emisión y envío de cotizaciones en PDF por correo.
- Gestión de productos, clasificaciones, documentos e inventario.
- Solicitudes de cambios de bodega con aprobación administrativa.
- Preparación y actualización de estados de pedidos por el bodeguero.
- Administración de usuarios y parámetros comerciales.
- Dashboards y reportes con exportación CSV y PDF.
- Controles de acceso por rol, políticas RLS y CAPTCHA.
- Diseño adaptable a dispositivos móviles y escritorio.

---

## 📦 Familia de Productos

* Resinas Epóxicas
* Resinas Poliéster
* Fibra de Vidrio
* Gelcoats y Pinturas
* Catalizadores
* Solventes
* Adhesivos
* Herramientas
* Impermeabilización
* Especialidades Epóxicas

---

## ▶️ Acceso a la plataforma

La versión desplegada está disponible en:

https://ferreplastspa.cl

Para revisar sus funcionalidades no es necesario instalar el proyecto.
El acceso a los paneles internos requiere una cuenta autorizada para
el rol correspondiente.

## Desarrollo local

### Requisitos

- Git.
- Node.js compatible con Vite: ^20.19.0 o >=22.12.0.
- npm.

### Instalación

```bash
git clone https://github.com/Ferrplastsoporte/ferreplast.git
cd ferreplast
npm ci
```

### Variables de entorno

Copiar el archivo `.env.example` como `.env` en la raíz del proyecto
y completar los valores del entorno autorizado:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
VITE_TURNSTILE_SITE_KEY=TU_CLAVE_PUBLICA_TURNSTILE
```

El cliente de Supabase ya está implementado en `src/lib/supabase.ts`.
No es necesario crear ni reemplazar este archivo.

Las variables con prefijo `VITE_` son accesibles desde el navegador.
No deben contener claves `service_role`, contraseñas ni secretos de
pagos o correo.

***Los valores necesarios para completar el archivo .env deben solicitarse al equipo responsable del proyecto, que proporcionará la configuración del entorno autorizado. Las credenciales administrativas y los secretos de producción no se incluyen en el repositorio.***

### Iniciar el frontend

```bash
npm run dev
```

La terminal indicará la dirección local, normalmente:

http://localhost:5173/

Ejecutar este comando inicia únicamente el frontend. La aplicación
se conecta al proyecto de Supabase configurado en `.env`; no crea
una base de datos ni un entorno de pruebas independiente.

Para realizar pruebas que modifiquen información, utilizar un backend
de pruebas con el esquema, las funciones, las políticas y los servicios
necesarios. Las credenciales administrativas y los secretos de producción
no forman parte de esta entrega.

Para utilizar Turnstile localmente, `localhost` debe estar autorizado
en la configuración del widget.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run lint` | Ejecuta el análisis estático con ESLint. |
| `npm run build` | Compila el frontend en la carpeta `dist/`. |
| `npm run preview` | Previsualiza localmente la versión compilada. |
