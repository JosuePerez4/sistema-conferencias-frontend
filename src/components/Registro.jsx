import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/registro.css';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    password: '',
    /** Valores iguales al enum Role del auth: ADMIN, CHAIR, AUTHOR, ASISTANT */
    role: 'AUTHOR'
  });

  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!terminosAceptados) {
      setError('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await apiService.registro(formData);
      console.log('Usuario registrado con éxito:', respuesta);
      setExito(true);
      setTimeout(() => {
        navigate('/iniciar-sesion');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar el usuario.');
      console.error('Error completo:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-page">
      <div className="registro-card">
        <div className="registro-form-side">
          <div className="registro-head">
            <h2 className="registro-title">Crea tu cuenta</h2>
            <p className="registro-desc">
              Únete a la red de conferencias más grande. Completa tus datos para empezar.
            </p>
          </div>

          {error && <div className="registro-alert-error">{error}</div>}
          {exito && (
            <div className="registro-alert-success">
              ¡Registro exitoso! Redirigiendo al inicio de sesión...
            </div>
          )}

          <form onSubmit={handleSubmit} className="registro-form">
            <div className="registro-row">
              <div className="registro-half">
                <label className="sf-label" htmlFor="reg-nombre">Nombre</label>
                <input
                  id="reg-nombre"
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Andrés"
                  className="sf-input registro-input-bg"
                />
              </div>
              <div className="registro-half">
                <label className="sf-label" htmlFor="reg-apellido">Apellido</label>
                <input
                  id="reg-apellido"
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Niño"
                  className="sf-input registro-input-bg"
                />
              </div>
            </div>

            <div className="registro-row">
              <div className="registro-half">
                <label className="sf-label" htmlFor="reg-correo">Correo electrónico</label>
                <input
                  id="reg-correo"
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  placeholder="tu@correo.com"
                  className="sf-input registro-input-bg"
                />
              </div>
              <div className="registro-half">
                <label className="sf-label" htmlFor="reg-telefono">Teléfono</label>
                <input
                  id="reg-telefono"
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  placeholder="+57 300 000 0000"
                  className="sf-input registro-input-bg"
                />
              </div>
            </div>

            <div>
              <label className="sf-label" htmlFor="reg-password">Contraseña</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
                className="sf-input registro-input-bg"
              />
            </div>

            <div>
              <label className="sf-label" htmlFor="reg-tipo">Rol en el sistema</label>
              <select
                id="reg-tipo"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="sf-select registro-input-bg"
              >
                <option value="AUTHOR">Autor (envía artículos)</option>
                <option value="ASISTANT">Asistente (evaluación / apoyo)</option>
                <option value="CHAIR">Chair (organizador de la conferencia)</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div className="registro-checkbox-row">
              <input
                id="reg-terminos"
                type="checkbox"
                checked={terminosAceptados}
                onChange={(e) => setTerminosAceptados(e.target.checked)}
                className="registro-checkbox"
              />
              <label htmlFor="reg-terminos" className="registro-checkbox-label">
                Acepto los <a href="#" className="sf-link">Términos y Condiciones</a>
              </label>
            </div>

            <button type="submit" disabled={cargando} className="sf-btn-primary registro-submit">
              {cargando ? 'Enviando datos...' : 'Registrarse ahora'}
            </button>
          </form>

          <div className="registro-footer">
            ¿Ya tienes una cuenta? <Link to="/iniciar-sesion" className="sf-link">Inicia sesión aquí</Link>
          </div>
        </div>

        <div className="registro-hero">
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Networking"
            className="registro-hero-img"
          />
          <div className="registro-hero-text">
            <h3 className="registro-hero-title">Conecta con expertos</h3>
            <p className="registro-hero-desc">
              Accede a más de 500 conferencias anuales y expande tu red de contactos profesionales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;
