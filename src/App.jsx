import { Login, Registro, NuevaContrasena, RecuperarContrasena } from "./rutas/secciones/PaginasAutenticacion";
import { lazy } from "react";
import CargaSeccion from "./components/rutas/CargaSeccion";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MetadatosPagina from "./components/layout/MetadatosPagina";
import ScrollToTop from "./components/layout/ScrollToTop";
import RutaSoloVisitantes from "./components/rutas/RutaSoloVisitantes";
import PaginaNoEncontrada from "./pages/Errores/PaginaNoEncontrada";
import rutasCliente from "./rutas/RutasCliente";
import rutasAdministrador from "./rutas/RutasAdministrador";
import rutasBodega from "./rutas/RutasBodega";

import VigilanciaSesion from "./components/auth/VigilanciaSesion";

const Privacidad = lazy(() => import("./pages/Cliente/Privacidad"));

function App() {
  return (
    <BrowserRouter>
      <VigilanciaSesion />
      <ScrollToTop />
      <MetadatosPagina />
      <Routes>
        {/* Documento público accesible desde cualquier rol y sin iniciar sesión. */}
        <Route element={<CargaSeccion />}>
          <Route path="/privacidad" element={<Privacidad />} />
        </Route>

        {/* Autenticación */}
        <Route element={<RutaSoloVisitantes />}>
          <Route element={<CargaSeccion />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
          </Route>
        </Route>

        {/* Recuperación conserva su acceso independiente del guard de visitantes. */}
        <Route element={<CargaSeccion />}>
          <Route path="/NuevaContrasena" element={<NuevaContrasena />} />
          <Route path="/RecuperarContrasena" element={<RecuperarContrasena />} />
        </Route>

        {/* Secciones separadas para preparar la carga diferida por etapas. */}
        {rutasCliente}
        {rutasAdministrador}
        {rutasBodega}

        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
