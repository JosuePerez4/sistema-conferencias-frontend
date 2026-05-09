import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/bandeja-evaluacion.css';

export default function BandejaEvaluacion() {
  const { conferenciaId } = useParams();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('accessToken');
   if (!token) {
   navigate('/iniciar-sesion');
   return null;
  }

  useEffect(() => {
    apiService.obtenerBandejaEvaluacion(conferenciaId)
      .then(setPapers)
      .catch(() => setError('No se pudo cargar la bandeja de evaluación.'))
      .finally(() => setLoading(false));
  }, [conferenciaId]);

  if (loading) return <div className="be-loading">Cargando artículos...</div>;
  if (error)   return <div className="be-error">{error}</div>;

  return (
    <div className="be-container">
      <h2 className="be-titulo">Bandeja de Evaluación</h2>

      {papers.length === 0 ? (
        <div className="be-vacio">
          <p>No hay artículos pendientes de evaluación.</p>
        </div>
      ) : (
        <div className="be-lista">
          {papers.map((paper) => (
            <div key={paper.id} className="be-card">
              <div className="be-card-info">
                <h3 className="be-card-titulo">{paper.title}</h3>
                <p className="be-card-meta">
                  <span className="be-badge be-badge--topic">{paper.topic}</span>
                  <span className="be-badge be-badge--estado">{paper.status}</span>
                </p>
                {paper.authors && (
                  <p className="be-card-autores">
                    Autores: {Array.isArray(paper.authors)
                      ? paper.authors.join(', ')
                      : paper.authors}
                  </p>
                )}
              </div>
              <button
                className="be-btn-evaluar"
                onClick={() =>
                  navigate(`/conferencia/${conferenciaId}/articulo/${paper.id}#evaluar-articulo`)
                }
              >
                Evaluar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}