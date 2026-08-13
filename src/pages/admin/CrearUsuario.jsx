import { useState } from "react";
import { supabase } from "../../lib/supabase";

import AdminHeader from "./components/AdminHeader";
import UsuarioInvitacionForm from "./components/UsuarioInvitacionForm";

import "./css/admin.css";

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
    <>
      <AdminHeader titulo="Crear Nuevo Usuario" />

      <div className="crear-usuario-container">
        {mensaje && (
          <div
            className={`crear-usuario-mensaje crear-usuario-mensaje--${tipoMensaje}`}
            role={
              tipoMensaje === "error"
                ? "alert"
                : "status"
            }
          >
            {mensaje}
          </div>
        )}

        <UsuarioInvitacionForm
          onEnviar={handleCrearUsuario}
          cargando={cargando}
        />
      </div>
    </>
  );
}

export default CrearUsuario;