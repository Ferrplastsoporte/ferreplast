import Hero from './components/Hero'
import FeaturedProducts from './components/FeaturedProducts'
import Brands from './components/Brands'
import Benefits from './components/Benefits'
import Contact from './components/Contact'
import Footer from '../../components/layout/Footer'
import './css/home.css'

function Home() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Brands />
      <Benefits />
      <Contact />
      <Footer />
    </>
  )
}

export default Home