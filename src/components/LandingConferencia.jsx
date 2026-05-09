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

        cargarDetalle();
    }, [id]);

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
                            <button type="button" className="landing-btn-primary">
                                Comprar Entrada
                            </button>
                            <Link to={`/editar-conferencia/${id}`} className="landing-btn-secondary">
                                Editar Conferencia
                            </Link>
                            <Link to={`/conferencia/${id}/configurar-espacios`} className="landing-btn-secondary">
                                Configurar Espacios
                            </Link>
                            <Link to={`/conferencia/${id}/salas`} className="landing-btn-secondary">
                                Ver Salas
                            </Link>
                            <Link to={`/enviar-articulo/${id}`} className="landing-btn-secondary">
                                Enviar Artículo
                            </Link>
                            <p className="landing-stripe-note">
                                Ventas seguras procesadas a través de Stripe.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingConferencia;
