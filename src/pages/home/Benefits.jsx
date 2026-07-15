import "./css/benefits.css";


function Benefits(){


    const benefits = [

        {
            icon:"🚚",
            title:"Despacho rápido",
            text:"Enviamos tus productos de forma segura a todo Chile."
        },

        {
            icon:"🛡️",
            title:"Productos profesionales",
            text:"Materiales seleccionados para proyectos exigentes."
        },

        {
            icon:"💳",
            title:"Pago seguro",
            text:"Compra con Transbank o transferencia bancaria."
        },

        {
            icon:"👨‍🔧",
            title:"Asesoría especializada",
            text:"Te ayudamos a elegir el producto adecuado."
        }

    ];



    return(

        <section className="benefits">


            <div className="benefits-header">

                <span>
                    FERREPLAST
                </span>

                <h2>
                    Todo lo que necesitas
                    para trabajar con confianza
                </h2>

                <p>
                    Calidad, seguridad y respaldo
                    en cada compra.
                </p>

            </div>



            <div className="benefits-grid">


                {
                    benefits.map((item,index)=>(


                        <div 
                            className="benefit-card"
                            key={index}
                        >


                            <div className="benefit-icon">
                                {item.icon}
                            </div>


                            <h3>
                                {item.title}
                            </h3>


                            <p>
                                {item.text}
                            </p>


                        </div>


                    ))
                }


            </div>


        </section>


    );

}


export default Benefits;