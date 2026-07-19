import ProductCard from './ProductCard'

const ProductList = ({ productos, onAgregar, onEditar, modo = 'cliente' }) => {
  if (!productos || productos.length === 0) {
    return <p className="text-center text-gray-500">No hay productos disponibles</p>
  }

  return (
    <div className="product-list">
      {productos.map(producto => (
        <ProductCard
          key={producto.id}
          producto={producto}
          onAgregar={onAgregar}
          onEditar={onEditar}
          modo={modo}
        />
      ))}
    </div>
  )
}

export default ProductList