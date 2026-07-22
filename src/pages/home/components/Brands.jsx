import "../css/home.css";

import klingspor from "../../../assets/klingspor.png";
import basf from "../../../assets/basf.png";
import oldWoodBrothers from "../../../assets/oldwoodbrothers.png";

function Brands() {

  const brands = [
    {
      name: "Klingspor",
      logo: klingspor,
      url: "https://www.klingspor.cl/",
    },
    {
      name: "BASF",
      logo: basf,
      url: "https://www.basf.com/global/en",
    },
    {
      name: "Old Wood Brothers",
      logo: oldWoodBrothers,
      url: "https://oldwoodbrothers.cl/",
    },
  ];

  return (
    <section className="brands">

      <span>MARCAS EXCLUSIVAS</span>

      <h2>Representamos marcas líderes del mercado</h2>

      <p>
        En Ferreplast trabajamos con marcas reconocidas internacionalmente,
        garantizando productos originales, de alta calidad y con respaldo para
        cada uno de tus proyectos.
      </p>

      <div className="brands-grid">

        {brands.map((brand) => (
          <a
            key={brand.name}
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-card"
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="brand-logo"
            />
          </a>
        ))}

      </div>

    </section>
  );
}

export default Brands;