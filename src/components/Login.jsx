import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/login.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        correo: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            const respuesta = await apiService.login(formData);

            if (respuesta?.accessToken) {
                localStorage.setItem('accessToken', respuesta.accessToken);
                try {
                    let payloadBase64 = respuesta.accessToken.split('.')[1];
                    payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
                    const payloadDecoded = JSON.parse(atob(payloadBase64));
                    if (payloadDecoded.role) {
                        localStorage.setItem('userRole', payloadDecoded.role);
                    }
                } catch (e) {
                    console.error('Error al decodificar token JWT', e);
                }
            }
            if (respuesta?.name) {
                localStorage.setItem('userName', respuesta.name);
            }

            navigate('/conferencias');
        } catch (err) {
            setError(err.message || 'No se pudo iniciar sesión.');
            console.error('Error al iniciar sesión:', err);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-hero">
                    <img
                        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        alt="Conferencia"
                        className="login-hero-img"
                    />
                    <div className="login-hero-text">
                        <h2 className="login-hero-title">Gestiona tus eventos</h2>
                        <p className="login-hero-desc">
                            La plataforma más completa para organizar y asistir a conferencias de primer nivel.
                        </p>
                    </div>
                </div>

                <div className="login-panel">
                    <div className="login-panel-head">
                        <h2 className="login-panel-title">Iniciar Sesión</h2>
                        <p className="login-panel-desc">Por favor ingresa tus credenciales para continuar.</p>
                    </div>

                    {error && (
                        <div className="login-alert">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div>
                            <label className="sf-label" htmlFor="login-correo">
                                Correo electrónico
                            </label>
                            <input
                                id="login-correo"
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                placeholder="ejemplo@correo.com"
                                required
                                className="sf-input login-input"
                            />
                        </div>

                        <div>
                            <div className="login-field-row">
                                <label className="sf-label" htmlFor="login-password">
                                    Contraseña
                                </label>
                                <a href="#" className="login-forgot">¿Olvidaste tu contraseña?</a>
                            </div>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="sf-input login-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="sf-btn-primary login-submit"
                        >
                            {cargando ? 'Ingresando...' : 'Ingresar a la plataforma'}
                        </button>
                    </form>

                    <div className="login-footer">
                        ¿No tienes una cuenta? <Link to="/registro" className="sf-link">Regístrate aquí</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
