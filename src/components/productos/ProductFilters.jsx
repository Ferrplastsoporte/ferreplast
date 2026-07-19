const ProductFilters = ({ onFilter, categorias }) => {
  return (
    <div className="product-filters">
      <input
        type="text"
        placeholder="Buscar productos..."
        onChange={(e) => onFilter({ search: e.target.value })}
        className="filter-search"
      />
      
      <select
        onChange={(e) => onFilter({ category: e.target.value })}
        className="filter-select"
      >
        <option value="">Todas las categorías</option>
        {categorias?.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  )
}

export default ProductFilters