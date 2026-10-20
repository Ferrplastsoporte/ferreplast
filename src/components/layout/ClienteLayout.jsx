import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import BotonesFlotantes from "./BotonesFlotantes";
import Footer from "./Footer";

function ClienteLayout() {
  return (
    <>
      <Navbar />
      <BotonesFlotantes />
      <Outlet />
      <Footer />
    </>
  );
}

export default ClienteLayout;
