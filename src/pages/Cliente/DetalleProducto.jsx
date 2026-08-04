import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import ProductDetail from "../../components/productos/ProductDetail";

import "../css/DetalleProducto.css";

function DetalleProducto() {
  const { id } = useParams();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    cargarProducto();
  }, [id]);

  async function cargarProducto() {
    setCargando(true);
    setErrorCarga("");
    setProducto(null);

    const idProducto = Number(id);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      setErrorCarga("El identificador del producto no es válido.");
      setCargando(false);
      return;
    }

    const { data, error } = await supabase
      .from("producto")
      .select(
        `
        id_prod,
        nom_prod,
        desc_prod,
        detalle_prod,
        precio_prod,
        precio_act,
        imagen_url,
        created_prod,
        est_prod,
        color_prod,
        peso_prod,
        id_und_medida,
        id_subcategoria,
        id_marca,
        stock_prod,

        unidad_medida (
          id_und_medida,
          nom_und_medida
        ),

        marca_producto (
          id_marca,
          nom_marca,
          logo_url
        ),

        subcategoria (
          id_subcategoria,
          nom_subcategoria,
          id_familia,

          familia (
            id_familia,
            nom_familia
          )
        ),

        producto_documento (
          id_documento,
          nombre_documento,
          tipo_documento,
          archivo_path,
          est_documento
        )
      `,
      )
      .eq("id_prod", idProducto)
      .eq("est_prod", 2)
      .maybeSingle();

    if (error) {
      console.error("Error al cargar el detalle del producto:", error);

      setErrorCarga("No fue posible cargar la información del producto.");
      setCargando(false);
      return;
    }

    if (!data) {
      setErrorCarga("El producto no existe o no se encuentra disponible.");
      setCargando(false);
      return;
    }

    let imagenPublica = data.imagen_url;

    if (data.imagen_url && !data.imagen_url.startsWith("http")) {
      const { data: imagenData } = supabase.storage
        .from("imagenes_productos")
        .getPublicUrl(data.imagen_url);

      imagenPublica = imagenData.publicUrl;
    }

    const documentos = (data.producto_documento ?? [])
      .filter((documento) => documento.est_documento === true)
      .map((documento) => {
        const { data: urlData } = supabase.storage
          .from("producto-documentos")
          .getPublicUrl(documento.archivo_path);

        return {
          ...documento,
          url: urlData.publicUrl,
        };
      });

    setProducto({
      ...data,
      imagen_url: imagenPublica,
      documentos,
    });

    setCargando(false);
  }

  if (cargando) {
    return (
      <main className="detalle-producto">
        <p className="detalle-producto__estado">Cargando producto...</p>
      </main>
    );
  }

  if (errorCarga) {
    return (
      <main className="detalle-producto">
        <section className="detalle-producto__error">
          <h1>No fue posible mostrar el producto</h1>

          <p>{errorCarga}</p>

          <Link to="/catalogo">Volver al catálogo</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="detalle-producto">
      <ProductDetail producto={producto} />
    </main>
  );
}

export default DetalleProducto;
