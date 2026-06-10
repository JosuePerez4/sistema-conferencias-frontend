import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

const MisArticulos = () => {
    const [misArticulos, setMisArticulos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarMisArticulos = async () => {
            try {
                setCargando(true);
                // Obtenemos el nombre del usuario actual desde localStorage
                // Con esto filtraremos los artículos (porque el backend no guarda el userId en el paper)
                const userNameRaw = localStorage.getItem('userName') || '';
                const userName = userNameRaw.trim().toLowerCase();
                
                if (!userName) {
                    setError('No se pudo identificar tu nombre de usuario. Por favor inicia sesión nuevamente.');
                    setCargando(false);
                    return;
                }

                // 1. Obtener todas las conferencias
                const conferenciasRes = await apiService.obtenerConferencias();
                const conferencias = Array.isArray(conferenciasRes) ? conferenciasRes : (conferenciasRes?.data || conferenciasRes?.content || []);
                
                let todosLosPapers = [];

                // 2. Iterar por cada conferencia y traer todos sus artículos
                for (const conf of conferencias) {
                    const conferenceId = conf.id || conf.conferenceId || conf._id;
                    if (!conferenceId) continue;
                    
                    try {
                        const papers = await apiService.obtenerPapers(conferenceId);
                        const arrPapers = Array.isArray(papers) ? papers : [];
                        
                        arrPapers.forEach(paper => {
                            todosLosPapers.push({
                                ...paper,
                                conferenceName: conf.name || conf.titulo || 'Conferencia',
                                conferenceId: conferenceId
                            });
                        });
                    } catch (err) {
                        console.warn(`No se pudieron cargar artículos para la conferencia ${conferenceId}`, err);
                    }
                }

                // 3. Filtro Local: Buscar donde el campo 'authors' incluya el userName
                const misPapersFiltrados = todosLosPapers.filter(p => {
                    if (!p.authors) return false;
                    const authorsLower = typeof p.authors === 'string' 
                      ? p.authors.toLowerCase() 
                      : (Array.isArray(p.authors) ? p.authors.map(a => typeof a === 'object' ? (a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim()) : String(a)).join(' ').toLowerCase() : '');
                    return authorsLower.includes(userName);
                });

                setMisArticulos(misPapersFiltrados);
            } catch (err) {
                setError(err.message || 'Error al cargar tus artículos.');
            } finally {
                setCargando(false);
            }
        };

        cargarMisArticulos();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUBMITTED': return { bg: '#e3f2fd', color: '#1565c0', label: 'Enviado' };
            case 'UNDER_REVIEW': return { bg: '#fff3cd', color: '#856404', label: 'En Revisión' };
            case 'ACCEPTED': return { bg: '#d4edda', color: '#155724', label: 'Aceptado' };
            case 'REJECTED': return { bg: '#f8d7da', color: '#721c24', label: 'Rechazado' };
            default: return { bg: '#f5f5f5', color: '#333', label: status || 'Desconocido' };
        }
    };

    if (cargando) return <div style={styles.loading}>Buscando tus artículos en todas las conferencias...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Mis Artículos</h1>
                <p style={styles.subtitle}>Aquí puedes hacer seguimiento al estado de todas las ponencias que has enviado.</p>
            </div>
            
            {misArticulos.length === 0 ? (
                <div style={styles.empty}>
                    <h3 style={{marginBottom: '1rem'}}>No hemos encontrado artículos a tu nombre</h3>
                    <p>Asegúrate de que al enviar tu ponencia hayas incluido tu nombre exacto <strong>"{localStorage.getItem('userName')}"</strong> en el campo "Autores".</p>
                    <Link to="/conferencias" style={styles.btnPrimary}>Explorar Conferencias</Link>
                </div>
            ) : (
                <div style={styles.grid}>
                    {misArticulos.map((paper) => {
                        const statusBadge = getStatusColor(paper.status);
                        return (
                            <div key={paper.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor: statusBadge.bg,
                                        color: statusBadge.color
                                    }}>
                                        {statusBadge.label}
                                    </span>
                                    <span style={styles.confName}>{paper.conferenceName}</span>
                                </div>
                                <div style={styles.cardBody}>
                                    <h3 style={styles.paperTitle}>{paper.title}</h3>
                                    <p style={styles.paperTopic}><strong>Tema:</strong> {paper.topic}</p>
                                    <p style={styles.paperAuthors}><strong>Autores:</strong> {typeof paper.authors === 'string' ? paper.authors : (Array.isArray(paper.authors) ? paper.authors.map(a => typeof a === 'object' ? (a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim()) : String(a)).join(', ') : 'Sin autores')}</p>
                                    
                                    {paper.evaluationObservations && (
                                        <div style={styles.observations}>
                                            <strong>Observaciones de evaluación:</strong>
                                            <p>{paper.evaluationObservations}</p>
                                        </div>
                                    )}
                                </div>
                                <div style={styles.cardFooter}>
                                    <Link 
                                        to={`/conferencia/${paper.conferenceId}/articulo/${paper.id}`} 
                                        style={styles.btnSecondary}
                                    >
                                        Ver Detalles
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
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
        minHeight: '80vh',
        backgroundColor: '#fafbfc'
    },
    header: {
        marginBottom: '2.5rem'
    },
    title: {
        fontSize: '2.2rem',
        color: '#1a1a2e',
        marginBottom: '0.5rem',
        fontWeight: 'bold'
    },
    subtitle: {
        color: '#666',
        fontSize: '1.1rem'
    },
    loading: {
        padding: '4rem',
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
        padding: '4rem 2rem',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: '12px',
        color: '#666',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '2rem'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 6px 15px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        overflow: 'hidden'
    },
    cardHeader: {
        padding: '1.25rem',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fbfbfb'
    },
    badge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '50px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    confName: {
        fontSize: '0.85rem',
        color: '#888',
        fontWeight: '500',
        maxWidth: '150px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    cardBody: {
        padding: '1.5rem',
        flexGrow: 1
    },
    paperTitle: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#222',
        marginBottom: '1rem',
        lineHeight: '1.4'
    },
    paperTopic: {
        fontSize: '0.95rem',
        color: '#555',
        marginBottom: '0.5rem'
    },
    paperAuthors: {
        fontSize: '0.95rem',
        color: '#555',
        marginBottom: '1rem'
    },
    observations: {
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#fff8e1',
        borderLeft: '4px solid #ffc107',
        fontSize: '0.9rem',
        color: '#555'
    },
    cardFooter: {
        padding: '1.25rem',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    btnPrimary: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#e94560',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        display: 'inline-block'
    },
    btnSecondary: {
        padding: '0.5rem 1rem',
        backgroundColor: '#f0f0f0',
        color: '#333',
        textDecoration: 'none',
        borderRadius: '6px',
        fontWeight: '600',
        transition: 'background-color 0.2s'
    }
};

export default MisArticulos;
