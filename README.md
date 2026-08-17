# 🧪 Ferreplast

**Ferreplast SpA** es una empresa dedicada a la comercialización de insumos para plásticos reforzados con fibra de vidrio (FRP), ofreciendo resinas epóxicas y poliéster, fibra de vidrio, gelcoats, catalizadores, herramientas e insumos para impermeabilización. Sus productos están orientados a aplicaciones industriales, náuticas, de construcción y reparación, proporcionando soluciones para laminado, moldeo e impermeabilización.

---

## 👥 Equipo de Trabajo

* 👩‍💻 **Ricardo Ojeda** – Gestión del proyecto, planificación de tareas, diseño de interfaces y experiencia de usuario (UI/UX).
* 👨‍💻 **Alvaro Flores** – Desarrollo backend, integración de servicios y administración de base de datos.
* 👨‍💻 **Kevin Vivanco** – Desarrollo backend, integración de servicios y administración de base de datos.
* 🤖 **IA** – Apoyo técnico y asistencia durante el desarrollo.

---

## 🧩 Repositorios del Sistema

| Módulo | Descripción | Repositorio |
| --- | --- | --- |
| 🖥️ **main** | Rama destinada a contener las versiones estables y los avances significativos de la plataforma. | [Rama Principal](https://github.com/Ferrplastsoporte/ferreplast) |
| 📄 **Fase 1** | Repositorio destinado al versionamiento y respaldo de la documentación correspondiente a la Fase 1 del proyecto. | Pendiente |
| 📄 **Fase 2** | Repositorio destinado al versionamiento y respaldo de la documentación correspondiente a la Fase 2 del proyecto. | Pendiente |
| 📄 **Fase 3** | Repositorio destinado al versionamiento y respaldo de la documentación correspondiente a la Fase 3 del proyecto. | Pendiente |

## 🧩 Documentación del Proyecto

| Módulo | Descripción | Repositorio |
| --- | --- | --- |
| 📄 **Carpeta general del proyecto** | Contiene la documentación general del proyecto, organizada según sus respectivas fases. | [Documentación Capstone](https://drive.google.com/drive/folders/1uwANgD2PB4QwJZBEHxVRPXpa-yiI-YbK?usp=drive_link) |
| 📄 **Fase 1** | Contiene toda la documentación correspondiente a la Fase 1, incluyendo evidencias individuales y grupales. | [Documentación Fase 1](https://drive.google.com/drive/folders/1NFA5hPqexY1wG5VUt6zQm5bm-Y9p-SR1?usp=drive_link) |
| 📄 **Fase 2** | Contiene toda la documentación correspondiente a la Fase 2. | [Documentación Fase 2](https://drive.google.com/drive/folders/1C7AgeWcf3K9BcHJfObm1-fQ_N4fvrI_G?usp=drive_link) |
| 📄 **Fase 3** | Contiene toda la documentación correspondiente a la Fase 3. | [Documentación Fase 3](https://drive.google.com/drive/folders/1PYHB0k7YvnUWF8u4aZPkn7no_mG1m20M?usp=drive_link) |

---

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

## 📌 Funcionalidades Clave

* Visualización de catálogo de productos.
* Clasificación de productos por categorías.
* Consulta de información detallada de productos.
* Gestión centralizada de datos mediante Supabase.
* Diseño responsive para dispositivos móviles y escritorio.
* Escalabilidad para futuras funcionalidades de administración e inventario.

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

## 🚀 Ejecución

Para saltar algunos pasos verifica la instalación de las siguientes dependencias:

```bash
node -v
npm -v
```

### Instalar dependencias (Si no está instaladas)

```bash
npm install
```

---

## 🔐 Configuración de la Base de datos

Crear un archivo `supabase.ts` en la raíz del proyecto (src/lib):

```
import { createClient } from '@supabase/supabase-js'

VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
```

> Solicitar las credenciales al administrador del proyecto.

---

## ▶️ Ejecución

Iniciar entorno de desarrollo:

```bash
npm run dev
```

La aplicación quedará disponible en:

```text
http://localhost:5173
```

---

## 🛠️ Comandos Disponibles

| Comando         | Descripción                       |
| --------------- | --------------------------------- |
| npm run dev     | Inicia el servidor de desarrollo  |
| npm run build   | Genera la versión de producción   |
| npm run preview | Previsualiza la versión compilada |

---
