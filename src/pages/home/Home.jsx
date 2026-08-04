import Hero from './components/Hero'
import FeaturedProducts from './components/FeaturedProducts'
import Brands from './components/Brands'
import Benefits from './components/Benefits'
import Contact from './components/Contact'
import Footer from '../../components/layout/Footer'
import Mission from './components/Mission'
import './css/home.css'

function Home() {
  return (
    <>
      <Mission />
      <Brands />
      <Hero />
      <FeaturedProducts />
      <Benefits />
      <Contact />
      <Footer />
    </>
  )
}

export default Home