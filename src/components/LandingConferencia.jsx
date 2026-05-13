import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/landing-conferencia.css';

const LandingConferencia = () => {
    const { id } = useParams();
    const imagenFallback = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
    const [conferencia, setConferencia] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [userRole] = useState(() => localStorage.getItem('userRole') || '');
    const [userName] = useState(() => localStorage.getItem('userName') || '');
    const [estaLogueado] = useState(() => Boolean(localStorage.getItem('accessToken')));
    const [misArticulos, setMisArticulos] = useState([]);
    const [estadoPagoAsistente, setEstadoPagoAsistente] = useState(null);
    const [cargandoEstadoPago, setCargandoEstadoPago] = useState(false);

    const esAsistente = useMemo(() => {
        const r = (userRole || '').toUpperCase();
        return r === 'ASISTANT' || r === 'ASSISTANT';
    }, [userRole]);

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

    useEffect(() => {
        const cargarDetalle = async () => {
            setCargando(true);
            setError('');
            try {
                const respuesta = await apiService.obtenerConferencia(id);
                setConferencia(respuesta);
            } catch (err) {
                setError(err.message || 'No fue posible cargar la conferencia.');
            } finally {
                setCargando(false);
            }
        };

        const cargarArticulosAutor = async () => {
            if (userRole !== 'AUTHOR' || !estaLogueado) return;
            try {
                const res = await apiService.obtenerPapers(id);
                const lista = Array.isArray(res) ? res : (res?.data || res?.content || []);
                // Filtrar por nombre de usuario en la lista de autores
                const filtrados = lista.filter(p => {
                    const autoresStr = Array.isArray(p.authors) ? p.authors.join(' ') : String(p.authors || '');
                    return autoresStr.toLowerCase().includes(userName.toLowerCase());
                });
                setMisArticulos(filtrados);
            } catch (e) {
                console.error('Error cargando artículos del autor:', e);
            }
        };

        const cargarEstadoPagoAsistente = async () => {
            if (!estaLogueado || !esAsistente || !id) {
                setEstadoPagoAsistente(null);
                return;
            }
            setCargandoEstadoPago(true);
            setEstadoPagoAsistente(null);
            try {
                const s = await apiService.obtenerEstadoPagoInscripcion(id);
                setEstadoPagoAsistente(s);
            } catch {
                setEstadoPagoAsistente({ paid: false, registrationId: null, paymentStatus: null });
            } finally {
                setCargandoEstadoPago(false);
            }
        };

        cargarDetalle();
        cargarArticulosAutor();
        cargarEstadoPagoAsistente();
    }, [id, userRole, estaLogueado, userName, esAsistente]);

    const detalle = useMemo(() => {
        if (!conferencia) return null;
        const precioNumero = Number(conferencia?.inscriptionPrice ?? conferencia?.precio ?? 0);
        const precioFormateado = Number.isFinite(precioNumero) && precioNumero > 0
            ? `$${precioNumero} USD`
            : 'Gratis';
        const speakers = Array.isArray(conferencia?.speakers)
            ? conferencia.speakers
            : (conferencia?.speakerName ? [conferencia.speakerName] : []);
        const topics = Array.isArray(conferencia?.topics)
            ? conferencia.topics
            : (conferencia?.topic ? [conferencia.topic] : []);
        return {
            titulo: conferencia?.name || conferencia?.titulo || 'Conferencia sin título',
            descripcion: conferencia?.description || conferencia?.descripcion || 'Sin descripción disponible.',
            categoria: conferencia?.category || conferencia?.categoria || 'General',
            fechaInicio: formatearFecha(conferencia?.startDate || conferencia?.fecha || conferencia?.date),
            fechaFin: formatearFecha(conferencia?.endDate),
            fechaEntregaArticulos: formatearFecha(conferencia?.submissionDeadline),
            lugar: conferencia?.location || conferencia?.lugar || 'Ubicación por confirmar',
            modalidad: Boolean(conferencia?.virtual) ? 'Virtual' : 'Presencial',
            imagen: conferencia?.imageUrl || conferencia?.imagen || imagenFallback,
            precio: precioFormateado,
            speakers,
            topics
        };
    }, [conferencia]);

    if (cargando) {
        return <div className="landing-loading">Cargando detalles de la conferencia...</div>;
    }

    if (error) {
        return (
            <div className="landing-error-wrap">
                <div className="landing-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="landing-page">
            <div className="landing-hero">
                <img
                    src={detalle?.imagen}
                    alt="Conferencia Hero"
                    className="landing-hero-img"
                />
                <div className="landing-hero-inner">
                    <div className="landing-hero-content">
                        <span className="landing-badge">
                            {detalle?.categoria}
                        </span>
                        <h1 className="landing-hero-title">
                            {detalle?.titulo}
                        </h1>
                        <p className="landing-hero-desc">
                            {detalle?.descripcion}
                        </p>
                        <div className="landing-meta-row">
                            <div className="landing-meta-pill">
                                📅 Inicio: {detalle?.fechaInicio}
                            </div>
                            <div className="landing-meta-pill">
                                📍 {detalle?.lugar}
                            </div>
                            <div className="landing-meta-pill">
                                🖥️ {detalle?.modalidad}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="landing-body-wrap">
                <div className="landing-columns">
                    <div className="landing-main">
                        <section className="landing-section-spaced">
                            <h2 className="landing-section-title">Acerca del evento</h2>
                            <p className="landing-text">
                                {detalle?.descripcion}
                            </p>
                            <p className="landing-text">
                                <strong>Ponentes:</strong> {detalle?.speakers?.length ? detalle.speakers.join(', ') : 'Por confirmar'}
                            </p>
                            <p className="landing-text">
                                <strong>Tópicos:</strong> {detalle?.topics?.length ? detalle.topics.join(', ') : 'Por confirmar'}
                            </p>
                        </section>

                        {userRole === 'AUTHOR' && misArticulos.length > 0 && (
                            <section className="landing-section-spaced" style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                                <h2 className="landing-section-title" style={{ color: '#1a73e8' }}>Mis Artículos</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {misArticulos.map(art => (
                                        <div key={art.id} style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#202124' }}>{art.title}</h4>
                                                <span style={{ 
                                                    fontSize: '0.8rem', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    backgroundColor: art.status === 'REJECTED' ? '#fce8e6' : (art.status === 'ACCEPTED' ? '#e6f4ea' : '#fef7e0'),
                                                    color: art.status === 'REJECTED' ? '#c5221f' : (art.status === 'ACCEPTED' ? '#137333' : '#b06000'),
                                                    fontWeight: '600'
                                                }}>
                                                    {art.status}
                                                </span>
                                            </div>
                                            <Link to={`/conferencia/${id}/articulo/${art.id}`} style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>
                                                Ver Detalles →
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="landing-agenda">
                            <h2 className="landing-section-title">Fechas del evento</h2>
                            <div>
                                <div className="landing-agenda-item">
                                    <div className="landing-agenda-label">Inicio</div>
                                    <div>
                                        <h3 className="landing-agenda-title">{detalle?.fechaInicio}</h3>
                                        <p className="landing-agenda-sub">Fecha de inicio reportada por el backend.</p>
                                    </div>
                                </div>
                                <div className="landing-agenda-item">
                                    <div className="landing-agenda-label">Fin</div>
                                    <div>
                                        <h3 className="landing-agenda-title">{detalle?.fechaFin}</h3>
                                        <p className="landing-agenda-sub">Fecha de finalización del evento.</p>
                                    </div>
                                </div>
                                <div className="landing-agenda-item">
                                    <div className="landing-agenda-label">Entrega</div>
                                    <div>
                                        <h3 className="landing-agenda-title">{detalle?.fechaEntregaArticulos}</h3>
                                        <p className="landing-agenda-sub">Fecha límite de envío de artículos.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="landing-sidebar">
                        <div className="landing-sidebar-card">
                            <h3 className="landing-price-title">Inscripción General</h3>
                            <p className="landing-price-desc">
                                {detalle?.modalidad === 'Virtual'
                                    ? 'Acceso completo al evento en modalidad virtual.'
                                    : 'Acceso a los 3 días del evento presencial.'}
                            </p>
                            <div className="landing-price-amount">{detalle?.precio}</div>
                            <ul className="landing-benefits">
                                <li>✓ Acceso a todas las charlas</li>
                                <li>✓ Almuerzo y Coffee Breaks</li>
                                <li>✓ Certificado de asistencia digital</li>
                                <li>✓ Fiesta de Networking</li>
                            </ul>
                            {esAsistente && cargandoEstadoPago && (
                                <p className="landing-price-desc" style={{ marginTop: '0.75rem' }}>
                                    Consultando el estado de tu inscripción…
                                </p>
                            )}
                            {esAsistente && !cargandoEstadoPago && estadoPagoAsistente?.paid && (
                                <p
                                    className="landing-price-desc"
                                    style={{ marginTop: '0.75rem', color: '#137333', fontWeight: 600 }}
                                >
                                    Tu inscripción está activa y el pago fue aprobado. ¡Nos vemos en el evento!
                                </p>
                            )}
                            {esAsistente &&
                                !cargandoEstadoPago &&
                                estadoPagoAsistente &&
                                !estadoPagoAsistente.paid &&
                                estadoPagoAsistente.paymentStatus === 'PENDING' && (
                                    <p
                                        className="landing-price-desc"
                                        style={{ marginTop: '0.75rem', color: '#b06000', fontWeight: 600 }}
                                    >
                                        Tu comprobante está en revisión. Te avisaremos cuando el pago quede aprobado.
                                    </p>
                                )}
                            {esAsistente &&
                                !cargandoEstadoPago &&
                                estadoPagoAsistente &&
                                !estadoPagoAsistente.paid &&
                                estadoPagoAsistente.paymentStatus !== 'PENDING' && (
                                    <Link to={`/conferencia/${id}/inscripcion`} className="landing-btn-primary">
                                        Comprar Entrada
                                    </Link>
                                )}
                            {userRole === 'ADMIN' && (
                                <Link to={`/editar-conferencia/${id}`} className="landing-btn-secondary">
                                    Editar Conferencia
                                </Link>
                            )}
                            {userRole === 'ADMIN' && (
                                <Link to={`/conferencia/${id}/espacios`} className="landing-btn-secondary">
                                    Configurar Espacios
                                </Link>
                            )}
                            {userRole === 'ADMIN' && (
                                <Link to={`/conferencia/${id}/salas`} className="landing-btn-secondary">
                                    Ver Salas
                                </Link>
                            )}
                            {userRole === 'CHAIR' && (
                                <Link to={`/conferencia/${id}/evaluaciones`} className="landing-btn-secondary">
                                    Evaluar Artículos
                                </Link>
                            )}
                            {userRole === 'AUTHOR' && (
                                <Link to={`/enviar-articulo/${id}`} className="landing-btn-secondary">
                                    Enviar Artículo
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingConferencia;
