import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import '../css/home.css' 

const products = [
  { id: 1, name: "Resina Epóxica Cristal 1 Kg", category: "Resinas", price: "$24.990", oldPrice: "$34.990", badge: "OFERTA", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800" },
  { id: 2, name: "Taladro Percutor Bosch", category: "Herramientas", price: "$89.990", oldPrice: "", badge: "NUEVO", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800" },
  { id: 3, name: "Pintura Látex Blanco", category: "Pinturas", price: "$18.990", oldPrice: "$22.990", badge: "OFERTA", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800" },
  { id: 4, name: "Silicona Transparente", category: "Siliconas", price: "$5.990", oldPrice: "", badge: "", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800" },
  { id: 5, name: "Esmeril Angular Makita", category: "Herramientas", price: "$69.990", oldPrice: "$79.990", badge: "OFERTA", image: "https://images.unsplash.com/photo-1581147036324-c1c0d54d9d14?w=800" },
  { id: 6, name: "Brocha Profesional", category: "Pinturas", price: "$4.990", oldPrice: "", badge: "", image: "https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=800" }
]

function FeaturedProducts() {
  return (
    <section className="featured-products">
      <div className="section-title">
        <span>⭐ PRODUCTOS DESTACADOS</span>
        <h2>Lo más vendido en Ferreplast</h2>
        <p>Descubre algunos de nuestros productos más populares para tus proyectos.</p>
      </div>

      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={25}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop={true}
        breakpoints={{
          0: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1400: { slidesPerView: 4 }
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <div className="product-card">
              {product.badge && <span className="badge">{product.badge}</span>}
              <img src={product.image} alt={product.name} />
              <div className="product-info">
                <small>{product.category}</small>
                <h3>{product.name}</h3>
                <div className="prices">
                  {product.oldPrice && <span className="old-price">{product.oldPrice}</span>}
                  <span className="price">{product.price}</span>
                </div>
                <button>Agregar al carrito</button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default FeaturedProducts