import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/salas-conferencia.css';

const TIPOS_LABEL = {
  PRESENCIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  HIBRIDA: 'Híbrida',
};

const SalasConferencia = () => {
  const { conferenciaId } = useParams();

  const [conferencia, setConferencia] = useState(null);
  const [salas, setSalas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    capacity: '50',
    type: 'PRESENCIAL',
    locationOrLink: '',
    topicHints: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState('');
  const [mostrarFormCrear, setMostrarFormCrear] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [conf, lista] = await Promise.allSettled([
        apiService.obtenerConferencia(conferenciaId),
        apiService.obtenerSalas(conferenciaId),
      ]);
      if (conf.status === 'fulfilled') setConferencia(conf.value);
      if (lista.status === 'fulfilled') setSalas(Array.isArray(lista.value) ? lista.value : []);
    } catch {
      setError('No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [conferenciaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('El nombre de la sala es obligatorio.'); return; }
    if (!formData.locationOrLink.trim()) { setError('La ubicación o enlace es obligatorio.'); return; }

    setGuardando(true);
    setError('');
    setExito('');

    try {
      await apiService.crearSala(conferenciaId, formData);
      setExito('Sala creada correctamente.');
      setFormData({ name: '', capacity: '50', type: 'PRESENCIAL', locationOrLink: '', topicHints: '' });
      setMostrarFormCrear(false);
      setTimeout(() => setExito(''), 3000);
      await cargarDatos();
    } catch (err) {
      setError(err.message || 'Error al crear la sala.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="sc-loading">Cargando salas...</div>;

  return (
    <div className="sc-container">
      <div className="sc-header">
        <Link to={`/conferencia/${conferenciaId}`} className="sc-back-link">← Volver a la conferencia</Link>
        <h1 className="sc-title">Salas de la Conferencia</h1>
        {conferencia && (
          <p className="sc-subtitle">{conferencia.name}</p>
        )}
      </div>

      {exito && (
        <div className="sc-alert sc-alert-success">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {exito}
        </div>
      )}
      {error && (
        <div className="sc-alert sc-alert-error">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <section className="sc-card sc-list-section">
        <div className="sc-section-head">
          <h2 className="sc-section-title sc-section-title--inline">
            Salas registradas
            <span className="sc-badge">{salas.length}</span>
          </h2>
          <button
            type="button"
            className="sc-btn sc-btn-primary sc-btn-header"
            onClick={() => {
              setMostrarFormCrear((v) => !v);
              setError('');
            }}
            aria-expanded={mostrarFormCrear}
          >
            {mostrarFormCrear ? 'Cerrar' : '+ Crear sala'}
          </button>
        </div>

        {mostrarFormCrear && (
          <div className="sc-form-panel">
            <h3 className="sc-form-panel-title">Nueva sala</h3>
            <form onSubmit={handleSubmit} className="sc-form" noValidate>
              <div className="sc-field">
                <label htmlFor="sc-name">Nombre de la sala *</label>
                <input id="sc-name" type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Ej. Auditorio Principal" className="sc-input" required />
              </div>

              <div className="sc-grid-2">
                <div className="sc-field">
                  <label htmlFor="sc-capacity">Capacidad *</label>
                  <input id="sc-capacity" type="number" name="capacity" value={formData.capacity}
                    onChange={handleChange} min="1" max="5000" className="sc-input" required />
                </div>
                <div className="sc-field">
                  <label htmlFor="sc-type">Tipo *</label>
                  <select id="sc-type" name="type" value={formData.type} onChange={handleChange} className="sc-select">
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="VIRTUAL">Virtual</option>
                    <option value="HIBRIDA">Híbrida</option>
                  </select>
                </div>
              </div>

              <div className="sc-field">
                <label htmlFor="sc-location">Ubicación o enlace *</label>
                <input id="sc-location" type="text" name="locationOrLink" value={formData.locationOrLink}
                  onChange={handleChange} placeholder="Ej. Edificio A, Piso 3 / https://meet.google.com/abc"
                  className="sc-input" required />
              </div>

              <div className="sc-field">
                <label htmlFor="sc-topics">Tópicos sugeridos</label>
                <input id="sc-topics" type="text" name="topicHints" value={formData.topicHints}
                  onChange={handleChange} placeholder="Ej. IA, Machine Learning, Cloud"
                  className="sc-input" />
                <p className="sc-field-help">Separa los tópicos con comas. Se usan como guía para asignar artículos.</p>
              </div>

              <div className="sc-form-actions sc-form-actions--row">
                <button type="button" className="sc-btn sc-btn-secondary" disabled={guardando}
                  onClick={() => { setMostrarFormCrear(false); setError(''); }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="sc-btn sc-btn-primary sc-btn-submit-inline">
                  {guardando ? 'Creando...' : 'Guardar sala'}
                </button>
              </div>
            </form>
          </div>
        )}

        {salas.length === 0 ? (
            <div className="sc-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18M10 4v18" />
              </svg>
              <p>No hay salas configuradas aún.</p>
              <span>Pulsa «Crear sala» arriba para añadir la primera.</span>
            </div>
          ) : (
            <div className="sc-grid-cards">
              {salas.map((sala) => (
                <div key={sala.id} className="sc-room-card">
                  <div className="sc-room-header">
                    <h3 className="sc-room-name">{sala.name}</h3>
                    <span className={`sc-room-type sc-room-type--${(sala.type || 'PRESENCIAL').toLowerCase()}`}>
                      {TIPOS_LABEL[sala.type] || sala.type}
                    </span>
                  </div>
                  <div className="sc-room-body">
                    <div className="sc-room-detail">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      <span>Capacidad: <strong>{sala.capacity}</strong></span>
                    </div>
                    <div className="sc-room-detail">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span>{sala.locationOrLink || 'Sin ubicación'}</span>
                    </div>
                    {sala.topicHints && (
                      <div className="sc-room-topics">
                        {sala.topicHints.split(',').map((t, i) => (
                          <span key={i} className="sc-chip">{t.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
};

export default SalasConferencia;
