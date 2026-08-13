import LoginForm from '../../components/auth/LoginForm'
import './css/Login.css'

function Login() {
  return (
    <main className="login-container">
      <section className="login-card">
        <div className="login-header">
          <h1>Iniciar sesión</h1>
          <p>Ingresa con tu correo electrónico y contraseña.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  )
}

export default Login