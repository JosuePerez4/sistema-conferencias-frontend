import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/components/landing-conferencia.css'; // Podemos reusar algunos estilos

const InscripcionAsistente = () => {
    const { id } = useParams();
    const [comprobante, setComprobante] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setComprobante(e.target.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!comprobante) {
            setError('Por favor adjunta una imagen del comprobante de pago.');
            return;
        }

        setError('');
        setEnviando(true);

        // Simulamos la llamada al backend
        setTimeout(() => {
            setEnviando(false);
            setExito(true);
        }, 2000);
    };

    if (exito) {
        return (
            <div className="landing-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', backgroundColor: '#fff', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#e6f4ea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                        <svg style={{ color: '#137333', width: '40px', height: '40px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '1.75rem', color: '#202124', marginBottom: '1rem' }}>¡Inscripción Aprobada!</h2>
                    <p style={{ color: '#5f6368', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                        Hemos recibido y validado tu comprobante de pago de manera exitosa. 
                        Tu cupo para la conferencia está asegurado. ¡Te esperamos en el evento!
                    </p>
                    <Link to={`/conferencia/${id}`} className="landing-btn-primary" style={{ display: 'inline-block' }}>
                        Volver a la Conferencia
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-page" style={{ paddingTop: '3rem', minHeight: '80vh' }}>
            <div className="landing-back-link-wrapper" style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '2rem' }}>
                <Link to={`/conferencia/${id}`} className="detalle-back-link" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: '500' }}>
                    ← Volver a la conferencia
                </Link>
            </div>
            
            <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <h1 style={{ fontSize: '1.75rem', color: '#202124', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Completar Inscripción
                </h1>
                <p style={{ color: '#5f6368', textAlign: 'center', marginBottom: '2rem' }}>
                    Sube el comprobante de tu pago para validar tu entrada.
                </p>

                {error && (
                    <div style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: '600', color: '#202124' }}>
                            Comprobante de Pago (Imagen o PDF) *
                        </label>
                        <div style={{ 
                            border: '2px dashed #dadce0', 
                            padding: '2rem', 
                            borderRadius: '8px', 
                            textAlign: 'center',
                            backgroundColor: '#f8f9fa',
                            cursor: 'pointer'
                        }}>
                            <input 
                                type="file" 
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                            {comprobante && (
                                <p style={{ marginTop: '1rem', color: '#1a73e8', fontWeight: '500' }}>
                                    Archivo seleccionado: {comprobante.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={enviando}
                        className="landing-btn-primary"
                        style={{ marginTop: '1rem', width: '100%', opacity: enviando ? 0.7 : 1 }}
                    >
                        {enviando ? 'Validando pago...' : 'Enviar y Completar Compra'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InscripcionAsistente;
