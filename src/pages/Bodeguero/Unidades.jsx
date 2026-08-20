import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";

import {
  LONGITUD_MINIMA_UNIDAD,
  LONGITUD_MAXIMA_UNIDAD,
  limpiarNombreUnidad,
  validarNombreUnidad,
} from "../../utils/unidadMedida";

import "./css/bodeguero.css";
import "./css/unidades.css";

function Unidades() {
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [unidadEditando, setUnidadEditando] = useState(null);
  const [nombre, setNombre] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    cargarUnidades();
  }, []);

  async function cargarUnidades() {
    setCargando(true);
    setMensajeError("");

    const { data, error } = await supabase
      .from("unidad_medida")
      .select("id_und_medida, nom_und_medida")
      .order("nom_und_medida", { ascending: true });

    if (error) {
      console.error("Error al cargar unidades:", error);
      setUnidades([]);
      setMensajeError("No fue posible cargar las unidades de medida.");
    } else {
      setUnidades(data ?? []);
    }

    setCargando(false);
  }

  function limpiarFormulario() {
    setUnidadEditando(null);
    setNombre("");
    setMostrarFormulario(false);
  }

  function abrirNuevaUnidad() {
    limpiarFormulario();
    setMensajeError("");
    setMensajeExito("");
    setMostrarFormulario(true);
  }

  function abrirEdicionUnidad(unidad) {
    setUnidadEditando(unidad);
    setNombre(unidad.nom_und_medida ?? "");
    setMensajeError("");
    setMensajeExito("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) return;
    limpiarFormulario();
    setMensajeError("");
  }

  async function guardarUnidad(evento) {
    evento.preventDefault();
    if (guardando) return;

    const resultado = validarNombreUnidad(
      nombre,
      unidades,
      unidadEditando?.id_und_medida ?? null,
    );

    if (!resultado.valido) {
      setMensajeError(resultado.error);
      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const { error } = await supabase.rpc("guardar_unidad_medida", {
        p_nombre: resultado.valor,
        p_id_unidad: unidadEditando?.id_und_medida ?? null,
      });

      if (error) throw error;

      const editando = Boolean(unidadEditando);

      limpiarFormulario();
      await cargarUnidades();

      setMensajeExito(
        editando
          ? "La unidad de medida fue actualizada correctamente."
          : "La unidad de medida fue creada correctamente.",
      );
    } catch (error) {
      console.error("Error al guardar unidad:", error);

      setMensajeError(
        error?.message || "No fue posible guardar la unidad de medida.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="bodeguero-page unidades-page">
      <BodegueroHeader
        titulo="Unidades de medida"
        descripcion="Crea y actualiza las unidades utilizadas para describir la presentación de los productos."
      />

      <div className="unidades-toolbar">
        <button
          type="button"
          className="btn-add"
          onClick={abrirNuevaUnidad}
          disabled={guardando}
        >
          Nueva unidad
        </button>
      </div>

      {mensajeExito && (
        <p
          className="bodeguero-message bodeguero-message--success"
          role="status"
        >
          {mensajeExito}
        </p>
      )}

      {mensajeError && (
        <p className="bodeguero-message bodeguero-message--error" role="alert">
          {mensajeError}
        </p>
      )}

      {mostrarFormulario && (
        <form className="unidades-form" onSubmit={guardarUnidad} noValidate>
          <div className="unidades-form__header">
            <h2>{unidadEditando ? "Editar unidad" : "Crear unidad"}</h2>

            <p>
              Usa nombres claros y breves, por ejemplo: Kg, Litro, m², Unidad o
              Rollo.
            </p>
          </div>

          <div className="unidades-form__field">
            <label htmlFor="nombreUnidad">Nombre de la unidad</label>

            <input
              id="nombreUnidad"
              type="text"
              value={nombre}
              onChange={(evento) =>
                setNombre(limpiarNombreUnidad(evento.target.value))
              }
              placeholder="Ej: Kg"
              minLength={LONGITUD_MINIMA_UNIDAD}
              maxLength={LONGITUD_MAXIMA_UNIDAD}
              autoComplete="off"
              disabled={guardando}
              autoFocus
            />

            <small>
              Se permiten letras, números, espacios y símbolos ² o ³.
            </small>
          </div>

          <div className="unidades-form__actions">
            <button
              type="submit"
              className="unidades-form__save"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : unidadEditando
                  ? "Actualizar unidad"
                  : "Crear unidad"}
            </button>

            <button
              type="button"
              className="unidades-form__cancel"
              onClick={cerrarFormulario}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="bodeguero-loading">Cargando unidades de medida...</p>
      ) : (
        <div className="unidades-table-wrapper">
          <table className="unidades-table">
            <thead>
              <tr>
                <th>Unidad de medida</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {unidades.length === 0 ? (
                <tr>
                  <td colSpan="2" className="unidades-table__empty">
                    No hay unidades de medida registradas.
                  </td>
                </tr>
              ) : (
                unidades.map((unidad) => (
                  <tr key={unidad.id_und_medida}>
                    <td>
                      <strong>{unidad.nom_und_medida}</strong>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="unidades-table__edit"
                        onClick={() => abrirEdicionUnidad(unidad)}
                        disabled={guardando}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Unidades;
