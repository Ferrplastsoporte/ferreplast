import "./css/hero.css";

function Hero() {

  const categories = [
    {
      name: "Herramientas",
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=700"
    },
    {
      name: "Pinturas",
      image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=700"
    },
    {
      name: "Adhesivos",
      image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=700"
    },
    {
      name: "Siliconas",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700"
    },
    {
      name: "Fijaciones",
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=700"
    },
    {
      name: "Seguridad",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=700"
    }
  ];


  return (

    <section className="hero">

      <div className="hero-header">

        <h1>
          ¿Qué estás buscando hoy?
        </h1>

        <p>
          Explora nuestras categorías y encuentra los productos
          ideales para tus proyectos.
        </p>

      </div>


      <div className="category-layout">


        {/* Categoría principal */}

        <div
          className="category-main"
          style={{
            backgroundImage:
            "url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200)"
          }}
        >

          <div className="card-overlay">

            <span>
              ⭐ DESTACADO
            </span>

            <h2>
              Resinas Epóxicas
            </h2>

            <button>
              Ver categoría →
            </button>

          </div>

        </div>



        {/* Categorías pequeñas */}

        <div className="category-side">

          {categories.slice(0,3).map((category,index)=>(

            <div
              className="category-card"
              key={index}
              style={{
                backgroundImage:`url(${category.image})`
              }}
            >

              <div className="card-overlay">

                <h3>
                  {category.name}
                </h3>

              </div>


            </div>

          ))}

        </div>


      </div>



      <div className="category-bottom">


        {categories.slice(3).map((category,index)=>(

          <div
            className="category-card"
            key={index}
            style={{
              backgroundImage:`url(${category.image})`
            }}
          >

            <div className="card-overlay">

              <h3>
                {category.name}
              </h3>

            </div>

          </div>

        ))}


      </div>


    </section>

  );

}


export default Hero;