import Hero from './components/Hero'
import FeaturedProducts from './components/FeaturedProducts'
import Brands from './components/Brands'
import Contact from './components/Contact'
import Mission from './components/Mission'
import './css/home.css'

function Home() {
  return (
    <>
      <Mission />
      <Brands />
      <Hero />
      <FeaturedProducts />
      <Contact />
    </>
  )
}

export default Home