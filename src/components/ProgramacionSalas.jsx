import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/programacion-salas.css';

function formatearDia(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatearHora(hora) {
  if (!hora) return '';
  const s = String(hora);
  const partes = s.split(':');
  if (partes.length >= 2) return `${partes[0]}:${partes[1]}`;
  return s;
}

export default function ProgramacionSalas() {
  const { conferenciaId } = useParams();

  const [conferencia, setConferencia] = useState(null);
  const [salas, setSalas] = useState([]);
  const [salaActiva, setSalaActiva] = useState(null);
  const [programacion, setProgramacion] = useState([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [loadingProg, setLoadingProg] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setLoadingSalas(true);
    Promise.allSettled([
      apiService.obtenerConferencia(conferenciaId),
      apiService.obtenerSalas(conferenciaId),
    ])
      .then(([confRes, salasRes]) => {
        if (confRes.status === 'fulfilled') setConferencia(confRes.value);
        if (salasRes.status === 'fulfilled') {
          const data = Array.isArray(salasRes.value) ? salasRes.value : [];
          setSalas(data);
          if (data.length > 0) setSalaActiva(data[0]);
        } else {
          setError('No se pudieron cargar las salas.');
        }
      })
      .finally(() => setLoadingSalas(false));
  }, [conferenciaId]);

  useEffect(() => {
    if (!salaActiva) return;
    setLoadingProg(true);
    setProgramacion([]);
    setError(null);
    apiService
      .obtenerAgendaPorSala(conferenciaId, salaActiva.id)
      .then((data) => {
        setError(null);
        setProgramacion(data);
      })
      .catch(() => setError('No se pudo cargar la programación de esta sala.'))
      .finally(() => setLoadingProg(false));
  }, [salaActiva, conferenciaId]);

  const slotsOrdenados = useMemo(() => {
    return [...programacion].sort((a, b) => {
      const da = String(a.day || '');
      const db = String(b.day || '');
      if (da !== db) return da.localeCompare(db);
      return String(a.startTime || '').localeCompare(String(b.startTime || ''));
    });
  }, [programacion]);

  if (loadingSalas) {
    return (
      <div className="ps-page">
        <div className="ps-skeleton-page">
          <div className="ps-skel ps-skel-title" />
          <div className="ps-skel ps-skel-sub" />
          <div className="ps-skeleton-layout">
            <div className="ps-skel ps-skel-sidebar" />
            <div className="ps-skel ps-skel-main" />
          </div>
        </div>
      </div>
    );
  }

  if (error && salas.length === 0) {
    return (
      <div className="ps-page">
        <div className="ps-error-card">
          <svg className="ps-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
          </svg>
          <p>{error}</p>
          <Link to="/conferencias" className="ps-btn-ghost">Volver a conferencias</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-page">
      <header className="ps-hero">
        <Link to={`/conferencia/${conferenciaId}`} className="ps-back">
          <span aria-hidden>←</span> Volver a la conferencia
        </Link>
        <div className="ps-hero-row">
          <div>
            <p className="ps-eyebrow">Agenda del evento</p>
            <h1 className="ps-title">Programación por sala</h1>
            {conferencia?.name && (
              <p className="ps-subtitle">{conferencia.name}</p>
            )}
          </div>
          <div className="ps-hero-badge" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18M8 2v4M16 2v4" />
            </svg>
          </div>
        </div>
      </header>

      {salas.length === 0 ? (
        <div className="ps-empty-state">
          <div className="ps-empty-illu">
            <svg viewBox="0 0 80 80" fill="none" aria-hidden>
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
              <path d="M28 38h24M28 48h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              <rect x="24" y="22" width="32" height="38" rx="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <h2 className="ps-empty-title">Aún no hay salas</h2>
          <p className="ps-empty-text">
            Configura salas y franjas horarias para ver aquí la programación de artículos aprobados.
          </p>
          <Link to={`/conferencia/${conferenciaId}/salas`} className="ps-btn-primary">
            Gestionar salas
          </Link>
        </div>
      ) : (
        <div className="ps-layout">
          <aside className="ps-sidebar" aria-label="Lista de salas">
            <div className="ps-sidebar-head">
              <h2 className="ps-sidebar-title">Salas</h2>
              <span className="ps-sidebar-count">{salas.length}</span>
            </div>
            <ul className="ps-sala-lista">
              {salas.map((sala) => {
                const activa = salaActiva?.id === sala.id;
                return (
                  <li key={sala.id}>
                    <button
                      type="button"
                      className={`ps-sala-btn ${activa ? 'ps-sala-btn--activo' : ''}`}
                      onClick={() => setSalaActiva(sala)}
                      aria-current={activa ? 'true' : undefined}
                    >
                      <span className="ps-sala-icon" aria-hidden>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </span>
                      <span className="ps-sala-text">
                        <span className="ps-sala-nombre">{sala.name}</span>
                        <span className="ps-sala-tipo">{sala.type || 'PRESENCIAL'}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <main className="ps-main">
            {salaActiva && (
              <section className="ps-room-card">
                <div className="ps-room-accent" aria-hidden />
                <div className="ps-room-inner">
                  <h3 className="ps-room-name">{salaActiva.name}</h3>
                  <div className="ps-room-meta">
                    <span className="ps-room-pill">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden>
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {salaActiva.locationOrLink || 'Ubicación por definir'}
                    </span>
                    <span className="ps-room-pill">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden>
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Capacidad {salaActiva.capacity}
                    </span>
                  </div>
                  {salaActiva.topicHints && (
                    <>
                      <p className="ps-room-topics-label">Tópicos de la sala</p>
                      <div className="ps-room-chips">
                        {salaActiva.topicHints.split(',').map((t, i) => (
                          <span key={i} className="ps-chip">{t.trim()}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {loadingProg ? (
              <div className="ps-prog-loading">
                <div className="ps-spinner" aria-hidden />
                <p>Cargando franjas…</p>
              </div>
            ) : error ? (
              <div className="ps-inline-error">{error}</div>
            ) : slotsOrdenados.length === 0 ? (
              <div className="ps-prog-empty">
                <div className="ps-prog-empty-icon" aria-hidden>
                  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 20h32M8 28h20" strokeLinecap="round" />
                    <rect x="6" y="10" width="36" height="30" rx="3" />
                    <circle cx="16" cy="36" r="2" fill="currentColor" stroke="none" opacity="0.3" />
                  </svg>
                </div>
                <h3 className="ps-prog-empty-title">Sin franjas en esta sala</h3>
                <p className="ps-prog-empty-text">
                  Cuando un artículo sea <strong>aprobado</strong>, el sistema puede asignarlo aquí según el tópico y la configuración de espacios.
                </p>
              </div>
            ) : (
              <div className="ps-timeline">
                <h3 className="ps-timeline-heading">Franjas programadas</h3>
                <ul className="ps-slot-list">
                  {slotsOrdenados.map((slot, index) => {
                    const max = slot.maxPapers > 0 ? slot.maxPapers : 1;
                    const pct = Math.min(100, Math.round((slot.assignedCount / max) * 100));
                    return (
                      <li key={slot.id ?? `${slot.day}-${slot.startTime}-${index}`} className="ps-slot-item">
                        <div className="ps-slot-rail" aria-hidden>
                          <span className="ps-slot-dot" />
                          {index < slotsOrdenados.length - 1 && <span className="ps-slot-line" />}
                        </div>
                        <article className="ps-slot-card">
                          <div className="ps-slot-head">
                            <time className="ps-slot-date" dateTime={slot.day}>
                              {formatearDia(slot.day)}
                            </time>
                            <span className="ps-slot-time">
                              {formatearHora(slot.startTime)} — {formatearHora(slot.endTime)}
                            </span>
                          </div>
                          <h4 className="ps-slot-topic">{slot.topic}</h4>
                          <div className="ps-slot-foot">
                            <span className="ps-slot-count">
                              <strong>{slot.assignedCount}</strong>
                              <span className="ps-slot-count-sep">/</span>
                              {slot.maxPapers} artículos
                            </span>
                            <div className="ps-slot-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                              <div className="ps-slot-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
