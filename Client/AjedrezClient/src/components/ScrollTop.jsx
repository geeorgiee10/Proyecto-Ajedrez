import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**Componente para volver a la parte más alta de la página web al cambiar de componente */
export function ScrollTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
        top: 0,
        behavior: "smooth", 
      });
  }, [pathname]);

  return null;
}
