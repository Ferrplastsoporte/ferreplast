import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import UsuarioFormAdmin from "./components/UsuarioInvitacionForm";

import "./css/admin.css";

function CrearUsuario() {
  async function handleCrearUsuario(datos) {
    // Paso 2:
    // Aquí llamaremos la Edge Function.
    console.log(datos);

    return false;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">
        <AdminHeader titulo="Crear Nuevo Usuario" />

        <div className="crear-usuario-container">
          <UsuarioFormAdmin onEnviar={handleCrearUsuario} />
        </div>
      </div>
    </div>
  );
}

export default CrearUsuario;
