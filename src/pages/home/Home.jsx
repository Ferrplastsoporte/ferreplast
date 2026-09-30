import Hero from './components/Hero'
import ProductosDestacados from './components/ProductosDestacados'
import Marcas from './components/Marcas'
import Contacto from './components/Contacto'
import Mision from './components/Mision'
import './css/home.css'

function Home() {
  return (
    <>
      <Mision />
      <Marcas />
      <Hero />
      <ProductosDestacados />
      <Contacto />
    </>
  )
}

export default Home
