import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";

import {
  LONGITUD_MINIMA_FAMILIA,
  LONGITUD_MAXIMA_FAMILIA,
  limpiarNombreFamilia,
  validarNombreFamilia,
} from "../../utils/familias";

import "./css/bodeguero.css";
import "./css/familias.css";

function Familias() {
  const [familias, setFamilias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardandoFamilia, setGuardandoFamilia] = useState(false);
  const [guardandoSubcategoria, setGuardandoSubcategoria] = useState(false);

  const [mostrarFormularioFamilia, setMostrarFormularioFamilia] =
    useState(false);

  const [mostrarFormularioSubcategoria, setMostrarFormularioSubcategoria] =
    useState(false);

  const [familiaEditando, setFamiliaEditando] = useState(null);
  const [subcategoriaEditando, setSubcategoriaEditando] = useState(null);

  const [nombreFamilia, setNombreFamilia] = useState("");
  const [nombreSubcategoria, setNombreSubcategoria] = useState("");
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState("");

  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setMensajeError("");

    const [resultadoFamilias, resultadoSubcategorias] = await Promise.all([
      supabase
        .from("familia")
        .select("id_familia, nom_familia")
        .order("nom_familia", { ascending: true }),

      supabase
        .from("subcategoria")
        .select(
          `
          id_subcategoria,
          nom_subcategoria,
          id_familia,
          familia (
            id_familia,
            nom_familia
          )
        `,
        )
        .order("nom_subcategoria", { ascending: true }),
    ]);

    if (resultadoFamilias.error) {
      console.error("Error al cargar familias:", resultadoFamilias.error);
      setFamilias([]);
      setMensajeError("No fue posible cargar las familias.");
    } else {
      setFamilias(resultadoFamilias.data ?? []);
    }

    if (resultadoSubcategorias.error) {
      console.error(
        "Error al cargar subcategorías:",
        resultadoSubcategorias.error,
      );

      setSubcategorias([]);
      setMensajeError("No fue posible cargar las subcategorías.");
    } else {
      setSubcategorias(resultadoSubcategorias.data ?? []);
    }

    setCargando(false);
  }

  function limpiarMensajes() {
    setMensajeError("");
    setMensajeExito("");
  }

  function reiniciarFormularioFamilia() {
    setFamiliaEditando(null);
    setNombreFamilia("");
    setMostrarFormularioFamilia(false);
  }

  function reiniciarFormularioSubcategoria() {
    setSubcategoriaEditando(null);
    setNombreSubcategoria("");
    setFamiliaSeleccionada("");
    setMostrarFormularioSubcategoria(false);
  }

  function abrirNuevaFamilia() {
    reiniciarFormularioFamilia();
    reiniciarFormularioSubcategoria();
    limpiarMensajes();

    setMostrarFormularioFamilia(true);
  }

  function abrirEdicionFamilia(familia) {
    reiniciarFormularioSubcategoria();
    limpiarMensajes();

    setFamiliaEditando(familia);
    setNombreFamilia(familia.nom_familia ?? "");
    setMostrarFormularioFamilia(true);
  }

  function abrirNuevaSubcategoria() {
    reiniciarFormularioFamilia();
    reiniciarFormularioSubcategoria();
    limpiarMensajes();

    setMostrarFormularioSubcategoria(true);
  }

  function abrirEdicionSubcategoria(subcategoria) {
    reiniciarFormularioFamilia();
    limpiarMensajes();

    setSubcategoriaEditando(subcategoria);
    setNombreSubcategoria(subcategoria.nom_subcategoria ?? "");
    setFamiliaSeleccionada(String(subcategoria.id_familia ?? ""));

    setMostrarFormularioSubcategoria(true);
  }

  function cerrarFormularioFamilia() {
    if (guardandoFamilia) return;

    reiniciarFormularioFamilia();
    setMensajeError("");
  }

  function cerrarFormularioSubcategoria() {
    if (guardandoSubcategoria) return;

    reiniciarFormularioSubcategoria();
    setMensajeError("");
  }

  async function guardarFamilia(evento) {
    evento.preventDefault();
    if (guardandoFamilia) return;

    const resultado = validarNombreFamilia(
      nombreFamilia,
      "nombre de la familia",
    );

    if (!resultado.valido) {
      setMensajeError(resultado.error);
      return;
    }

    setGuardandoFamilia(true);
    limpiarMensajes();

    try {
      const { error } = await supabase.rpc("guardar_familia", {
        p_nombre: resultado.valor,
        p_id_familia: familiaEditando?.id_familia ?? null,
      });

      if (error) throw error;

      const editando = Boolean(familiaEditando);

      reiniciarFormularioFamilia();
      await cargarDatos();

      setMensajeExito(
        editando
          ? "La familia fue actualizada correctamente."
          : "La familia fue creada correctamente.",
      );
    } catch (error) {
      console.error("Error al guardar familia:", error);

      setMensajeError(error?.message || "No fue posible guardar la familia.");
    } finally {
      setGuardandoFamilia(false);
    }
  }

  async function guardarSubcategoria(evento) {
    evento.preventDefault();
    if (guardandoSubcategoria) return;

    const resultado = validarNombreFamilia(
      nombreSubcategoria,
      "nombre de la subcategoría",
    );

    if (!resultado.valido) {
      setMensajeError(resultado.error);
      return;
    }

    const idFamilia = Number(familiaSeleccionada);

    if (!Number.isInteger(idFamilia) || idFamilia <= 0) {
      setMensajeError("Debes seleccionar una familia.");
      return;
    }

    setGuardandoSubcategoria(true);
    limpiarMensajes();

    try {
      const { error } = await supabase.rpc("guardar_subcategoria", {
        p_nombre: resultado.valor,
        p_id_familia: idFamilia,
        p_id_subcategoria: subcategoriaEditando?.id_subcategoria ?? null,
      });

      if (error) throw error;

      const editando = Boolean(subcategoriaEditando);

      reiniciarFormularioSubcategoria();
      await cargarDatos();

      setMensajeExito(
        editando
          ? "La subcategoría fue actualizada correctamente."
          : "La subcategoría fue creada correctamente.",
      );
    } catch (error) {
      console.error("Error al guardar subcategoría:", error);

      setMensajeError(
        error?.message || "No fue posible guardar la subcategoría.",
      );
    } finally {
      setGuardandoSubcategoria(false);
    }
  }

  return (
    <section className="bodeguero-page familias-page">
      <BodegueroHeader
        titulo="Familias y subcategorías"
        descripcion="Administra la estructura principal utilizada para organizar los productos del catálogo."
      />

      <div className="familias-toolbar">
        <button
          type="button"
          className="btn-add"
          onClick={abrirNuevaFamilia}
          disabled={guardandoFamilia || guardandoSubcategoria}
        >
          Nueva familia
        </button>

        <button
          type="button"
          className="btn-add familias-toolbar__secondary"
          onClick={abrirNuevaSubcategoria}
          disabled={
            guardandoFamilia || guardandoSubcategoria || familias.length === 0
          }
        >
          Nueva subcategoría
        </button>
      </div>

      {familias.length === 0 && !cargando && (
        <p className="bodeguero-message bodeguero-message--warning">
          Debes crear al menos una familia antes de registrar subcategorías.
        </p>
      )}

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

      {mostrarFormularioFamilia && (
        <form className="familias-form" onSubmit={guardarFamilia} noValidate>
          <div className="familias-form__header">
            <div>
              <h2>{familiaEditando ? "Editar familia" : "Crear familia"}</h2>
              <p>Define el nivel principal de clasificación del catálogo.</p>
            </div>
          </div>

          <div className="familias-form__field">
            <label htmlFor="nombreFamilia">Nombre de la familia</label>

            <input
              id="nombreFamilia"
              type="text"
              value={nombreFamilia}
              onChange={(evento) =>
                setNombreFamilia(limpiarNombreFamilia(evento.target.value))
              }
              placeholder="Ej: Resinas"
              minLength={LONGITUD_MINIMA_FAMILIA}
              maxLength={LONGITUD_MAXIMA_FAMILIA}
              disabled={guardandoFamilia}
              autoComplete="off"
              autoFocus
            />

            <small>Se permiten letras, números, espacios y guiones.</small>
          </div>

          <div className="familias-form__actions">
            <button
              type="submit"
              className="familias-form__save"
              disabled={guardandoFamilia}
            >
              {guardandoFamilia
                ? "Guardando..."
                : familiaEditando
                  ? "Actualizar familia"
                  : "Crear familia"}
            </button>

            <button
              type="button"
              className="familias-form__cancel"
              onClick={cerrarFormularioFamilia}
              disabled={guardandoFamilia}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {mostrarFormularioSubcategoria && (
        <form
          className="familias-form"
          onSubmit={guardarSubcategoria}
          noValidate
        >
          <div className="familias-form__header">
            <div>
              <h2>
                {subcategoriaEditando
                  ? "Editar subcategoría"
                  : "Crear subcategoría"}
              </h2>

              <p>Asocia la subcategoría a una familia existente.</p>
            </div>
          </div>

          <div className="familias-form__grid">
            <div className="familias-form__field">
              <label htmlFor="familiaSubcategoria">Familia</label>

              <select
                id="familiaSubcategoria"
                value={familiaSeleccionada}
                onChange={(evento) =>
                  setFamiliaSeleccionada(evento.target.value)
                }
                disabled={guardandoSubcategoria}
              >
                <option value="">Selecciona una familia</option>

                {familias.map((familia) => (
                  <option key={familia.id_familia} value={familia.id_familia}>
                    {familia.nom_familia}
                  </option>
                ))}
              </select>
            </div>

            <div className="familias-form__field">
              <label htmlFor="nombreSubcategoria">
                Nombre de la subcategoría
              </label>

              <input
                id="nombreSubcategoria"
                type="text"
                value={nombreSubcategoria}
                onChange={(evento) =>
                  setNombreSubcategoria(
                    limpiarNombreFamilia(evento.target.value),
                  )
                }
                placeholder="Ej: Kits epóxicos"
                minLength={LONGITUD_MINIMA_FAMILIA}
                maxLength={LONGITUD_MAXIMA_FAMILIA}
                disabled={guardandoSubcategoria}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <div className="familias-form__actions">
            <button
              type="submit"
              className="familias-form__save"
              disabled={guardandoSubcategoria}
            >
              {guardandoSubcategoria
                ? "Guardando..."
                : subcategoriaEditando
                  ? "Actualizar subcategoría"
                  : "Crear subcategoría"}
            </button>

            <button
              type="button"
              className="familias-form__cancel"
              onClick={cerrarFormularioSubcategoria}
              disabled={guardandoSubcategoria}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="bodeguero-loading">
          Cargando familias y subcategorías...
        </p>
      ) : (
        <div className="familias-panels">
          <section className="familias-panel">
            <div className="familias-panel__header">
              <div>
                <h2>Familias</h2>

                <p>
                  {familias.length}{" "}
                  {familias.length === 1
                    ? "familia registrada"
                    : "familias registradas"}
                </p>
              </div>
            </div>

            <div className="familias-table-wrapper">
              <table className="familias-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {familias.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="familias-table__empty">
                        No hay familias registradas.
                      </td>
                    </tr>
                  ) : (
                    familias.map((familia) => (
                      <tr key={familia.id_familia}>
                        <td>
                          <strong>{familia.nom_familia}</strong>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="familias-table__edit"
                            onClick={() => abrirEdicionFamilia(familia)}
                            disabled={guardandoFamilia || guardandoSubcategoria}
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
          </section>

          <section className="familias-panel">
            <div className="familias-panel__header">
              <div>
                <h2>Subcategorías</h2>

                <p>
                  {subcategorias.length}{" "}
                  {subcategorias.length === 1
                    ? "subcategoría registrada"
                    : "subcategorías registradas"}
                </p>
              </div>
            </div>

            <div className="familias-table-wrapper">
              <table className="familias-table familias-table--subcategorias">
                <thead>
                  <tr>
                    <th>Subcategoría</th>
                    <th>Familia</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {subcategorias.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="familias-table__empty">
                        No hay subcategorías registradas.
                      </td>
                    </tr>
                  ) : (
                    subcategorias.map((subcategoria) => (
                      <tr key={subcategoria.id_subcategoria}>
                        <td>
                          <strong>{subcategoria.nom_subcategoria}</strong>
                        </td>

                        <td>
                          {subcategoria.familia?.nom_familia || "Sin familia"}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="familias-table__edit"
                            onClick={() =>
                              abrirEdicionSubcategoria(subcategoria)
                            }
                            disabled={guardandoFamilia || guardandoSubcategoria}
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
          </section>
        </div>
      )}
    </section>
  );
}

export default Familias;