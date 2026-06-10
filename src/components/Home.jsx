import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/home.css';

const Home = () => {
    const userRole = localStorage.getItem('userRole') || '';

    return (
        <div className="home">
            <h1 className="home-title">
                Bienvenido a ConfManager
            </h1>
            <p className="home-text">
                La plataforma líder para descubrir, organizar y asistir a las mejores conferencias del mundo.
            </p>
            <div className="home-actions">
                <Link to="/conferencias" className="home-cta">
                    Explorar Conferencias
                </Link>
                {(userRole === 'ADMIN' || userRole === 'CHAIR') && (
                    <Link to="/salas" className="home-cta home-cta-secondary">
                        Ver Salas
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Home;
