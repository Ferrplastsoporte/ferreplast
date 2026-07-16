import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import Home from './pages/Home/Home'
import Catalogo from './pages/Catalogo'
import AdminProductos from './pages/AdminProductos'
import Registro from './pages/Registro'
import Carrito from './pages/Carrito'
import FloatingButtons from "./components/FloatingButtons";

function App() {

  return (

    <BrowserRouter>

      <Navbar />
      <FloatingButtons />
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/catalogo" element={<Catalogo />} />

        <Route path="/admin/productos" element={<AdminProductos />} />

        <Route path="/carrito" element={<Carrito />} />

        <Route path="/registro" element={<Registro />} />
        


      </Routes>

    </BrowserRouter>

  )

}


export default App