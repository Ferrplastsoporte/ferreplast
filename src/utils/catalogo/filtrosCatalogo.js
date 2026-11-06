export function resolverFiltrosCatalogo(locales, url, subcategorias = []) {
  const subcategoria = subcategorias.find(
    (opcion) => String(opcion.id_subcategoria) === String(locales.subcategoria),
  );
  const subcategoriaIncompatible = url.familia && subcategoria &&
    String(subcategoria.id_familia) !== String(url.familia);

  return {
    ...locales,
    busqueda: url.busqueda,
    familia: url.familia,
    marca: url.marca,
    subcategoria: subcategoriaIncompatible ? "" : locales.subcategoria,
  };
}

export function crearOpcionesFiltrosCatalogo(base, filtros) {
  const ordenar = (opciones, nombre) => opciones.filter((opcion) => opcion[nombre] != null).sort(
    (a, b) => String(a[nombre]).localeCompare(String(b[nombre]), "es"),
  );
  const colores = new Set(
    base.productos
      .map((producto) => producto.color_prod)
      .filter((color) => typeof color === "string" && color.trim()),
  );
  // Una combinación sin resultados conserva las selecciones del usuario.
  if (filtros.color) colores.add(filtros.color);

  const pesos = new Map();
  if (filtros.unidadMedida) {
    for (const producto of base.productos) {
      if (String(producto.id_und_medida) !== String(filtros.unidadMedida) ||
        producto.peso_prod == null || producto.peso_prod === "") continue;
      const valor = Number(producto.peso_prod);
      if (Number.isFinite(valor)) pesos.set(valor, {
        valor, id_und_medida: producto.id_und_medida,
      });
    }
    if (filtros.peso !== "" && Number.isFinite(Number(filtros.peso))) {
      const valor = Number(filtros.peso);
      pesos.set(valor, { valor, id_und_medida: filtros.unidadMedida });
    }
  }

  return {
    familias: ordenar(base.familias, "nom_familia"),
    subcategorias: ordenar(base.subcategorias.filter((opcion) =>
      !filtros.familia || String(opcion.id_familia) === String(filtros.familia),
    ), "nom_subcategoria"),
    marcas: ordenar(base.marcas, "nom_marca"),
    unidadesMedida: ordenar(base.unidadesMedida, "nom_und_medida"),
    colores: [...colores].sort((a, b) => a.localeCompare(b, "es")),
    pesos: [...pesos.values()].sort((a, b) => a.valor - b.valor),
  };
}
