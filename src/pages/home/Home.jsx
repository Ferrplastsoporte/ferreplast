import Hero from './components/Hero'
import FeaturedProducts from './components/FeaturedProducts'
import Brands from './components/Brands'
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
      <Contact />
      <Footer />
    </>
  )
}

export default Home