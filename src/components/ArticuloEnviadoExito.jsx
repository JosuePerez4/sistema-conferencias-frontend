import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const ArticuloEnviadoExito = () => {
    const { conferenciaId, paperId } = useParams();
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');

    useEffect(() => {
        setUserRole(localStorage.getItem('userRole') || '');
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.iconContainer}>
                    <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                
                <h1 style={styles.title}>¡Artículo Enviado con Éxito!</h1>
                
                <p style={styles.message}>
                    Tu propuesta ha sido registrada correctamente en el sistema. 
                    El comité evaluador revisará tu documento pronto.
                </p>

                {userRole && (
                    <div style={styles.roleBadge}>
                        Registrado con el rol: <strong>{userRole}</strong>
                    </div>
                )}

                <div style={styles.actions}>
                    <Link to={`/conferencia/${conferenciaId}/articulo/${paperId}`} style={styles.btnPrimary}>
                        Ver detalles de mi artículo
                    </Link>
                    <Link to={`/conferencia/${conferenciaId}`} style={styles.btnSecondary}>
                        Volver a la conferencia
                    </Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        backgroundColor: '#f8f9fa',
        padding: '2rem'
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '3rem 2rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        animation: 'fadeInUp 0.5s ease-out'
    },
    iconContainer: {
        color: '#28a745',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'center'
    },
    icon: {
        width: '80px',
        height: '80px',
        animation: 'scaleIn 0.5s ease-out 0.2s both'
    },
    title: {
        fontSize: '2rem',
        color: '#1a1a2e',
        marginBottom: '1rem',
        fontWeight: '700'
    },
    message: {
        fontSize: '1.1rem',
        color: '#6c757d',
        lineHeight: '1.6',
        marginBottom: '2rem'
    },
    roleBadge: {
        display: 'inline-block',
        backgroundColor: '#e9ecef',
        color: '#495057',
        padding: '0.5rem 1rem',
        borderRadius: '50px',
        fontSize: '0.9rem',
        marginBottom: '2rem'
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    btnPrimary: {
        display: 'block',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#e94560',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        transition: 'background-color 0.2s, transform 0.1s'
    },
    btnSecondary: {
        display: 'block',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#f1f3f5',
        color: '#495057',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        transition: 'background-color 0.2s'
    }
};

// Insertando animaciones en el head
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

export default ArticuloEnviadoExito;
