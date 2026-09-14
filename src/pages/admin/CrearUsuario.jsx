import { useState } from "react";
import { supabase } from "../../lib/supabase";

import AdminHeader from "./components/AdminHeader";
import UsuarioInvitacionForm from "./components/UsuarioInvitacionForm";

import "./css/CrearUsuario.css";

function CrearUsuario() {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  async function handleCrearUsuario(datos) {
    if (cargando) {
      return false;
    }

    setCargando(true);
    setMensaje("");
    setTipoMensaje("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "invitar-usuario",
        {
          body: datos,
        }
      );

      if (error) {
        console.error(
          "Error al invocar invitar-usuario:",
          error
        );

        let mensajeFuncion =
          "No fue posible enviar la invitación.";

        try {
          const respuesta =
            await error.context?.json?.();

          if (respuesta?.error) {
            mensajeFuncion = respuesta.error;
          }
        } catch {
          // Se conserva el mensaje genérico.
        }

        setMensaje(mensajeFuncion);
        setTipoMensaje("error");

        return false;
      }

      if (!data?.success) {
        setMensaje(
          data?.error ||
            "No fue posible enviar la invitación."
        );

        setTipoMensaje("error");

        return false;
      }

      setMensaje(
        data?.message ||
          "La invitación fue enviada correctamente."
      );

      setTipoMensaje("success");

      return true;
    } catch (error) {
      console.error(
        "Error inesperado al invitar usuario:",
        error
      );

      setMensaje(
        "Ocurrió un error inesperado al enviar la invitación."
      );

      setTipoMensaje("error");

      return false;
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="crear-usuario-page">
      <AdminHeader
        titulo="Crear usuario"
        descripcion="Invita a nuevos integrantes y define su nivel de acceso al panel interno."
      />

      <div className="crear-usuario-layout">
        <div className="crear-usuario-container">
          {mensaje && (
            <div
              className={`crear-usuario-mensaje crear-usuario-mensaje--${tipoMensaje}`}
              role={tipoMensaje === "error" ? "alert" : "status"}
            >
              <span className="crear-usuario-mensaje__icon" aria-hidden="true">
                {tipoMensaje === "success" ? "✓" : "!"}
              </span>
              <p>{mensaje}</p>
            </div>
          )}

          <UsuarioInvitacionForm
            onEnviar={handleCrearUsuario}
            cargando={cargando}
          />
        </div>

        <aside
          className="crear-usuario-info"
          aria-label="Información sobre el proceso de invitación"
        >
          <span className="crear-usuario-info__eyebrow">
            Proceso de invitación
          </span>
          <h2>El acceso se activa por correo</h2>
          <p className="crear-usuario-info__intro">
            La cuenta quedará protegida hasta que la persona invitada complete
            su activación.
          </p>

          <ol className="crear-usuario-pasos">
            <li>
              <span aria-hidden="true">1</span>
              <div>
                <strong>Completa los datos</strong>
                <p>Ingresa la información laboral y selecciona el rol.</p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">2</span>
              <div>
                <strong>Enviamos la invitación</strong>
                <p>La persona recibirá un enlace en su correo electrónico.</p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">3</span>
              <div>
                <strong>La cuenta se activa</strong>
                <p>El usuario define su acceso y puede entrar al panel.</p>
              </div>
            </li>
          </ol>

          <div className="crear-usuario-info__nota">
            <strong>Asigna el rol con cuidado</strong>
            <p>Cada perfil tendrá permisos diferentes dentro del sistema.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CrearUsuario;
