import '../css/home.css' 

function Brands() {
  const brands = ["SIKA", "BOSCH", "3M", "STANLEY", "LOCTITE"]

  return (
    <section className="brands">
      <div className="brands-header">
        <span>MARCAS DESTACADAS</span>
        <h2>Trabajamos con productos de confianza</h2>
      </div>

      <div className="brands-grid">
        {brands.map((brand, index) => (
          <div key={index} className="brand-card">
            {brand}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Brands