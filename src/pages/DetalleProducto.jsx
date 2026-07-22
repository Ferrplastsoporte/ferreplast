import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import ProductDetail from "../components/productos/ProductDetail"
import "./css/DetalleProducto.css"

function DetalleProducto() {
  const { id } = useParams()

  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")

  useEffect(() => {
    cargarProducto()
  }, [id])

  async function cargarProducto() {
    setCargando(true)
    setErrorCarga("")

    const idProducto = Number(id)

    if (!Number.isInteger(idProducto)) {
      setProducto(null)
      setErrorCarga(
        "El identificador del producto no es válido."
      )
      setCargando(false)
      return
    }

    const { data, error } = await supabase
      .from("producto")
      .select(`
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
        unidad_de_medida,
        id_subcategoria,

        subcategoria (
          id_subcategoria,
          nom_subcategoria,
          id_cat,

          categoria (
            id_cat,
            nom_cat
          )
        ),

        producto_documento (
          id_documento,
          nombre_documento,
          tipo_documento,
          archivo_path,
          est_documento
        )
      `)
      .eq("id_prod", idProducto)
      .eq("est_prod", 1)
      .maybeSingle()

    if (error) {
      console.error(
        "Error al cargar el detalle del producto:",
        error
      )

      setProducto(null)
      setErrorCarga(
        "No fue posible cargar la información del producto."
      )
      setCargando(false)
      return
    }

    if (!data) {
      setProducto(null)
      setErrorCarga(
        "El producto no existe o no se encuentra disponible."
      )
      setCargando(false)
      return
    }

    const documentos = (
      data.producto_documento ?? []
    )
      .filter(
        (documento) =>
          documento.est_documento === true
      )
      .map((documento) => {
        const { data: urlData } = supabase.storage
          .from("producto-documentos")
          .getPublicUrl(documento.archivo_path)

        return {
          ...documento,
          url: urlData.publicUrl,
        }
      })

    setProducto({
      ...data,
      documentos,
    })

    setCargando(false)
  }

  if (cargando) {
    return (
      <main className="detalle-producto">
        <p className="detalle-producto__estado">
          Cargando producto...
        </p>
      </main>
    )
  }

  if (errorCarga) {
    return (
      <main className="detalle-producto">
        <section className="detalle-producto__error">
          <h1>No fue posible mostrar el producto</h1>

          <p>{errorCarga}</p>

          <Link to="/catalogo">
            Volver al catálogo
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="detalle-producto">
      <ProductDetail producto={producto} />
    </main>
  )
}

export default DetalleProducto