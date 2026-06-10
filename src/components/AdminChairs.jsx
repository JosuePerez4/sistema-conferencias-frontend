import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/components/admin-chairs.css';

const AdminChairs = () => {
    const [chairs, setChairs] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

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

    const handleActivar = async (id) => {
        try {
            await apiService.activarChair(id);
            alert('El usuario CHAIR ha sido activado correctamente en el backend.');
            await cargarChairs(); // Refrescar lista desde la BD
        } catch (err) {
            alert('Error al activar el usuario: ' + err.message);
        }
    };

    const handleDesactivar = (id) => {
        // Mantenemos la lógica local para desactivar hasta que el backend la implemente
        const nuevosChairs = chairs.map(chair => {
            if (chair.id === id) {
                return { ...chair, estado: 'INACTIVO' };
            }
            return chair;
        });
        setChairs(nuevosChairs);
        alert('Usuario desactivado localmente (Falta endpoint en backend)');
    };

    return (
        <div className="admin-chairs-container">
            <div className="admin-chairs-header">
                <h1 className="admin-chairs-title">Activar Usuarios CHAIR</h1>
                <p className="admin-chairs-subtitle">Gestiona la activación de los usuarios registrados como evaluadores (CHAIRS).</p>
            </div>

            <div className="admin-chairs-card">
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
                                                onClick={() => handleActivar(chair.id)}
                                            >
                                                Activar Usuario
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn-desactivar"
                                                onClick={() => handleDesactivar(chair.id)}
                                            >
                                                Desactivar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="admin-chairs-note">
                <strong>Nota del desarrollador:</strong> Esta vista funciona mediante estado local simulado, ya que el backend actual no expone endpoints para listar o modificar usuarios.
            </div>
        </div>
    );
};

export default AdminChairs;
