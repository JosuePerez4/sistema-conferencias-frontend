import React, { useState, useEffect } from 'react';
import '../styles/components/admin-chairs.css';

// Usuarios mock por defecto si es la primera vez que se carga
const defaultMockChairs = [
    { id: '1', nombre: 'Carlos Ruiz', correo: 'carlos.ruiz@ejemplo.com', estado: 'INACTIVO' },
    { id: '2', nombre: 'Elena Gómez', correo: 'elena.gomez@ejemplo.com', estado: 'INACTIVO' },
    { id: '3', nombre: 'Javier Ramírez', correo: 'javier.ramirez@ejemplo.com', estado: 'ACTIVO' },
    { id: '4', nombre: 'Lucía Fernández', correo: 'lucia.fernandez@ejemplo.com', estado: 'INACTIVO' }
];

const AdminChairs = () => {
    const [chairs, setChairs] = useState([]);

    useEffect(() => {
        // Al montar, intentamos cargar los usuarios guardados en localStorage
        // Así persistimos la activación de manera local.
        const savedChairs = localStorage.getItem('mockChairs');
        if (savedChairs) {
            try {
                setChairs(JSON.parse(savedChairs));
            } catch (e) {
                setChairs(defaultMockChairs);
            }
        } else {
            setChairs(defaultMockChairs);
            localStorage.setItem('mockChairs', JSON.stringify(defaultMockChairs));
        }
    }, []);

    const handleActivar = (id) => {
        const nuevosChairs = chairs.map(chair => {
            if (chair.id === id) {
                return { ...chair, estado: 'ACTIVO' };
            }
            return chair;
        });
        setChairs(nuevosChairs);
        localStorage.setItem('mockChairs', JSON.stringify(nuevosChairs));
        
        // Simulación de pequeña alerta de éxito
        alert('El usuario CHAIR ha sido activado correctamente (simulado).');
    };

    const handleDesactivar = (id) => {
        const nuevosChairs = chairs.map(chair => {
            if (chair.id === id) {
                return { ...chair, estado: 'INACTIVO' };
            }
            return chair;
        });
        setChairs(nuevosChairs);
        localStorage.setItem('mockChairs', JSON.stringify(nuevosChairs));
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
