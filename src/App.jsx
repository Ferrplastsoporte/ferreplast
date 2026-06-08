import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Catalogo from './pages/Catalogo'
import AdminProductos from './pages/AdminProductos'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/admin/productos" element={<AdminProductos />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App