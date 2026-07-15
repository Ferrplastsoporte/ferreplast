import "./css/featuredProducts.css";


function FeaturedProducts(){


    const products = [

        {
            name:"Resina Epóxica Cristal 1 Kg",
            category:"Resinas",
            price:"$24.990",
            oldPrice:"$29.990",
            stock:"Disponible",
            image:"https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600"
        },

        {
            name:"Kit Resina Epóxica Profesional",
            category:"Resinas",
            price:"$39.990",
            oldPrice:"$45.990",
            stock:"Disponible",
            image:"https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600"
        },

        {
            name:"Set Herramientas Manuales",
            category:"Herramientas",
            price:"$18.990",
            oldPrice:"",
            stock:"Últimas unidades",
            image:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600"
        },

        {
            name:"Pintura Industrial Premium",
            category:"Pinturas",
            price:"$15.990",
            oldPrice:"",
            stock:"Disponible",
            image:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600"
        }

    ];



    return (

        <section className="featured">


            <div className="featured-header">


                <span>
                    PRODUCTOS DESTACADOS
                </span>


                <h2>
                    Los favoritos de nuestros clientes
                </h2>


                <p>
                    Materiales seleccionados para obtener
                    resultados profesionales.
                </p>


            </div>



            <div className="products-grid">


                {
                    products.map((product,index)=>(


                        <article 
                            className="product-card"
                            key={index}
                        >


                            <div className="product-image">


                                <img
                                    src={product.image}
                                    alt={product.name}
                                />


                                <span className="discount">
                                    OFERTA
                                </span>


                            </div>



                            <div className="product-info">


                                <small>
                                    {product.category}
                                </small>


                                <h3>
                                    {product.name}
                                </h3>


                                <div className="prices">

                                    <strong>
                                        {product.price}
                                    </strong>


                                    {
                                        product.oldPrice &&
                                        <del>
                                            {product.oldPrice}
                                        </del>
                                    }

                                </div>



                                <p className="stock">
                                    ● {product.stock}
                                </p>



                                <button>
                                    Agregar al carrito
                                </button>


                            </div>


                        </article>


                    ))
                }


            </div>


        </section>

    );

}


export default FeaturedProducts;