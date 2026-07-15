import "./css/categories.css";

function Categories() {

    const categories = [
        {
            title: "Resinas Epóxicas",
            description: "Resinas cristal, UV y kits profesionales.",
            image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600"
        },
        {
            title: "Herramientas",
            description: "Equipos y accesorios para tus proyectos.",
            image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600"
        },
        {
            title: "Pinturas",
            description: "Soluciones para terminaciones y acabados.",
            image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600"
        },
        {
            title: "Seguridad",
            description: "Protección y elementos profesionales.",
            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600"
        }
    ];


    return (

        <section className="categories">


            <div className="categories-header">

                <span>
                    CATEGORÍAS
                </span>

                <h2>
                    Encuentra lo que necesitas
                </h2>

                <p>
                    Productos profesionales para construcción,
                    reparación y creación.
                </p>

            </div>



            <div className="categories-grid">


                {
                    categories.map((category,index)=>(

                        <article 
                            className="category-card"
                            key={index}
                        >

                            <img
                                src={category.image}
                                alt={category.title}
                            />


                            <div className="category-info">

                                <h3>
                                    {category.title}
                                </h3>

                                <p>
                                    {category.description}
                                </p>


                                <button>
                                    Ver productos →
                                </button>


                            </div>


                        </article>

                    ))
                }


            </div>


        </section>

    );

}


export default Categories;