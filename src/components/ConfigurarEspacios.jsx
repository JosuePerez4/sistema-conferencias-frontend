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

    // ── Carga inicial: datos de la conferencia + espacios ya creados ──────────
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [conf, lista] = await Promise.allSettled([
                    apiService.obtenerConferencia(conferenceId),
                    apiService.obtenerEspacios(conferenceId),
                ]);

                if (conf.status === 'fulfilled') setConferencia(conf.value);
                if (lista.status === 'fulfilled') {
                    setEspacios(Array.isArray(lista.value) ? lista.value : []);
                }
            } catch {
                // errores manejados por allSettled
            } finally {
                setCargandoEspacios(false);
            }
        };

        cargarDatos();
    }, [conferenceId]);

    // ── Tópicos disponibles: los de la conferencia o texto libre ─────────────
    const topicosDisponibles = conferencia?.topics ?? [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validarFormulario = () => {
        if (!formData.day) return 'Selecciona un día.';
        if (!formData.room.trim()) return 'Escribe el nombre de la sala.';
        if (!formData.topic.trim()) return 'Selecciona o escribe un tópico.';
        if (!formData.startTime) return 'Indica la hora de inicio.';
        if (!formData.endTime) return 'Indica la hora de fin.';
        if (formData.endTime <= formData.startTime) return 'La hora de fin debe ser posterior a la de inicio.';
        if (Number(formData.capacity) < 1) return 'La capacidad debe ser al menos 1.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.endTime <= formData.startTime) {
            setError('La hora de fin debe ser posterior a la de inicio.');
            return;
        }

        setGuardando(true);
        setError('');
        setExito('');

        try {
            // 1. Crear la sala física/virtual
            const salaCreada = await apiService.crearSala(conferenceId, {
                name: formData.room,
                capacity: formData.capacity,
                type: 'PRESENCIAL', // o añadir un toggle en el form si lo deseas
                topicHints: formData.topic
            });

            // 2. Crear la franja de tiempo asignada a esa sala
            await apiService.crearSlotAgenda(conferenceId, {
                day: formData.day,
                roomId: salaCreada.id, // Usamos el ID que devolvió el paso 1
                topic: formData.topic,
                startTime: `${formData.startTime}:00`, // El backend espera HH:MM:SS
                endTime: `${formData.endTime}:00`,
                maxPapers: formData.capacity
            });

            setExito('¡Espacio y franja horaria creados con éxito!');
            setFormData({ ...formData, room: '', startTime: '', endTime: '' });

            // En un flujo real, aquí llamarías de nuevo a obtener agenda/salas para refrescar la tabla
            // cargarDatos(); 

            setTimeout(() => setExito(''), 3000);
        } catch (err) {
            setError(err.message || 'Error al guardar el espacio.');
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (spaceId) => {
        if (!window.confirm('¿Eliminar este espacio de presentación?')) return;
        setEliminandoId(spaceId);
        try {
            await apiService.eliminarEspacio(conferenceId, spaceId);
            setEspacios((prev) => prev.filter((e) => e.id !== spaceId));
        } catch (err) {
            setError(err.message || 'No fue posible eliminar el espacio.');
        } finally {
            setEliminandoId(null);
        }
    };

    // ── Días disponibles entre startDate y endDate de la conferencia ──────────
    const diasDisponibles = (() => {
        if (!conferencia?.startDate || !conferencia?.endDate) return [];
        const dias = [];
        const cur = new Date(conferencia.startDate + 'T00:00:00');
        const fin = new Date(conferencia.endDate + 'T00:00:00');
        while (cur <= fin) {
            dias.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
        }
        return dias;
    })();

    const formatearFecha = (iso) => {
        if (!iso) return iso;
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="ce-container">
            {/* Header */}
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

            {/* Alertas globales */}
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
                {/* ── Formulario ────────────────────────────────────────────── */}
                <section className="ce-card ce-form-section">
                    <h2 className="ce-section-title">Nuevo espacio</h2>

                    <form onSubmit={handleSubmit} className="ce-form" noValidate>
                        {/* Día */}
                        <div className="ce-field">
                            <label htmlFor="ce-day">Día de presentación *</label>
                            {diasDisponibles.length > 0 ? (
                                <select
                                    id="ce-day"
                                    name="day"
                                    value={formData.day}
                                    onChange={handleChange}
                                    className="ce-select"
                                    required
                                >
                                    <option value="">Selecciona un día</option>
                                    {diasDisponibles.map((d) => (
                                        <option key={d} value={d}>{formatearFecha(d)}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id="ce-day"
                                    type="date"
                                    name="day"
                                    value={formData.day}
                                    onChange={handleChange}
                                    className="ce-input"
                                    required
                                />
                            )}
                        </div>

                        {/* Sala */}
                        <div className="ce-field">
                            <label htmlFor="ce-room">Nombre de la sala *</label>
                            <input
                                id="ce-room"
                                type="text"
                                name="room"
                                value={formData.room}
                                onChange={handleChange}
                                placeholder="Ej. Sala A – Auditorio Principal"
                                className="ce-input"
                                required
                            />
                        </div>

                        {/* Tópico */}
                        <div className="ce-field">
                            <label htmlFor="ce-topic">Tópico asignado *</label>
                            {topicosDisponibles.length > 0 ? (
                                <select
                                    id="ce-topic"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    className="ce-select"
                                    required
                                >
                                    <option value="">Selecciona un tópico</option>
                                    {topicosDisponibles.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id="ce-topic"
                                    type="text"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    placeholder="Ej. Ingeniería de Software"
                                    className="ce-input"
                                    required
                                />
                            )}
                            <p className="ce-field-help">Los tópicos se toman de la conferencia seleccionada.</p>
                        </div>

                        {/* Horario */}
                        <div className="ce-grid-2">
                            <div className="ce-field">
                                <label htmlFor="ce-start">Hora inicio *</label>
                                <input
                                    id="ce-start"
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    className="ce-input"
                                    required
                                />
                            </div>
                            <div className="ce-field">
                                <label htmlFor="ce-end">Hora fin *</label>
                                <input
                                    id="ce-end"
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    className="ce-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Capacidad */}
                        <div className="ce-field">
                            <label htmlFor="ce-capacity">Capacidad máxima (artículos) *</label>
                            <input
                                id="ce-capacity"
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                min="1"
                                max="100"
                                className="ce-input"
                                required
                            />
                        </div>

                        <div className="ce-form-actions">
                            <button
                                type="submit"
                                disabled={guardando}
                                className="ce-btn ce-btn-primary"
                            >
                                {guardando ? 'Guardando...' : '+ Crear espacio'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* ── Tabla de espacios ─────────────────────────────────────── */}
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
                                        <th>Día</th>
                                        <th>Sala</th>
                                        <th>Tópico</th>
                                        <th>Horario</th>
                                        <th>Cap.</th>
                                        <th aria-label="Acciones"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {espacios.map((esp) => (
                                        <tr key={esp.id}>
                                            <td>{formatearFecha(esp.day)}</td>
                                            <td>{esp.room}</td>
                                            <td>
                                                <span className="ce-chip">{esp.topic}</span>
                                            </td>
                                            <td className="ce-time-cell">
                                                {esp.startTime} – {esp.endTime}
                                            </td>
                                            <td className="ce-center">{esp.capacity}</td>
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