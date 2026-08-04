import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";
import "./css/bodeguero.css";
import "./css/familias.css";

const LONGITUD_MINIMA = 2;
const LONGITUD_MAXIMA = 80;

function limpiarNombre(valor = "") {
  return String(valor)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarComparacion(valor = "") {
  return String(valor).trim().toLocaleLowerCase("es-CL");
}

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
        .select(
          `
          id_familia,
          nom_familia
        `,
        )
        .order("nom_familia", {
          ascending: true,
        }),

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
        .order("nom_subcategoria", {
          ascending: true,
        }),
    ]);

    if (resultadoFamilias.error) {
      console.error("Error al cargar las familias:", resultadoFamilias.error);

      setFamilias([]);

      setMensajeError("No fue posible cargar las familias.");
    } else {
      setFamilias(resultadoFamilias.data ?? []);
    }

    if (resultadoSubcategorias.error) {
      console.error(
        "Error al cargar las subcategorías:",
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

  function cerrarFormularioFamilia() {
    if (guardandoFamilia) {
      return;
    }

    reiniciarFormularioFamilia();
    setMensajeError("");
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

  function cerrarFormularioSubcategoria() {
    if (guardandoSubcategoria) {
      return;
    }

    reiniciarFormularioSubcategoria();
    setMensajeError("");
  }

  function validarNombre(nombre, tipo) {
    const nombreLimpio = limpiarNombre(nombre).trim();

    if (!nombreLimpio) {
      setMensajeError(`Debes ingresar el nombre de la ${tipo}.`);

      return null;
    }

    if (nombreLimpio.length < LONGITUD_MINIMA) {
      setMensajeError(
        `El nombre debe tener al menos ${LONGITUD_MINIMA} caracteres.`,
      );

      return null;
    }

    if (nombreLimpio.length > LONGITUD_MAXIMA) {
      setMensajeError(
        `El nombre no puede superar los ${LONGITUD_MAXIMA} caracteres.`,
      );

      return null;
    }

    if (!/[\p{L}\p{N}]/u.test(nombreLimpio)) {
      setMensajeError(
        "El nombre debe contener al menos una letra o un número.",
      );

      return null;
    }

    return nombreLimpio;
  }

  function existeFamiliaDuplicada(nombreValidado) {
    const nombreNormalizado = normalizarComparacion(nombreValidado);

    return familias.some(
      (familia) =>
        familia.id_familia !== familiaEditando?.id_familia &&
        normalizarComparacion(familia.nom_familia) === nombreNormalizado,
    );
  }

  function existeSubcategoriaDuplicada(nombreValidado, idFamilia) {
    const nombreNormalizado = normalizarComparacion(nombreValidado);

    return subcategorias.some(
      (subcategoria) =>
        subcategoria.id_subcategoria !==
          subcategoriaEditando?.id_subcategoria &&
        Number(subcategoria.id_familia) === Number(idFamilia) &&
        normalizarComparacion(subcategoria.nom_subcategoria) ===
          nombreNormalizado,
    );
  }

  async function guardarFamilia(evento) {
    evento.preventDefault();

    if (guardandoFamilia) {
      return;
    }

    const nombreValidado = validarNombre(nombreFamilia, "familia");

    if (!nombreValidado) {
      return;
    }

    if (existeFamiliaDuplicada(nombreValidado)) {
      setMensajeError("Ya existe una familia con ese nombre.");

      return;
    }

    setGuardandoFamilia(true);
    limpiarMensajes();

    try {
      if (familiaEditando) {
        const { error } = await supabase
          .from("familia")
          .update({
            nom_familia: nombreValidado,
          })
          .eq("id_familia", familiaEditando.id_familia);

        if (error) {
          throw error;
        }

        setMensajeExito("La familia fue actualizada correctamente.");
      } else {
        const { error } = await supabase.from("familia").insert({
          nom_familia: nombreValidado,
        });

        if (error) {
          throw error;
        }

        setMensajeExito("La familia fue creada correctamente.");
      }

      reiniciarFormularioFamilia();
      await cargarDatos();
    } catch (error) {
      console.error("Error al guardar la familia:", error);

      if (error?.code === "23505") {
        setMensajeError("Ya existe una familia con ese nombre.");
      } else if (error?.message?.toLowerCase().includes("row-level security")) {
        setMensajeError("No tienes permisos para guardar esta familia.");
      } else {
        setMensajeError(error?.message || "No fue posible guardar la familia.");
      }
    } finally {
      setGuardandoFamilia(false);
    }
  }

  async function guardarSubcategoria(evento) {
    evento.preventDefault();

    if (guardandoSubcategoria) {
      return;
    }

    const nombreValidado = validarNombre(nombreSubcategoria, "subcategoría");

    if (!nombreValidado) {
      return;
    }

    const idFamilia = Number(familiaSeleccionada);

    if (!Number.isInteger(idFamilia) || idFamilia <= 0) {
      setMensajeError("Debes seleccionar una familia.");

      return;
    }

    const familiaExiste = familias.some(
      (familia) => Number(familia.id_familia) === idFamilia,
    );

    if (!familiaExiste) {
      setMensajeError("La familia seleccionada no es válida.");

      return;
    }

    if (existeSubcategoriaDuplicada(nombreValidado, idFamilia)) {
      setMensajeError(
        "Ya existe una subcategoría con ese nombre dentro de la familia seleccionada.",
      );

      return;
    }

    setGuardandoSubcategoria(true);
    limpiarMensajes();

    const datosSubcategoria = {
      nom_subcategoria: nombreValidado,

      id_familia: idFamilia,
    };

    try {
      if (subcategoriaEditando) {
        const { error } = await supabase
          .from("subcategoria")
          .update(datosSubcategoria)
          .eq("id_subcategoria", subcategoriaEditando.id_subcategoria);

        if (error) {
          throw error;
        }

        setMensajeExito("La subcategoría fue actualizada correctamente.");
      } else {
        const { error } = await supabase
          .from("subcategoria")
          .insert(datosSubcategoria);

        if (error) {
          throw error;
        }

        setMensajeExito("La subcategoría fue creada correctamente.");
      }

      reiniciarFormularioSubcategoria();
      await cargarDatos();
    } catch (error) {
      console.error("Error al guardar la subcategoría:", error);

      if (error?.code === "23505") {
        setMensajeError(
          "Ya existe una subcategoría con ese nombre dentro de la familia seleccionada.",
        );
      } else if (error?.message?.toLowerCase().includes("row-level security")) {
        setMensajeError("No tienes permisos para guardar esta subcategoría.");
      } else {
        setMensajeError(
          error?.message || "No fue posible guardar la subcategoría.",
        );
      }
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
                setNombreFamilia(limpiarNombre(evento.target.value))
              }
              placeholder="Ej: Resinas"
              minLength={LONGITUD_MINIMA}
              maxLength={LONGITUD_MAXIMA}
              disabled={guardandoFamilia}
              autoComplete="off"
              autoFocus
            />

            <small>
              Se permiten letras, números, espacios, guiones, puntos, apóstrofes
              y el signo &amp;.
            </small>
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
                  setNombreSubcategoria(limpiarNombre(evento.target.value))
                }
                placeholder="Ej: Kits epóxicos"
                minLength={LONGITUD_MINIMA}
                maxLength={LONGITUD_MAXIMA}
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
