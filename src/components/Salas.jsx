import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/salas.css';

const TIPO_LABEL = { PRESENCIAL: 'Presencial', VIRTUAL: 'Virtual', HIBRIDA: 'Híbrida' };

const Salas = () => {
  const [salas, setSalas] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [salasFiltradas, setSalasFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarSalas = useCallback(async () => {
    setError('');
    setCargando(true);
    try {
      const conferencias = await apiService.obtenerConferencias();
      const listado = Array.isArray(conferencias) ? conferencias : (conferencias?.data || conferencias?.content || []);

      const promesas = listado.map(async (conf) => {
        const confId = conf.id ?? conf.conferenceId ?? conf._id;
        if (!confId) return [];
        try {
          const rooms = await apiService.obtenerSalas(confId);
          return (Array.isArray(rooms) ? rooms : []).map((r) => ({
            ...r,
            conferenciaNombre: conf.name || conf.titulo || 'Sin nombre',
            conferenciaId: String(confId),
          }));
        } catch {
          return [];
        }
      });

      const resultados = (await Promise.all(promesas)).flat();
      setSalas(resultados);
      setSalasFiltradas(resultados);
    } catch (err) {
      setError(err.message || 'No fue posible cargar las salas.');
      setSalas([]);
      setSalasFiltradas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSalas();
  }, [cargarSalas]);

  const terminoNormalizado = useMemo(
    () => terminoBusqueda.trim().toLowerCase(),
    [terminoBusqueda]
  );

  const handleBuscar = () => {
    if (!terminoNormalizado) {
      setSalasFiltradas(salas);
      return;
    }
    const resultados = salas.filter((s) => {
      const nombre = (s.name || '').toLowerCase();
      const conf = (s.conferenciaNombre || '').toLowerCase();
      const topic = (s.topicHints || '').toLowerCase();
      return nombre.includes(terminoNormalizado) || conf.includes(terminoNormalizado) || topic.includes(terminoNormalizado);
    });
    setSalasFiltradas(resultados);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBuscar();
  };

  const handleLimpiar = () => {
    setTerminoBusqueda('');
    setSalasFiltradas(salas);
  };

  return (
    <div className="salas-page">
      <div className="salas-toolbar">
        <div>
          <h1 className="salas-title">Salas Disponibles</h1>
          <p className="salas-subtitle">Explora todas las salas configuradas en las conferencias.</p>
        </div>

        <div className="salas-search-row">
          <div className="salas-search-wrap">
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre, conferencia o tópico..."
              className="salas-search-input"
            />
            {terminoBusqueda.length > 0 && (
              <button type="button" onClick={handleLimpiar} className="salas-search-clear" aria-label="Limpiar búsqueda">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <button type="button" onClick={handleBuscar} className="salas-btn-buscar">
            Buscar
          </button>
        </div>
      </div>

      {cargando && (
        <div className="salas-loading">Cargando salas...</div>
      )}

      {error && !cargando && (
        <div className="salas-error">
          <h3 className="salas-error-title">No pudimos obtener las salas</h3>
          <p className="salas-error-text">{error}</p>
          <button type="button" onClick={cargarSalas} className="salas-btn-retry">
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <div className="salas-grid">
          {salasFiltradas.length > 0 ? (
            salasFiltradas.map((sala, idx) => (
              <div key={sala.id ?? `sala-${idx}`} className="salas-card">
                <div className="salas-card-icon-wrap">
                  <svg className="salas-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M3 10h18M10 4v18" />
                  </svg>
                  <span className={`salas-card-type salas-card-type--${(sala.type || 'PRESENCIAL').toLowerCase()}`}>
                    {TIPO_LABEL[sala.type] || sala.type || 'Presencial'}
                  </span>
                </div>

                <div className="salas-card-body">
                  <div className="salas-card-meta">
                    <Link to={`/conferencia/${sala.conferenciaId}`} className="salas-card-conf">
                      {sala.conferenciaNombre}
                    </Link>
                    <span className="salas-card-capacity">{sala.capacity} personas</span>
                  </div>

                  <h3 className="salas-card-name">{sala.name}</h3>

                  <p className="salas-card-location">
                    {sala.locationOrLink || 'Ubicación por definir'}
                  </p>

                  {sala.topicHints && (
                    <div className="salas-card-topics">
                      {sala.topicHints.split(',').map((t, i) => (
                        <span key={i} className="salas-card-chip">{t.trim()}</span>
                      ))}
                    </div>
                  )}

                  <div className="salas-card-footer">
                    <Link to={`/conferencia/${sala.conferenciaId}/salas`} className="salas-card-link">
                      Ver salas de la conferencia →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="salas-empty">
              <h3 className="salas-empty-title">No se encontraron salas</h3>
              <p className="salas-empty-text">Prueba buscando con otros términos o verifica que las conferencias tengan salas configuradas.</p>
              <button type="button" onClick={handleLimpiar} className="salas-empty-link">
                Ver todas las salas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Salas;
