import { Login, Registro, NuevaContrasena, RecuperarContrasena } from "./rutas/secciones/PaginasAutenticacion";
import CargaSeccion from "./components/rutas/CargaSeccion";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/layout/ScrollToTop";
import RutaSoloVisitantes from "./components/rutas/RutaSoloVisitantes";
import PaginaNoEncontrada from "./pages/Errores/PaginaNoEncontrada";
import rutasCliente from "./rutas/RutasCliente";
import rutasAdministrador from "./rutas/RutasAdministrador";
import rutasBodega from "./rutas/RutasBodega";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
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
