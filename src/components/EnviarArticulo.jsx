import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/enviar-articulo.css';

function normalizarIdConferencia(raw) {
  const s = raw != null ? String(raw).trim() : '';
  if (!s) return null;
  const soloDigitos = /^\d+$/.test(s);
  if (soloDigitos) {
    const n = Number(s);
    if (Number.isFinite(n) && n > 0) return n;
    return null;
  }
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  return uuid ? s : null;
}

const EnviarArticulo = () => {
  const { conferenciaId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titulo: '',
    abstractText: '',
    topic: '',
    institutionalAffiliation: '',
    keywords: '',
    authors: '',
  });

  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setArchivos(list);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const title = formData.titulo.trim();
    const abstractText = formData.abstractText.trim();
    const topic = formData.topic.trim();
    const institutionalAffiliation = formData.institutionalAffiliation.trim();
    const keywords = formData.keywords.trim();
    const authors = formData.authors.trim();

    if (!title || !abstractText || !topic || !institutionalAffiliation || !keywords || !authors) {
      setError('Todos los campos de texto son obligatorios y no pueden quedar en blanco.');
      return;
    }

    setCargando(true);

    try {
      const conferenceIdResolved = normalizarIdConferencia(conferenciaId);
      if (conferenceIdResolved == null) {
        throw new Error('La conferencia no es válida o no se pudo identificar.');
      }

      /** PaperCreateDto — todos string, camelCase */
      const payloadPaper = {
        title,
        abstractText,
        topic,
        institutionalAffiliation,
        keywords,
        authors,
      };

      /** Una sola petición: multipart paper (JSON) + files opcionales */
      const paperCreado = await apiService.crearPaper(conferenceIdResolved, payloadPaper, archivos);
      const paperId = paperCreado?.id ?? paperCreado?.paperId;
      if (!paperId) {
        throw new Error('El servidor no confirmó la creación del artículo. Intenta de nuevo.');
      }

      setExito(true);
      setTimeout(() => {
        navigate(
          `/conferencia/${encodeURIComponent(conferenceIdResolved)}/articulo-enviado/${encodeURIComponent(paperId)}`
        );
      }, 2000);
    } catch (err) {
      setError(err.message || 'No se pudo enviar el artículo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="enviar-page">
      <div className="enviar-header">
        <Link to={`/conferencia/${conferenciaId}`} className="enviar-back">
          ← Volver a la conferencia
        </Link>
        <h1 className="enviar-title">Enviar Artículo / Ponencia</h1>
        <p className="enviar-subtitle">Sube tu propuesta para esta conferencia.</p>
      </div>

      <div className="enviar-card">
        {exito && (
          <div className="enviar-alert-success">
            ¡Tu artículo ha sido enviado con éxito para revisión!
          </div>
        )}
        {error && (
          <div className="enviar-alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="enviar-form">
          <div>
            <label className="sf-label" htmlFor="enviar-titulo">Título *</label>
            <input
              id="enviar-titulo"
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-abstractText">Resumen (abstractText) *</label>
            <textarea
              id="enviar-abstractText"
              name="abstractText"
              value={formData.abstractText}
              onChange={handleChange}
              required
              rows="4"
              className="sf-textarea"
              placeholder="Resumen o abstract completo del trabajo"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-topic">Tema / área temática *</label>
            <input
              id="enviar-topic"
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              placeholder="Ej. Inteligencia artificial"
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-affiliation">Afiliación institucional *</label>
            <input
              id="enviar-affiliation"
              type="text"
              name="institutionalAffiliation"
              value={formData.institutionalAffiliation}
              onChange={handleChange}
              required
              placeholder="Ej. Universidad X"
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-keywords">Palabras clave *</label>
            <input
              id="enviar-keywords"
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              required
              placeholder="Ej. machine learning; NLP; evaluación"
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-authors">Autores *</label>
            <input
              id="enviar-authors"
              type="text"
              name="authors"
              value={formData.authors}
              onChange={handleChange}
              required
              placeholder="Ej. Ana López; Juan Pérez"
              className="sf-input"
            />
            <p className="enviar-field-hint">Un solo texto (backend: string; puedes separar con punto y coma).</p>
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-file">Adjuntos iniciales (opcional)</label>
            <div className="enviar-upload-wrap">
              <label className="enviar-dropzone">
                <div className="enviar-dropzone-inner">
                  <svg className="enviar-upload-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="enviar-dropzone-hint">
                    <strong>Haz clic para elegir</strong> uno o varios archivos
                  </p>
                  <p className="enviar-dropzone-note">PDF, Word, etc.</p>
                </div>
                <input
                  id="enviar-file"
                  type="file"
                  className="enviar-file-input"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="enviar-field-hint">
              Si no adjuntas nada aquí, el artículo se crea solo con metadatos; podrás subir archivos después desde el detalle.
            </p>
            {archivos.length > 0 && (
              <ul className="enviar-file-list">
                {archivos.map((f) => (
                  <li key={`${f.name}-${f.size}`}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="enviar-actions">
            <button type="submit" disabled={cargando} className="enviar-submit">
              {cargando ? 'Enviando…' : 'Enviar artículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnviarArticulo;
