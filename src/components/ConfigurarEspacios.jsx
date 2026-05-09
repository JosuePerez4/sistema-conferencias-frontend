import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/configurar-espacios.css';

const ConfigurarEspacios = () => {
    const { conferenceId } = useParams();

    const [conferencia, setConferencia] = useState(null);
    const [espacios, setEspacios] = useState([]);
    const [cargandoEspacios, setCargandoEspacios] = useState(true);

    const [formData, setFormData] = useState({
        day: '',
        room: '',
        topic: '',
        startTime: '',
        endTime: '',
        capacity: '10',
    });

    const [guardando, setGuardando] = useState(false);
    const [eliminandoId, setEliminandoId] = useState(null);
    const [exito, setExito] = useState('');
    const [error, setError] = useState('');

    const cargarDatos = async () => {
        setCargandoEspacios(true);
        try {
            const [conf, lista] = await Promise.allSettled([
                apiService.obtenerConferencia(conferenceId),
                apiService.obtenerSalas(conferenceId),
            ]);
            if (conf.status === 'fulfilled') setConferencia(conf.value);
            if (lista.status === 'fulfilled') {
                setEspacios(Array.isArray(lista.value) ? lista.value : []);
            }
        } catch {
        } finally {
            setCargandoEspacios(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [conferenceId]);

    const topicosDisponibles = conferencia?.topics ?? [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Convierte "04:00 p. m." o "4:00 PM" o "16:00" → "16:00:00"
    const a24h = (horaStr) => {
        if (!horaStr) return '';
        if (/^\d{2}:\d{2}$/.test(horaStr)) return `${horaStr}:00`;
        const match = horaStr.match(/(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)/i);
        if (!match) return `${horaStr}:00`;
        let h = parseInt(match[1]);
        const m = match[2];
        const periodo = match[3].replace(/\s|\./g, '').toLowerCase();
        if (periodo === 'pm' && h !== 12) h += 12;
        if (periodo === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}:00`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.day)          { setError('Selecciona un día.');              return; }
        if (!formData.room.trim())  { setError('Escribe el nombre de la sala.');   return; }
        if (!formData.topic.trim()) { setError('Selecciona o escribe un tópico.'); return; }
        if (!formData.startTime)    { setError('Indica la hora de inicio.');       return; }
        if (!formData.endTime)      { setError('Indica la hora de fin.');          return; }
        if (formData.endTime <= formData.startTime) {
            setError('La hora de fin debe ser posterior a la de inicio.');
            return;
        }

        setGuardando(true);
        setError('');
        setExito('');

        try {
            const salaCreada = await apiService.crearSala(conferenceId, {
                name: formData.room,
                capacity: Number(formData.capacity),
                type: 'PRESENCIAL',
                locationOrLink: 'Por definir',
                topicHints: formData.topic,
            });

            await apiService.crearSlotAgenda(conferenceId, {
                day: formData.day,
                roomId: salaCreada.id,
                topic: formData.topic,
                startTime: a24h(formData.startTime),
                endTime: a24h(formData.endTime),
                maxPapers: Number(formData.capacity),
            });

            setExito('¡Espacio y franja horaria creados con éxito!');
            setFormData({ day: formData.day, room: '', topic: formData.topic, startTime: '', endTime: '', capacity: '10' });
            setTimeout(() => setExito(''), 3000);
            await cargarDatos();
        } catch (err) {
            setError(err.message || 'Error al guardar el espacio.');
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async () => {
        setError('La eliminación de espacios aún no está disponible en el backend.');
    };

    const diasDisponibles = (() => {
        if (!conferencia?.startDate || !conferencia?.endDate) return [];
        const dias = [];
        // Generamos todos los días sin filtrar por fecha actual (permite fechas pasadas en demo)
        const cur = new Date(conferencia.startDate + 'T00:00:00');
        const fin = new Date(conferencia.endDate + 'T00:00:00');
        while (cur <= fin) {
            dias.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
        }
        return dias;
    })();

    const formatearFecha = (iso) => {
        if (!iso) return '—';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="ce-container">
            <div className="ce-header">
                <Link to="/conferencias" className="ce-back-link">← Volver a conferencias</Link>
                <h1 className="ce-title">Configurar Espacios de Presentación</h1>
                {conferencia && (
                    <p className="ce-subtitle">
                        {conferencia.name} &nbsp;·&nbsp;
                        {formatearFecha(conferencia.startDate)} – {formatearFecha(conferencia.endDate)}
                    </p>
                )}
            </div>

            {exito && (
                <div className="ce-alert ce-alert-success">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {exito}
                </div>
            )}
            {error && (
                <div className="ce-alert ce-alert-error">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="ce-layout">
                <section className="ce-card ce-form-section">
                    <h2 className="ce-section-title">Nuevo espacio</h2>
                    <form onSubmit={handleSubmit} className="ce-form" noValidate>

                        <div className="ce-field">
                            <label htmlFor="ce-day">Día de presentación *</label>
                            {diasDisponibles.length > 0 ? (
                                <select id="ce-day" name="day" value={formData.day} onChange={handleChange} className="ce-select" required>
                                    <option value="">Selecciona un día</option>
                                    {diasDisponibles.map((d) => (
                                        <option key={d} value={d}>{formatearFecha(d)}</option>
                                    ))}
                                </select>
                            ) : (
                                <input id="ce-day" type="date" name="day" value={formData.day} onChange={handleChange} className="ce-input" required />
                            )}
                        </div>

                        <div className="ce-field">
                            <label htmlFor="ce-room">Nombre de la sala *</label>
                            <input id="ce-room" type="text" name="room" value={formData.room} onChange={handleChange} placeholder="Ej. Sala A – Auditorio Principal" className="ce-input" required />
                        </div>

                        <div className="ce-field">
                            <label htmlFor="ce-topic">Tópico asignado *</label>
                            {topicosDisponibles.length > 0 ? (
                                <select id="ce-topic" name="topic" value={formData.topic} onChange={handleChange} className="ce-select" required>
                                    <option value="">Selecciona un tópico</option>
                                    {topicosDisponibles.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            ) : (
                                <input id="ce-topic" type="text" name="topic" value={formData.topic} onChange={handleChange} placeholder="Ej. Ingeniería de Software" className="ce-input" required />
                            )}
                            <p className="ce-field-help">Los tópicos se toman de la conferencia seleccionada.</p>
                        </div>

                        <div className="ce-grid-2">
                            <div className="ce-field">
                                <label htmlFor="ce-start">Hora inicio *</label>
                                <input id="ce-start" type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="ce-input" required />
                            </div>
                            <div className="ce-field">
                                <label htmlFor="ce-end">Hora fin *</label>
                                <input id="ce-end" type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="ce-input" required />
                            </div>
                        </div>

                        <div className="ce-field">
                            <label htmlFor="ce-capacity">Capacidad máxima (artículos) *</label>
                            <input id="ce-capacity" type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" max="100" className="ce-input" required />
                        </div>

                        <div className="ce-form-actions">
                            <button type="submit" disabled={guardando} className="ce-btn ce-btn-primary">
                                {guardando ? 'Guardando...' : '+ Crear espacio'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="ce-card ce-list-section">
                    <h2 className="ce-section-title">
                        Espacios configurados
                        <span className="ce-badge">{espacios.length}</span>
                    </h2>

                    {cargandoEspacios ? (
                        <div className="ce-skeleton-list">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="ce-skeleton-row">
                                    <div className="ce-skeleton ce-skeleton-text" style={{ width: '30%' }} />
                                    <div className="ce-skeleton ce-skeleton-text" style={{ width: '25%' }} />
                                    <div className="ce-skeleton ce-skeleton-text" style={{ width: '20%' }} />
                                </div>
                            ))}
                        </div>
                    ) : espacios.length === 0 ? (
                        <div className="ce-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                            <p>Aún no hay espacios configurados.</p>
                            <span>Crea el primero usando el formulario.</span>
                        </div>
                    ) : (
                        <div className="ce-table-wrapper">
                            <table className="ce-table">
                                <thead>
                                    <tr>
                                        <th>Sala</th>
                                        <th>Tópicos</th>
                                        <th>Tipo</th>
                                        <th>Cap.</th>
                                        <th>Ubicación</th>
                                        <th aria-label="Acciones"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {espacios.map((esp) => (
                                        <tr key={esp.id}>
                                            <td>{esp.name}</td>
                                            <td><span className="ce-chip">{esp.topicHints || '—'}</span></td>
                                            <td>{esp.type}</td>
                                            <td className="ce-center">{esp.capacity}</td>
                                            <td>{esp.locationOrLink || '—'}</td>
                                            <td className="ce-center">
                                                <button
                                                    onClick={() => handleEliminar(esp.id)}
                                                    disabled={eliminandoId === esp.id}
                                                    className="ce-btn-icon ce-btn-danger"
                                                    aria-label="Eliminar espacio"
                                                    title="Eliminar"
                                                >
                                                    {eliminandoId === esp.id ? '…' : (
                                                        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ConfigurarEspacios;