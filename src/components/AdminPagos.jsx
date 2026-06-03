import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const AdminPagos = () => {
    const [pagos, setPagos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [imagenPrevisualizacion, setImagenPrevisualizacion] = useState(null);

    const bucketBaseUrl = 'https://paper-service.s3.us-west-004.backblazeb2.com/';

    useEffect(() => {
        const cargarPagos = async () => {
            try {
                setCargando(true);
                // 1. Obtener todas las conferencias
                const conferenciasRes = await apiService.obtenerConferencias();
                const conferencias = Array.isArray(conferenciasRes) ? conferenciasRes : (conferenciasRes?.data || conferenciasRes?.content || []);
                
                const todosLosPagos = [];

                // 2. Por cada conferencia, obtener sus registros (inscripciones)
                for (const conf of conferencias) {
                    const conferenceId = conf.id || conf.conferenceId || conf._id;
                    if (!conferenceId) continue;
                    
                    try {
                        const registros = await apiService.obtenerRegistrosConferencia(conferenceId);
                        // Filtramos solo los que tengan un comprobante subido
                        const registrosConComprobante = registros.filter(r => r.proofObjectKey);
                        
                        registrosConComprobante.forEach(r => {
                            todosLosPagos.push({
                                ...r,
                                conferenceName: conf.name || conf.titulo || 'Conferencia',
                                imageUrl: `${bucketBaseUrl}${r.proofObjectKey}`,
                                // Simulación: Forzamos el estado a PENDING para mostrar el flujo en el frontend
                                paymentStatus: 'PENDING'
                            });
                        });
                    } catch (err) {
                        console.error(`Error al cargar registros para la conferencia ${conferenceId}`, err);
                    }
                }

                // Ordenar por fecha (los más recientes primero)
                todosLosPagos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                setPagos(todosLosPagos);
            } catch (err) {
                setError(err.message || 'Error al cargar las conferencias y los pagos.');
            } finally {
                setCargando(false);
            }
        };

        cargarPagos();
    }, []);

    const handleAprobar = (id) => {
        setPagos(prev => prev.map(p => p.id === id ? { ...p, paymentStatus: 'APPROVED' } : p));
        alert('Pago aprobado (Simulado en frontend)');
    };

    const handleDenegar = (id) => {
        setPagos(prev => prev.map(p => p.id === id ? { ...p, paymentStatus: 'REJECTED' } : p));
        alert('Pago denegado (Simulado en frontend)');
    };

    if (cargando) return <div style={styles.loading}>Cargando pagos recibidos...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Comprobantes de Pago Recibidos</h1>
            <p style={styles.subtitle}>Listado de todos los pagos enviados por los usuarios en todas las conferencias.</p>
            
            {pagos.length === 0 ? (
                <div style={styles.empty}>No hay pagos registrados con comprobante.</div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Conferencia</th>
                                <th style={styles.th}>ID Usuario</th>
                                <th style={styles.th}>Fecha Envío</th>
                                <th style={styles.th}>Estado</th>
                                <th style={styles.th}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagos.map((pago) => (
                                <tr key={pago.id} style={styles.tr}>
                                    <td style={styles.td}><strong>{pago.conferenceName}</strong></td>
                                    <td style={styles.td}><span style={styles.userId}>{pago.userId}</span></td>
                                    <td style={styles.td}>{new Date(pago.createdAt).toLocaleString()}</td>
                                    <td style={styles.td}>
                                        <span style={pago.paymentStatus === 'APPROVED' ? styles.statusBadgeApproved : (pago.paymentStatus === 'REJECTED' ? styles.statusBadgeRejected : styles.statusBadgePending)}>
                                            {pago.paymentStatus}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actionButtons}>
                                            <button 
                                                style={styles.btnPreview}
                                                onClick={() => setImagenPrevisualizacion(pago.imageUrl)}
                                            >
                                                Ver Comprobante
                                            </button>
                                            {pago.paymentStatus === 'PENDING' && (
                                                <>
                                                    <button 
                                                        style={styles.btnApprove}
                                                        onClick={() => handleAprobar(pago.id)}
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button 
                                                        style={styles.btnReject}
                                                        onClick={() => handleDenegar(pago.id)}
                                                    >
                                                        Denegar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Previsualización */}
            {imagenPrevisualizacion && (
                <div style={styles.modalOverlay} onClick={() => setImagenPrevisualizacion(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Previsualización del Comprobante</h3>
                            <button style={styles.closeBtn} onClick={() => setImagenPrevisualizacion(null)}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            <img src={imagenPrevisualizacion} alt="Comprobante de pago" style={styles.modalImage} />
                            <div style={{marginTop: '1rem', textAlign: 'center'}}>
                                <a href={imagenPrevisualizacion} target="_blank" rel="noopener noreferrer" style={styles.linkOpen}>
                                    Abrir en una nueva pestaña
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '80vh'
    },
    title: {
        fontSize: '2rem',
        color: '#1a1a2e',
        marginBottom: '0.5rem'
    },
    subtitle: {
        color: '#666',
        marginBottom: '2rem'
    },
    loading: {
        padding: '3rem',
        textAlign: 'center',
        fontSize: '1.2rem',
        color: '#666'
    },
    error: {
        padding: '2rem',
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '8px',
        margin: '2rem'
    },
    empty: {
        padding: '3rem',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        color: '#666'
    },
    tableContainer: {
        overflowX: 'auto',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    th: {
        backgroundColor: '#1a1a2e',
        color: '#fff',
        padding: '1rem',
        textAlign: 'left',
        fontWeight: '600'
    },
    tr: {
        borderBottom: '1px solid #eee',
    },
    td: {
        padding: '1rem',
        color: '#333'
    },
    userId: {
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: '#555',
        backgroundColor: '#f5f5f5',
        padding: '2px 6px',
        borderRadius: '4px'
    },
    statusBadgePending: {
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#fff3cd',
        color: '#856404',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 'bold'
    },
    statusBadgeApproved: {
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#d4edda',
        color: '#155724',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 'bold'
    },
    statusBadgeRejected: {
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 'bold'
    },
    actionButtons: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
    },
    btnApprove: {
        padding: '0.5rem 1rem',
        backgroundColor: '#28a745',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background 0.2s'
    },
    btnReject: {
        padding: '0.5rem 1rem',
        backgroundColor: '#dc3545',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background 0.2s'
    },
    btnPreview: {
        padding: '0.5rem 1rem',
        backgroundColor: '#e94560',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background 0.2s'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
    },
    modalHeader: {
        padding: '1rem',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        color: '#666'
    },
    modalBody: {
        padding: '1rem',
        overflowY: 'auto'
    },
    modalImage: {
        width: '100%',
        height: 'auto',
        maxHeight: '60vh',
        objectFit: 'contain',
        backgroundColor: '#f5f5f5'
    },
    linkOpen: {
        color: '#1a1a2e',
        textDecoration: 'underline',
        fontWeight: '500'
    }
};

export default AdminPagos;
