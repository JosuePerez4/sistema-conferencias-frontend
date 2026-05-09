import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/evaluar-articulo.css';

const RESULTADOS = [
  { value: 'ACCEPTED', label: '✅ Aprobado' },
  { value: 'REJECTED', label: '❌ Rechazado' },
  { value: 'REVISION',  label: '🔄 Revisión requerida' },
];

export default function EvaluarArticulo() {
  const { conferenciaId, paperId } = useParams();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ result: '', comments: '' });
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito]       = useState(false);
  const [notifs, setNotifs]     = useState([]);
  const [error, setError]       = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.result) { setError('Debes seleccionar un resultado.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await apiService.evaluarPaper(conferenciaId, paperId, {
        result:   form.result,
        comments: form.comments,
      });
      setExito(true);
      setTimeout(async () => {
        try {
          const n = await apiService.obtenerNotificacionesPaper(paperId);
          setNotifs(n);
        } catch (_) {}
      }, 1500);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Error al registrar la evaluación.');
    } finally {
      setEnviando(false);
    }
  };

  if (exito) {
    return (
      <div className="ea-container">
        <div className="ea-exito">
          <span className="ea-exito-icono">🎉</span>
          <h3>Evaluación registrada correctamente</h3>
          <p>
            {form.result === 'ACCEPTED'
              ? 'El artículo fue aprobado. La programación de presentación se genera automáticamente.'
              : 'Se ha notificado a los autores del resultado.'}
          </p>

          {notifs.length > 0 && (
            <div className="ea-notifs">
              <h4>Notificaciones enviadas</h4>
              {notifs.map((n) => (
                <div key={n.id} className="ea-notif-item">
                  <span>{n.recipientEmail}</span>
                  <span className={`ea-notif-status ea-notif-status--${n.status.toLowerCase()}`}>
                    {n.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="ea-acciones">
            <button
              className="ea-btn ea-btn--secondary"
              onClick={() => navigate(`/conference/${conferenceId}/evaluaciones`)}
            >
              Volver a la bandeja
            </button>
            {form.result === 'ACCEPTED' && (
              <button
                className="ea-btn ea-btn--primary"
                onClick={() => navigate(`/conference/${conferenceId}/programacion`)}
              >
                Ver programación
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ea-container">
      <button className="ea-btn-back" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      <h2 className="ea-titulo">Registrar Evaluación</h2>
      <p className="ea-subtitulo">
        Al guardar, se notificará automáticamente a los autores del artículo.
      </p>

      <form className="ea-form" onSubmit={handleSubmit}>
        <div className="ea-campo">
          <label className="ea-label">Resultado *</label>
          <div className="ea-radio-grupo">
            {RESULTADOS.map((op) => (
              <label
                key={op.value}
                className={`ea-radio-opcion ${form.result === op.value ? 'ea-radio-opcion--activo' : ''}`}
              >
                <input
                  type="radio"
                  name="result"
                  value={op.value}
                  checked={form.result === op.value}
                  onChange={handleChange}
                />
                {op.label}
              </label>
            ))}
          </div>
        </div>

        <div className="ea-campo">
          <label className="ea-label" htmlFor="comments">Comentarios</label>
          <textarea
            id="comments"
            name="comments"
            className="ea-textarea"
            rows={5}
            placeholder="Escribe aquí tus observaciones para los autores..."
            value={form.comments}
            onChange={handleChange}
          />
        </div>

        {error && <p className="ea-error">{error}</p>}

        <button
          type="submit"
          className="ea-btn ea-btn--primary ea-btn--full"
          disabled={enviando}
        >
          {enviando ? 'Guardando...' : 'Guardar evaluación'}
        </button>
      </form>
    </div>
  );
}