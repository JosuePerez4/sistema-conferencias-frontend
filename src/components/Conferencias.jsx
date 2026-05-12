import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/conferencias.css';


const Conferencias = () => {
    const imagenFallback = 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    const [eventos, setEventos] = useState([]);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [eventosFiltrados, setEventosFiltrados] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [estaLogueado] = useState(() => Boolean(localStorage.getItem('accessToken')));
    const [userRole] = useState(() => localStorage.getItem('userRole') || '');

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Fecha por confirmar';
        const valor = String(fecha);
        const soloFecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
        const fechaNormalizada = soloFecha
            ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
            : new Date(valor);

        if (Number.isNaN(fechaNormalizada.getTime())) return 'Fecha por confirmar';
        return fechaNormalizada.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const mapearConferencia = (conferencia) => {
        const fechaRaw = conferencia?.startDate || conferencia?.fecha || conferencia?.date;
        const fechaFormateada = formatearFecha(fechaRaw);

        const precioNumero = Number(conferencia?.inscriptionPrice ?? conferencia?.precio ?? 0);
        const precioFormateado = Number.isFinite(precioNumero) && precioNumero > 0
            ? `$${precioNumero} USD`
            : 'Gratis';

        const idCrudo = conferencia?.id ?? conferencia?.conferenceId ?? conferencia?._id ?? null;

        return {
            id: idCrudo !== null && idCrudo !== undefined ? String(idCrudo) : null,
            titulo: conferencia?.name || conferencia?.titulo || 'Conferencia sin título',
            fecha: fechaFormateada,
            lugar: conferencia?.location || conferencia?.lugar || 'Ubicación por confirmar',
            imagen: conferencia?.imageUrl || conferencia?.imagen || imagenFallback,
            categoria: conferencia?.category || conferencia?.categoria || 'General',
            precio: precioFormateado,
            modalidad: Boolean(conferencia?.virtual) ? 'Virtual' : 'Presencial',
            modalidadClase: Boolean(conferencia?.virtual) ? 'virtual' : 'presencial',
            ponentes: Array.isArray(conferencia?.speakers)
                ? conferencia.speakers
                : (conferencia?.speakerName ? [conferencia.speakerName] : [])
        };
    };

    const cargarConferencias = useCallback(async () => {
        setError('');
        setCargando(true);
        try {
            const respuesta = await apiService.obtenerConferencias();
            const listado = Array.isArray(respuesta) ? respuesta : (respuesta?.data || respuesta?.content || []);
            const conferenciasMapeadas = listado.map(mapearConferencia);
            setEventos(conferenciasMapeadas);
            setEventosFiltrados(conferenciasMapeadas);
        } catch (err) {
            setError(err.message || 'No fue posible cargar las conferencias.');
            setEventos([]);
            setEventosFiltrados([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarConferencias();
    }, [cargarConferencias]);

    const terminoBusquedaNormalizado = useMemo(
        () => terminoBusqueda.trim().toLowerCase(),
        [terminoBusqueda]
    );

    const handleBuscar = () => {
        if (!terminoBusquedaNormalizado) {
            setEventosFiltrados(eventos);
            return;
        }
        const resultados = eventos.filter((evento) => {
            const tituloMinuscula = evento.titulo.toLowerCase();
            const categoriaMinuscula = evento.categoria.toLowerCase();
            return tituloMinuscula.includes(terminoBusquedaNormalizado) || categoriaMinuscula.includes(terminoBusquedaNormalizado);
        });
        setEventosFiltrados(resultados);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleBuscar();
    };

    const handleLimpiar = () => {
        setTerminoBusqueda('');
        setEventosFiltrados(eventos);
    };

    return (
        <div className="conferencias-page">
            <div className="conferencias-toolbar">
                <div>
                    <h1 className="conferencias-title">Conferencias Disponibles</h1>
                    <p className="conferencias-subtitle">Descubre y asiste a los mejores eventos de la industria.</p>
                </div>

                <div className="conferencias-search-row">
                    <div className="conferencias-search-wrap">
                        <input
                            type="text"
                            value={terminoBusqueda}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar por nombre o tema..."
                            className="conferencias-search-input"
                        />
                        {terminoBusqueda.length > 0 && (
                            <button
                                type="button"
                                onClick={handleLimpiar}
                                className="conferencias-search-clear"
                                aria-label="Limpiar búsqueda"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button type="button" onClick={handleBuscar} className="conferencias-btn-buscar">
                        Buscar
                    </button>
                </div>
            </div>

            {cargando && (
                <div className="conferencias-loading">Cargando conferencias...</div>
            )}

            {error && !cargando && (
                <div className="conferencias-error">
                    <h3 className="conferencias-error-title">No pudimos obtener las conferencias</h3>
                    <p className="conferencias-error-text">{error}</p>
                    <button type="button" onClick={cargarConferencias} className="conferencias-btn-retry">
                        Reintentar
                    </button>
                </div>
            )}

            {!cargando && !error && (
                <div className="conferencias-grid">
                    {eventosFiltrados.length > 0 ? (
                        eventosFiltrados.map((evento, idx) => (
                            <div key={evento.id ?? `sin-id-${idx}-${evento.titulo}`} className="conferencias-card">
                                <div className="conferencias-card-img-wrap">
                                    <img
                                        src={evento.imagen}
                                        alt={evento.titulo}
                                        className="conferencias-card-img"
                                    />
                                    <div className="conferencias-card-badge">
                                        {evento.categoria}
                                    </div>
                                </div>

                                <div className="conferencias-card-body">
                                    <div className="conferencias-card-meta">
                                        <p className="conferencias-card-date">{evento.fecha}</p>
                                        <span className="conferencias-card-price">{evento.precio}</span>
                                    </div>

                                    <h3 className="conferencias-card-title">{evento.titulo}</h3>

                                    <p className="conferencias-card-place">📍 {evento.lugar}</p>
                                    <p className="conferencias-card-mode">
                                        <span className={`conferencias-card-mode-pill conferencias-card-mode-pill--${evento.modalidadClase}`}>
                                            {evento.modalidad}
                                        </span>
                                    </p>

                                    <div className="conferencias-card-footer">
                                        <div>
                                            <span className="conferencias-card-speaker-label">Ponentes:</span>
                                            <span className="conferencias-card-speaker">
                                                {evento.ponentes.length ? evento.ponentes.join(', ') : 'Por confirmar'}
                                            </span>
                                        </div>

                                        {evento.id ? (
                                            <Link to={`/conferencia/${evento.id}`} className="conferencias-card-link">
                                                Ver detalles →
                                            </Link>
                                        ) : (
                                            <span className="conferencias-card-no-id">Detalle no disponible</span>
                                        )}
                                    </div>

                                    {estaLogueado && evento.id && (userRole === 'ADMIN' || userRole === 'CHAIR') && (
                                        <div className="conferencias-card-acciones">
                                            <button
                                                type="button"
                                                className="conferencias-card-accion-btn conferencias-card-accion-btn--programacion"
                                                onClick={() => navigate(`/conferencia/${evento.id}/programacion`)}
                                            >
                                                🗓️ Ver programación
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="conferencias-empty">
                            <h3 className="conferencias-empty-title">No se encontraron conferencias</h3>
                            <p className="conferencias-empty-text">Prueba buscando con otros términos o palabras clave.</p>
                            <button type="button" onClick={handleLimpiar} className="conferencias-empty-link">
                                Ver todas las conferencias
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Conferencias;