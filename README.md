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

| Módulo                         | Descripción                                                                                          | Repositorio |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------- |
| 🖥️ **main**               | Rama donde estará cargada las versiones estable y avances significativos respecto a la plataforma | Pendiente   |
| 🖥️ **testing**               | Rama enfocada a pruebas durante el desarrollo | Pendiente   |
| 📄 **Documentación Técnica**   | Diagramas, modelos de datos, manuales y documentación del proyecto.                                  | Pendiente   |

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

## 📦 Categorías de Productos

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

## 📄 Licencia

Proyecto desarrollado con fines académicos y de aprendizaje. La utilización de la información y código debe respetar las políticas establecidas por los integrantes del proyecto.

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



🔐 Configuración de Variables de Entorno (Actualización - 08/06/2026)
Para garantizar la seguridad de las credenciales y la escalabilidad del proyecto, se implementó el uso de variables de entorno con Vite.

📁 Estructura actual
text
ferreplast/
├── .env                 ← Contiene las credenciales REALES (NO se sube a GitHub)
├── .env.example         ← Plantilla con variables vacías (SÍ se sube a GitHub)
├── src/
│   ├── lib/
│   │   └── supabase.ts  ← Conexión usando import.meta.env
│   └── vite-env.d.ts    ← Tipos TypeScript para variables de entorno
🔧 Pasos para configurar el entorno local
Clonar el repositorio

bash
git clone <url-del-repo>
cd ferreplast
Instalar dependencias

bash
npm install
Crear archivo .env (copiar desde .env.example)

bash
# En Linux/Mac/Git Bash
cp .env.example .env

# En Windows (PowerShell)
Copy-Item .env.example .env
Completar las credenciales en .env

env
VITE_SUPABASE_URL=https://tudominio.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
⚠️ Importante: Solicitar las credenciales al administrador del proyecto. No compartir este archivo ni subirlo a GitHub.

Verificar que .gitignore incluye (ya está configurado):

gitignore
.env
.env.local
.env.production
Iniciar el servidor de desarrollo

bash
npm install react-router-dom @supabase/supabase-js
npm run dev
✅ Verificación de que todo funciona
En la consola del navegador (F12), ejecutar:

javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
Debería mostrar la URL de Supabase configurada.

📌 Nota importante
No existe comando para "activar" el entorno virtual en React/Vite. Las variables de entorno se cargan automáticamente al ejecutar npm run dev siempre que el archivo .env exista en la raíz del proyecto.

