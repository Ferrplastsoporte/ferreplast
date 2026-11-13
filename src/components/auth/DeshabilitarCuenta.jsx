import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./DeshabilitarCuenta.css";

export default function DeshabilitarCuenta({ bloqueado = false }) {
  const dialogo = useRef(null);
  const envioEnCurso = useRef(false);
  const solicitudAceptada = useRef(false);
  const [procesando, setProcesando] = useState(false);
  const [deshabilitada, setDeshabilitada] = useState(false);
  const [error, setError] = useState("");
  const [impedimento, setImpedimento] = useState(null);

  async function confirmar() {
    if (envioEnCurso.current || impedimento) return;
    envioEnCurso.current = true;
    setProcesando(true);
    setError("");

    try {
      if (!solicitudAceptada.current) {
        const { data, error: errorSolicitud } = await supabase.rpc("deshabilitar_mi_cuenta");
        if (errorSolicitud || data !== true) {
          const motivos = {
            cuenta_pedidos_pendientes: {
              titulo: "Tienes pedidos por resolver",
              descripcion: "No puedes deshabilitar tu cuenta mientras tengas pedidos sin resolver.",
              orientacion: "Contacta a soporte para revisar su estado. Cuando estén resueltos, podrás volver a solicitar la deshabilitación.",
            },
            cuenta_cotizaciones_pendientes: {
              titulo: "Tienes cotizaciones por resolver",
              descripcion: "No puedes deshabilitar tu cuenta mientras tengas cotizaciones pendientes o aún vigentes.",
              orientacion: "Contacta a soporte para revisar su cierre. Cuando estén resueltas, podrás volver a solicitar la deshabilitación.",
            },
          };
          const motivo = motivos[errorSolicitud?.details];
          if (motivo) {
            setImpedimento(motivo);
            setError("");
            dialogo.current?.focus?.();
          } else {
            setError("No pudimos confirmar la deshabilitación. Revisa tu conexión e inténtalo nuevamente.");
          }
          return;
        }
        solicitudAceptada.current = true;
        setDeshabilitada(true);
      }

      const { error: errorCierre } = await supabase.auth.signOut({ scope: "global" });
      if (errorCierre) {
        setError("Tu cuenta ya está deshabilitada, pero no pudimos cerrar la sesión. Reintenta el cierre.");
        return;
      }
      window.location.replace("/login?cuenta=deshabilitada");
    } catch {
      setError(solicitudAceptada.current
        ? "Tu cuenta ya está deshabilitada. Revisa tu conexión y reintenta el cierre de sesión."
        : "No pudimos confirmar la deshabilitación. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      envioEnCurso.current = false;
      setProcesando(false);
    }
  }

  return (
    <section className="deshabilitacion-cliente" aria-labelledby="deshabilitar-cuenta-titulo">
      <span className="deshabilitacion-cliente__etiqueta">ACCESO A TU CUENTA</span>
      <h2 className="deshabilitacion-cliente__titulo" id="deshabilitar-cuenta-titulo">Deshabilitar mi cuenta</h2>
      <div className="deshabilitacion-cliente__contenido">
        <p className="deshabilitacion-cliente__descripcion">Deshabilita tu acceso y cierra tus sesiones. Puedes solicitar la reactivación a soporte; si no lo haces, tu cuenta podrá ser eliminada una vez transcurridos 30 días.</p>
        <button type="button" className="deshabilitacion-cliente__boton deshabilitacion-cliente__boton--desactivar" disabled={bloqueado || procesando}
          onClick={() => { setError(""); setImpedimento(null); dialogo.current.showModal(); }}>
          Deshabilitar mi cuenta
        </button>
      </div>

      <dialog ref={dialogo} className="deshabilitacion-cliente__dialogo" aria-labelledby="confirmar-deshabilitacion-titulo"
        aria-describedby="confirmar-deshabilitacion-descripcion"
        onCancel={(evento) => { if (envioEnCurso.current || solicitudAceptada.current) evento.preventDefault(); }}>
        {impedimento && <span className="deshabilitacion-cliente__simbolo" aria-hidden="true">!</span>}
        <h2 className="deshabilitacion-cliente__titulo-dialogo" id="confirmar-deshabilitacion-titulo">
          {impedimento ? impedimento.titulo : "¿Deshabilitar tu cuenta?"}
        </h2>
        <p className="deshabilitacion-cliente__parrafo" id="confirmar-deshabilitacion-descripcion" role={impedimento ? "alert" : undefined}>
          {impedimento ? impedimento.descripcion : "Se cerrarán tus sesiones y perderás el acceso hasta que soporte reactive tu cuenta."}
        </p>
        {impedimento ? (
          <>
            <p className="deshabilitacion-cliente__estado">Tu cuenta sigue activa.</p>
            <p className="deshabilitacion-cliente__parrafo">{impedimento.orientacion}</p>
          </>
        ) : (
          <>
            <div className="deshabilitacion-cliente__resumen">
              <p className="deshabilitacion-cliente__parrafo">Sin una solicitud de reactivación, tu cuenta podrá eliminarse después de <strong>30 días</strong>.</p>
              <p className="deshabilitacion-cliente__nota">Se conservarán los antecedentes comerciales que corresponda mantener.</p>
            </div>
            <p className="deshabilitacion-cliente__nota">Solo podrás continuar si tus pedidos y cotizaciones están resueltos.</p>
          </>
        )}
        <p className="deshabilitacion-cliente__correo">
          <a className="deshabilitacion-cliente__soporte" href="mailto:Ferreplast.soporte@outlook.com">Ferreplast.soporte@outlook.com</a>
        </p>
        {error && <p className="deshabilitacion-cliente__error" role="alert">{error}</p>}
        <div className="deshabilitacion-cliente__acciones">
          <button type="button" className="deshabilitacion-cliente__boton" disabled={procesando || deshabilitada}
            onClick={() => dialogo.current.close()}>{impedimento ? "Entendido" : "Cancelar"}</button>
          {!impedimento && (
            <button type="button" className="deshabilitacion-cliente__boton deshabilitacion-cliente__boton--confirmar" onClick={confirmar} disabled={procesando}>
              {procesando ? "Procesando..." : deshabilitada ? "Reintentar cierre de sesión" : "Sí, deshabilitar mi cuenta"}
            </button>
          )}
        </div>
      </dialog>
    </section>
  );
}
