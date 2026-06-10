import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/components/admin-chairs.css';

const AdminChairs = () => {
    const [chairs, setChairs] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);

    const cargarChairs = async () => {
        try {
            setCargando(true);
            const data = await apiService.obtenerChairs();
            // Transformamos datos si el backend retorna diferente estructura o usamos directamente
            const chairsFormateadas = data.map(c => ({
                id: c.id,
                nombre: c.firstName + ' ' + c.lastName,
                correo: c.email,
                estado: c.isActive ? 'ACTIVO' : 'INACTIVO'
            }));
            setChairs(chairsFormateadas);
            setError(null);
        } catch (err) {
            setError('Hubo un error al cargar los usuarios CHAIR. Verifica tu conexión.');
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarChairs();
    }, []);

    const handleActivar = async (id, nombre) => {
        setError(null);
        setExito(null);
        try {
            await apiService.activarChair(id);
            // Actualizamos localmente el estado sin recargar de la BD de inmediato para más fluidez
            setChairs(chairs.map(chair => chair.id === id ? { ...chair, estado: 'ACTIVO' } : chair));
            setExito(`El usuario ${nombre} ha sido activado correctamente.`);
            setTimeout(() => setExito(null), 4000); // Ocultar mensaje después de 4s
        } catch (err) {
            setError('Error al activar el usuario: ' + err.message);
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleDesactivar = async (id, nombre) => {
        setError(null);
        setExito(null);
        try {
            await apiService.desactivarChair(id);
            setChairs(chairs.map(chair => chair.id === id ? { ...chair, estado: 'INACTIVO' } : chair));
            setExito(`El usuario ${nombre} ha sido desactivado correctamente.`);
            setTimeout(() => setExito(null), 4000);
        } catch (err) {
            setError('Error al desactivar el usuario: ' + err.message);
            setTimeout(() => setError(null), 4000);
        }
    };

    return (
        <div className="admin-chairs-container">
            <div className="admin-chairs-header">
                <h1 className="admin-chairs-title">Activar Usuarios CHAIR</h1>
                <p className="admin-chairs-subtitle">Gestiona la activación de los usuarios registrados como evaluadores (CHAIRS).</p>
            </div>

            {exito && (
                <div style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ceead6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✅ {exito}
                </div>
            )}
            
            {error && (
                <div style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fad2cf', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ❌ {error}
                </div>
            )}

            <div className="admin-chairs-card">
                {cargando ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Cargando usuarios...</div>
                ) : error ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#c62828' }}>{error}</div>
                ) : chairs.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No hay usuarios registrados con el rol CHAIR en la base de datos.</div>
                ) : (
                <div className="table-responsive">
                    <table className="admin-chairs-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo Electrónico</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chairs.map(chair => (
                                <tr key={chair.id}>
                                    <td><strong>{chair.nombre}</strong></td>
                                    <td>{chair.correo}</td>
                                    <td>
                                        <span className={chair.estado === 'ACTIVO' ? 'badge-activo' : 'badge-inactivo'}>
                                            {chair.estado}
                                        </span>
                                    </td>
                                    <td>
                                        {chair.estado === 'INACTIVO' ? (
                                            <button 
                                                className="btn-activar"
                                                onClick={() => handleActivar(chair.id, chair.nombre)}
                                            >
                                                Activar Usuario
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#137333', fontWeight: 'bold' }}>✅ Activado</span>
                                                <button 
                                                    onClick={() => handleDesactivar(chair.id, chair.nombre)}
                                                    style={{ 
                                                        backgroundColor: '#fce8e6', 
                                                        color: '#c5221f', 
                                                        border: '1px solid #fad2cf', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '4px', 
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.backgroundColor = '#fad2cf'}
                                                    onMouseOut={(e) => e.target.style.backgroundColor = '#fce8e6'}
                                                >
                                                    Desactivar
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        </div>
    );
};

export default AdminChairs;
