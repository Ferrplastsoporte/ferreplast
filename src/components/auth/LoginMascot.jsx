function LoginMascot() {
  return (
    <div className="login-mascot" aria-hidden="true">

      <div className="mascot-seal">

        {/* Cabeza */}
        <div className="mascot-seal__head">

          {/* Orejas / laterales */}
          <span className="mascot-seal__ear mascot-seal__ear--left" />
          <span className="mascot-seal__ear mascot-seal__ear--right" />

          {/* Cara */}
          <div className="mascot-seal__face">

            <span className="mascot-seal__eye mascot-seal__eye--left" />
            <span className="mascot-seal__eye mascot-seal__eye--right" />

            <span className="mascot-seal__nose" />

            <span className="mascot-seal__mouth" />

            {/* Bigotes */}
            <span className="mascot-seal__whisker mascot-seal__whisker--l1" />
            <span className="mascot-seal__whisker mascot-seal__whisker--l2" />
            <span className="mascot-seal__whisker mascot-seal__whisker--r1" />
            <span className="mascot-seal__whisker mascot-seal__whisker--r2" />

          </div>
        </div>


        {/* Cuerpo */}
        <div className="mascot-seal__body" />


        {/* Aleta izquierda */}
        <span className="mascot-seal__flipper mascot-seal__flipper--left" />

        {/* Aleta derecha */}
        <span className="mascot-seal__flipper mascot-seal__flipper--right" />


        {/* Cola */}
        <div className="mascot-seal__tail">
          <span />
          <span />
        </div>

      </div>


      {/* Brillos */}
      <span className="login-mascot__spark login-mascot__spark--one">
        ✦
      </span>

      <span className="login-mascot__spark login-mascot__spark--two">
        ✦
      </span>

    </div>
  );
}

export default LoginMascot;