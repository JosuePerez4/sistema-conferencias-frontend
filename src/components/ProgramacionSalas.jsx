import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/programacion-salas.css';

export default function ProgramacionSalas() {
  const { conferenciaId } = useParams();

  const [salas, setSalas]               = useState([]);
  const [salaActiva, setSalaActiva]     = useState(null);
  const [programacion, setProgramacion] = useState([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [loadingProg, setLoadingProg]   = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    apiService.obtenerSalas(conferenciaId)
      .then((data) => {
        setSalas(data);
        if (data.length > 0) setSalaActiva(data[0]);
      })
      .catch(() => setError('No se pudieron cargar las salas.'))
      .finally(() => setLoadingSalas(false));
  }, [conferenciaId]);

  useEffect(() => {
    if (!salaActiva) return;
    setLoadingProg(true);
    setProgramacion([]);
    apiService.obtenerAgendaPorSala(conferenciaId, salaActiva.id)
      .then(setProgramacion)
      .catch(() => setError('No se pudo cargar la programación de esta sala.'))
      .finally(() => setLoadingProg(false));
  }, [salaActiva, conferenciaId]);

  if (loadingSalas) return <div className="ps-loading">Cargando salas...</div>;
  if (error)        return <div className="ps-error">{error}</div>;

  return (
    <div className="ps-container">
      <h2 className="ps-titulo">Programación por Sala</h2>

      {salas.length === 0 ? (
        <div className="ps-vacio">
          <p>No hay salas configuradas para esta conferencia.</p>
        </div>
      ) : (
        <div className="ps-layout">
          <aside className="ps-sidebar">
            <h3 className="ps-sidebar-titulo">Salas</h3>
            <ul className="ps-sala-lista">
              {salas.map((sala) => (
                <li key={sala.id}>
                  <button
                    className={`ps-sala-btn ${salaActiva?.id === sala.id ? 'ps-sala-btn--activo' : ''}`}
                    onClick={() => setSalaActiva(sala)}
                  >
                    <span className="ps-sala-nombre">{sala.name}</span>
                    <span className="ps-sala-tipo">{sala.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="ps-main">
            {salaActiva && (
              <div className="ps-sala-header">
                <h3>{salaActiva.name}</h3>
                <p className="ps-sala-detalle">
                  {salaActiva.locationOrLink} · Capacidad: {salaActiva.capacity}
                </p>
                {salaActiva.topicHints && (
                  <p className="ps-sala-topics">Tópicos: {salaActiva.topicHints}</p>
                )}
              </div>
            )}

            {loadingProg ? (
              <div className="ps-loading-prog">Cargando programación...</div>
            ) : programacion.length === 0 ? (
              <div className="ps-vacio-prog">
                <p>No hay artículos programados en esta sala aún.</p>
                <small>Los artículos aprobados se asignan automáticamente tras la evaluación.</small>
              </div>
            ) : (
              <div className="ps-slots">
                {programacion.map((slot) => (
                  <div key={slot.id} className="ps-slot-card">
                    <div className="ps-slot-tiempo">
                      <span>{slot.day}</span>
                      <span>{slot.startTime} – {slot.endTime}</span>
                    </div>
                    <div className="ps-slot-info">
                      <h4 className="ps-slot-topic">{slot.topic}</h4>
                      <p className="ps-slot-papers">
                        {slot.assignedCount} / {slot.maxPapers} artículos asignados
                      </p>
                    </div>
                    <div className="ps-slot-barra">
                      <div
                        className="ps-slot-barra-fill"
                        style={{ width: `${(slot.assignedCount / slot.maxPapers) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}