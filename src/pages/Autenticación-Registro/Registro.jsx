import FormularioRegistro from '../../components/auth/FormularioRegistro'
import './css/Registro.css'

function Registro() {
  return (
    <div className="registro-container">
      <div className="registro-card">
        <h1>Crear cuenta</h1>
        <p className="registro-subtitulo">Todos los campos son obligatorios.</p>
        <FormularioRegistro mode="client" />
      </div>
    </div>
  )
}

export default Registro
