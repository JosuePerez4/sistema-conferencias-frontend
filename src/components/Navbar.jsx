import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/components/navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [estaLogueado, setEstaLogueado] = useState(Boolean(localStorage.getItem('accessToken')));
  const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('userName') || '');

  // Se re-evalúa cada vez que cambia la ruta (ej: después del login)
  useEffect(() => {
    setEstaLogueado(Boolean(localStorage.getItem('accessToken')));
    setNombreUsuario(localStorage.getItem('userName') || '');
  }, [location]);

  const handleCerrarSesion = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userName');
    setEstaLogueado(false);
    setNombreUsuario('');
    navigate('/iniciar-sesion');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            Conf<span className="navbar-logo-muted">Manager</span>
          </Link>
        </div>

        <div className="navbar-links">
          <Link to="/" className="navbar-link">Inicio</Link>
          <Link to="/conferencias" className="navbar-link">Conferencias</Link>
          <Link to="/salas" className="navbar-link">Salas</Link>
          <Link to="/crear-conferencia" className="navbar-link-create">
            <span className="navbar-link-create-icon">+</span> Crear Evento
          </Link>
          <div className="navbar-divider" aria-hidden="true" />

          {estaLogueado ? (
            <>
              {nombreUsuario && (
                <span className="navbar-username">👤 {nombreUsuario}</span>
              )}
              <button
                onClick={handleCerrarSesion}
                className="navbar-auth navbar-logout"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/iniciar-sesion" className="navbar-auth">
                Iniciar Sesión
              </Link>
              <Link to="/registro" className="navbar-register">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;