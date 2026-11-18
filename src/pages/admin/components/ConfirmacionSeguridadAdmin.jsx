import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabase";
import "../Css/ConfirmacionSeguridadAdmin.css";

async function gestionarCodigo(cuerpo) {
  const { data, error } = await supabase.functions.invoke("verificacion-admin", { body: cuerpo });
  if (error) {
    let mensaje = "No fue posible completar la verificación. Inténtalo nuevamente.";
    try { mensaje = (await error.context?.json?.())?.error || mensaje; } catch { /* Conservar mensaje genérico. */ }
    throw new Error(mensaje);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function ConfirmacionSeguridadAdmin({ operacion, datos, alCancelar, alConfirmar }) {
  const [datosConfirmados] = useState(() => structuredClone(datos));
  const [verificacion, setVerificacion] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(true);
  const [solicitadoEn, setSolicitadoEn] = useState(() => Date.now());
  const [ahora, setAhora] = useState(() => Date.now());
  const bloqueo = useRef(true);
  const modal = useRef(null);
  const campo = useRef(null);
  const solicitudInicial = useRef(null);
  const verificacionActual = useRef(null);
  const titulo = useId();
  const descripcion = useId();
  const campoCodigo = useId();
  const reenvioEn = Math.max(0, Math.ceil((solicitadoEn + 60_000 - ahora) / 1000));
  const vencido = verificacion && Date.parse(verificacion.vence_en) <= ahora;

  useEffect(() => {
    const anterior = document.activeElement;
    const pagina = document.querySelector(".usuarios-page, .crear-usuario-page");
    const eraInerte = pagina?.inert;
    const desplazamiento = document.body.style.overflow;
    if (pagina) pagina.inert = true;
    document.body.style.overflow = "hidden";
    modal.current?.focus();
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    return () => {
      clearInterval(reloj);
      if (pagina) pagina.inert = eraInerte;
      document.body.style.overflow = desplazamiento;
      if (anterior?.isConnected) anterior.focus();
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    // Conservar la misma promesa evita dos envíos por la repetición de efectos de StrictMode.
    solicitudInicial.current ??= gestionarCodigo({ accion: "solicitar", operacion, datos: datosConfirmados });
    solicitudInicial.current.then((respuesta) => {
      if (!respuesta?.id || !respuesta?.vence_en) throw new Error("No se pudo confirmar el envío del código.");
      if (vigente) {
        verificacionActual.current = respuesta.id;
        setVerificacion(respuesta);
      }
    }).catch((fallo) => { if (vigente) setError(fallo.message); })
      .finally(() => { if (vigente) { bloqueo.current = false; setOcupado(false); } });
    return () => { vigente = false; };
  }, [operacion, datosConfirmados]);

  useEffect(() => { if (verificacion && !ocupado) campo.current?.focus(); }, [verificacion, ocupado]);

  function cancelar() {
    if (bloqueo.current) return;
    if (verificacionActual.current) void gestionarCodigo({ accion: "cancelar", id: verificacionActual.current }).catch(() => {});
    alCancelar();
  }

  async function reenviar() {
    if (bloqueo.current || reenvioEn > 0) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    setCodigo("");
    setVerificacion(null);
    const instante = Date.now();
    setSolicitadoEn(instante);
    setAhora(instante);
    try {
      const respuesta = await gestionarCodigo({ accion: "solicitar", operacion, datos: datosConfirmados });
      if (!respuesta?.id || !respuesta?.vence_en) throw new Error("No se pudo confirmar el envío del código.");
      verificacionActual.current = respuesta.id;
      setVerificacion(respuesta);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  async function confirmar(evento) {
    evento.preventDefault();
    if (bloqueo.current || !verificacion || !/^\d{6}$/.test(codigo) || vencido) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    let codigoConfirmado = false;
    try {
      const respuesta = await gestionarCodigo({ accion: "confirmar", id: verificacion.id, codigo });
      if (respuesta?.confirmado !== true) throw new Error("No se pudo confirmar el código.");
      codigoConfirmado = true;
      if (!(await alConfirmar(verificacion.id))) throw new Error("La operación no se completó. Solicita otro código para reintentar.");
    } catch (fallo) {
      setError(fallo.message);
      if (codigoConfirmado) {
        void gestionarCodigo({ accion: "cancelar", id: verificacion.id }).catch(() => {});
        setVerificacion(null);
        setCodigo("");
      }
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  function manejarTeclado(evento) {
    if (evento.key === "Escape") { evento.preventDefault(); cancelar(); }
    if (evento.key !== "Tab") return;
    const controles = [...modal.current.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
    if (!controles.length) { evento.preventDefault(); return; }
    const primero = controles[0], ultimo = controles.at(-1);
    if (evento.shiftKey && (document.activeElement === primero || document.activeElement === modal.current)) {
      evento.preventDefault(); ultimo.focus();
    } else if (!evento.shiftKey && (document.activeElement === ultimo || document.activeElement === modal.current)) {
      evento.preventDefault(); primero.focus();
    }
  }

  return createPortal(
    <div className="confirmacion-seguridad-admin">
      <section className="confirmacion-seguridad-admin__contenido" role="dialog" aria-modal="true"
        aria-labelledby={titulo} aria-describedby={descripcion} tabIndex={-1} ref={modal} onKeyDown={manejarTeclado}>
        <h2 id={titulo}>Confirma con tu código</h2>
        <p id={descripcion}>{ocupado && !verificacion ? "Enviando un código a tu correo de administrador…"
          : verificacion ? `Enviamos un código a ${verificacion.correo}.` : "Solicita otro código para continuar."}</p>
        <form onSubmit={confirmar}>
          <label htmlFor={campoCodigo}>Código de seguridad</label>
          <input id={campoCodigo} ref={campo} type="text" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} value={codigo} disabled={ocupado || !verificacion || Boolean(vencido)}
            onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Ingresa el código" />
          {vencido && <p role="status">El código venció. Solicita otro.</p>}
          {error && <p className="confirmacion-seguridad-admin__error" role="alert">{error}</p>}
          <div className="confirmacion-seguridad-admin__acciones">
            <button type="button" onClick={cancelar} disabled={ocupado}>Cancelar</button>
            <button className="confirmacion-seguridad-admin__confirmar" type="submit"
              disabled={ocupado || !verificacion || codigo.length !== 6 || Boolean(vencido)}>
              {ocupado && verificacion ? "Confirmando…" : "Confirmar"}
            </button>
          </div>
          <button className="confirmacion-seguridad-admin__reenviar" type="button" onClick={reenviar} disabled={ocupado || reenvioEn > 0}>
            {reenvioEn > 0 ? `Reenviar código en ${reenvioEn} s` : "Reenviar código"}
          </button>
        </form>
      </section>
    </div>, document.body,
  );
}
