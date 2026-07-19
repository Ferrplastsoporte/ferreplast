import '../css/home.css' 


function Footer(){

    return(

        <footer className="footer">


            <div className="footer-container">


                {/* Marca */}

                <div className="footer-brand">

                    <h2>
                        FERREPLAST
                    </h2>

                    <p>
                        Especialistas en resinas epóxicas,
                        herramientas y materiales profesionales
                        para tus proyectos.
                    </p>


                    <div className="socials">

                        <a href="#">
                            Facebook
                        </a>

                        <a href="#">
                            Instagram
                        </a>

                        <a href="#">
                            WhatsApp
                        </a>

                    </div>


                </div>



                {/* Navegación */}

                <div className="footer-column">

                    <h3>
                        Navegación
                    </h3>


                    <a href="#">
                        Inicio
                    </a>

                    <a href="#">
                        Catálogo
                    </a>

                    <a href="#">
                        Resinas
                    </a>

                    <a href="#">
                        Herramientas
                    </a>


                </div>




                {/* Ayuda */}

                <div className="footer-column">

                    <h3>
                        Atención
                    </h3>


                    <a href="#">
                        Contacto
                    </a>

                    <a href="#">
                        Preguntas frecuentes
                    </a>

                    <a href="#">
                        Políticas de compra
                    </a>

                    <a href="#">
                        Términos y condiciones
                    </a>


                </div>




                {/* Contacto */}

                <div className="footer-column">


                    <h3>
                        Contacto
                    </h3>


                    <p>
                        📍 Chile
                    </p>

                    <p>
                        📞 +56 9 XXXX XXXX
                    </p>

                    <p>
                        ✉ contacto@ferreplast.cl
                    </p>


                    <p>
                        💳 Transbank
                    </p>

                    <p>
                        🏦 Transferencia bancaria
                    </p>


                </div>


            </div>



            <div className="footer-bottom">


                <p>
                    © 2026 Ferreplast. Todos los derechos reservados.
                </p>


            </div>


        </footer>

    );

}


export default Footer;