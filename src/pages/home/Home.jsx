import Hero from "./Hero";
import Categories from "./Categories";
import FeaturedProducts from "./FeaturedProducts";
import Brands from "./Brands";
import Benefits from "./Benefits";
import Contact from "./Contact";
import Footer from "./Footer";
import "./css/home.css";

function Home() {
  return (
    <>
      <Hero />

      <Categories />

      <FeaturedProducts />

      <Brands />

      <Benefits />

      <Contact />

      <Footer />
    </>
  );
}

export default Home;